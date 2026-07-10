from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.conversation_control import ConversationControl
from app.models.notification import Notification
from app.models.takeover import Takeover


CLONE_ALLOWED_MODE = "clone_active"
DEFAULT_COOLDOWN_SECONDS = 30


class InvalidControlTransition(ValueError):
    """Raised when an event is invalid for the current control state."""


@dataclass(frozen=True)
class ControlSnapshot:
    conversation_id: uuid.UUID
    user_id: uuid.UUID
    mode: str
    version: int
    changed_at: datetime
    expires_at: datetime | None
    changed_by: str
    reason: str | None

    @property
    def clone_allowed(self) -> bool:
        return self.mode == CLONE_ALLOWED_MODE


class ConversationControlService:
    """The only write boundary for per-user conversation control state."""

    _TARGET_BY_EVENT = {
        "takeover": "human_active",
        "release": "clone_cooldown",
        "pause": "paused",
        "resume": "clone_active",
        "block": "blocked",
        "unblock": "clone_active",
    }

    _ALLOWED_EVENTS = {
        "clone_active": {"takeover", "pause", "block"},
        "human_active": {"release", "pause", "block"},
        "clone_cooldown": {"takeover", "pause", "resume", "block"},
        "paused": {"takeover", "resume", "block"},
        "blocked": {"unblock"},
    }

    def __init__(self, db: AsyncSession, cooldown_seconds: int = DEFAULT_COOLDOWN_SECONDS):
        self.db = db
        self.cooldown_seconds = cooldown_seconds

    async def snapshot(
        self,
        conversation_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
    ) -> ControlSnapshot:
        control = await self._get_or_create(conversation_id, user_id)
        if (
            control.mode == "clone_cooldown"
            and control.expires_at is not None
            and self._as_utc(control.expires_at) <= datetime.now(timezone.utc)
        ):
            control = await self._apply_transition(
                control,
                target_mode="clone_active",
                actor="system",
                reason="cooldown_expired",
            )
        return self._snapshot(control)

    async def transition(
        self,
        conversation_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
        event: str,
        *,
        actor: str = "human",
        reason: str | None = None,
    ) -> ControlSnapshot:
        if event not in self._TARGET_BY_EVENT:
            raise InvalidControlTransition(f"Unknown control event: {event}")
        if event in {"block", "unblock"} and actor not in {"system", "admin"}:
            raise InvalidControlTransition("Only system or admin actors can change blocked state")

        control = await self._get_or_create(conversation_id, user_id, for_update=True)
        target_mode = self._TARGET_BY_EVENT[event]

        # Repeated commands are deliberately idempotent across REST and WebSocket.
        if control.mode == target_mode:
            return self._snapshot(control)
        if event not in self._ALLOWED_EVENTS[control.mode]:
            raise InvalidControlTransition(
                f"Cannot apply {event} while control mode is {control.mode}"
            )

        return self._snapshot(
            await self._apply_transition(
                control,
                target_mode=target_mode,
                actor=actor,
                reason=reason or event,
            )
        )

    async def clone_reply_allowed(
        self,
        conversation_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
        *,
        expected_version: int | None = None,
    ) -> tuple[bool, ControlSnapshot]:
        snapshot = await self.snapshot(conversation_id, user_id)
        allowed = snapshot.clone_allowed and (
            expected_version is None or snapshot.version == expected_version
        )
        return allowed, snapshot

    async def _get_or_create(
        self,
        conversation_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
        *,
        for_update: bool = False,
    ) -> ConversationControl:
        conversation_uuid = self._as_uuid(conversation_id)
        user_uuid = self._as_uuid(user_id)
        query = select(ConversationControl).where(
            ConversationControl.conversation_id == conversation_uuid,
            ConversationControl.user_id == user_uuid,
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query.execution_options(populate_existing=True))
        control = result.scalar_one_or_none()
        if control is not None:
            return control

        control = ConversationControl(
            conversation_id=conversation_uuid,
            user_id=user_uuid,
            mode="clone_active",
            version=1,
            changed_by="system",
            reason="initialized",
        )
        self.db.add(control)
        try:
            await self.db.commit()
        except IntegrityError:
            # A second device may have initialized the same row concurrently.
            await self.db.rollback()
            result = await self.db.execute(
                query.execution_options(populate_existing=True)
            )
            control = result.scalar_one()
        else:
            await self.db.refresh(control)
        return control

    async def _apply_transition(
        self,
        control: ConversationControl,
        *,
        target_mode: str,
        actor: str,
        reason: str,
    ) -> ConversationControl:
        previous_mode = control.mode
        now = datetime.now(timezone.utc)
        control.mode = target_mode
        control.version += 1
        control.changed_at = now
        control.changed_by = actor
        control.reason = reason
        control.expires_at = (
            now + timedelta(seconds=self.cooldown_seconds)
            if target_mode == "clone_cooldown"
            else None
        )

        if target_mode == "human_active":
            self.db.add(
                Takeover(
                    conversation_id=control.conversation_id,
                    user_id=control.user_id,
                    reason="manual",
                )
            )
            await self._add_takeover_notification(control)
        elif previous_mode == "human_active":
            result = await self.db.execute(
                select(Takeover)
                .where(
                    Takeover.conversation_id == control.conversation_id,
                    Takeover.user_id == control.user_id,
                    Takeover.ended_at.is_(None),
                )
                .order_by(Takeover.started_at.desc())
                .limit(1)
            )
            takeover = result.scalar_one_or_none()
            if takeover is not None:
                takeover.ended_at = now

        await self.db.commit()
        await self.db.refresh(control)
        return control

    async def _add_takeover_notification(self, control: ConversationControl) -> None:
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == control.conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if conversation is None:
            return
        other_user_id = (
            conversation.participant_b_id
            if conversation.participant_a_id == control.user_id
            else conversation.participant_a_id
        )
        self.db.add(
            Notification(
                user_id=other_user_id,
                type="takeover_request",
                title="真人接管",
                content="对方已切换为手动回复模式",
                payload={"conversation_id": str(control.conversation_id)},
            )
        )

    @staticmethod
    def _snapshot(control: ConversationControl) -> ControlSnapshot:
        return ControlSnapshot(
            conversation_id=control.conversation_id,
            user_id=control.user_id,
            mode=control.mode,
            version=control.version,
            changed_at=control.changed_at,
            expires_at=control.expires_at,
            changed_by=control.changed_by,
            reason=control.reason,
        )

    @staticmethod
    def _as_uuid(value: str | uuid.UUID) -> uuid.UUID:
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

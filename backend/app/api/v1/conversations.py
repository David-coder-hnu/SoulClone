import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.chat import ConversationOut
from app.services.chat_service import ChatService
from app.services.conversation_access_service import (
    ConversationAccessError,
    ConversationAccessService,
)
from app.services.conversation_control_service import (
    ConversationControlService,
    ControlSnapshot,
    InvalidControlTransition,
)
from app.websocket.manager import manager

router = APIRouter()


def _control_payload(snapshot: ControlSnapshot) -> dict:
    return {
        "type": "control_changed",
        "conversation_id": str(snapshot.conversation_id),
        "user_id": str(snapshot.user_id),
        "mode": snapshot.mode,
        "version": snapshot.version,
        "changed_at": snapshot.changed_at.isoformat(),
        "expires_at": (
            snapshot.expires_at.isoformat() if snapshot.expires_at else None
        ),
        "changed_by": snapshot.changed_by,
        "reason": snapshot.reason,
    }


async def _require_conversation(conversation_id, user_id, db):
    access = ConversationAccessService(db)
    try:
        return await access.require_member(conversation_id, user_id)
    except ConversationAccessError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        ) from None


async def _broadcast_control(snapshot, conversation):
    await manager.send_to_users(
        _control_payload(snapshot),
        ConversationAccessService.participant_ids(conversation),
    )


@router.get("")
@router.get("/", response_model=list[ConversationOut])
async def list_conversations(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List user's conversations"""
    service = ChatService(db)
    conversations = await service.list_conversations(user_id)
    return conversations


@router.post("/{conversation_id}/takeover")
async def takeover(
    conversation_id: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Human takes over the conversation from clone"""
    conversation = await _require_conversation(conversation_id, user_id, db)
    try:
        snapshot = await ConversationControlService(db).transition(
            conversation.id, user_id, "takeover", reason="manual_takeover"
        )
    except InvalidControlTransition as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from None
    await _broadcast_control(snapshot, conversation)
    return _control_payload(snapshot)


@router.post("/{conversation_id}/release")
async def release(
    conversation_id: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Release conversation back to clone"""
    conversation = await _require_conversation(conversation_id, user_id, db)
    try:
        snapshot = await ConversationControlService(db).transition(
            conversation.id, user_id, "release", reason="manual_release"
        )
    except InvalidControlTransition as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from None
    await _broadcast_control(snapshot, conversation)
    return _control_payload(snapshot)


@router.get("/{conversation_id}/control")
async def get_control(
    conversation_id: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return the caller's authoritative control state for this conversation."""
    await _require_conversation(conversation_id, user_id, db)
    snapshot = await ConversationControlService(db).snapshot(
        conversation_id, user_id
    )
    return _control_payload(snapshot)

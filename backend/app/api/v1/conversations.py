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

router = APIRouter()


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
    access = ConversationAccessService(db)
    try:
        conversation = await access.require_member(conversation_id, user_id)
    except ConversationAccessError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        ) from None

    service = ChatService(db)
    takeover_record = await service.start_takeover(conversation.id, user_id)
    return {
        "status": "takeover_started",
        "conversation_id": conversation_id,
        "takeover_id": str(takeover_record.id),
    }


@router.post("/{conversation_id}/release")
async def release(
    conversation_id: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Release conversation back to clone"""
    access = ConversationAccessService(db)
    try:
        conversation = await access.require_member(conversation_id, user_id)
    except ConversationAccessError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        ) from None

    # Find active takeover and end it
    from sqlalchemy import select
    from app.models.takeover import Takeover

    result = await db.execute(
        select(Takeover).where(
            Takeover.conversation_id == conversation.id,
            Takeover.user_id == user_id,
            Takeover.ended_at.is_(None),
        )
    )
    takeover_record = result.scalar_one_or_none()
    if takeover_record:
        service = ChatService(db)
        await service.end_takeover(str(takeover_record.id))

    return {"status": "released", "conversation_id": conversation_id}

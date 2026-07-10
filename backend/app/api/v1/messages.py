import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.chat import MessageCreate
from app.services.chat_service import ChatService
from app.services.conversation_access_service import (
    ConversationAccessError,
    ConversationAccessService,
)

router = APIRouter()


@router.get("/{conversation_id}")
async def get_messages(
    conversation_id: str,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a conversation"""
    access = ConversationAccessService(db)
    try:
        conversation = await access.require_member(conversation_id, user_id)
    except ConversationAccessError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        ) from None

    service = ChatService(db)
    messages = await service.list_messages(conversation.id)
    sanitized = []
    for msg in messages:
        m = {
            "id": str(msg.id),
            "conversation_id": str(msg.conversation_id),
            "sender_id": str(msg.sender_id),
            "sender_type": msg.sender_type,
            "sender_clone_id": str(msg.sender_clone_id) if msg.sender_clone_id else None,
            "content": msg.content,
            "content_type": msg.content_type,
            "is_read": msg.is_read,
            "emotion_tag": msg.emotion_tag,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        sanitized.append(m)
    return {"items": sanitized}


@router.post("/{conversation_id}")
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Send a message (human or clone)"""
    access = ConversationAccessService(db)
    try:
        conversation = await access.require_member(conversation_id, user_id)
    except ConversationAccessError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        ) from None

    service = ChatService(db)
    msg = await service.send_message(
        conversation_id=conversation.id,
        sender_id=user_id,
        sender_type="human",
        content=data.content,
        client_message_id=data.client_message_id,
    )
    return msg

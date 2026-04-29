from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.chat import MessageCreate, MessageOut
from app.services.chat_service import ChatService

router = APIRouter()


@router.get("/{conversation_id}")
async def get_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a conversation"""
    service = ChatService(db)
    messages = await service.list_messages(conversation_id)
    # Hide sender_type from the other party to preserve anonymity
    sanitized = []
    for msg in messages:
        m = {
            "id": str(msg.id),
            "conversation_id": str(msg.conversation_id),
            "sender_id": str(msg.sender_id),
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
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Send a message (human or clone)"""
    service = ChatService(db)
    msg = await service.send_message(
        conversation_id=conversation_id,
        sender_id=user_id,
        sender_type="human",
        content=data.content,
    )
    return msg

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.chat import ConversationOut
from app.services.chat_service import ChatService

router = APIRouter()


@router.get("/", response_model=list[ConversationOut])
async def list_conversations(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List user's conversations"""
    service = ChatService(db)
    conversations = await service.list_conversations(user_id)
    return conversations


@router.post("/{conversation_id}/takeover")
async def takeover(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Human takes over the conversation from clone"""
    service = ChatService(db)
    takeover_record = await service.start_takeover(conversation_id, user_id)
    return {
        "status": "takeover_started",
        "conversation_id": conversation_id,
        "takeover_id": str(takeover_record.id),
    }


@router.post("/{conversation_id}/release")
async def release(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Release conversation back to clone"""
    # Find active takeover and end it
    from sqlalchemy import select
    from app.models.takeover import Takeover

    result = await db.execute(
        select(Takeover).where(
            Takeover.conversation_id == conversation_id,
            Takeover.user_id == user_id,
            Takeover.ended_at.is_(None),
        )
    )
    takeover_record = result.scalar_one_or_none()
    if takeover_record:
        service = ChatService(db)
        await service.end_takeover(str(takeover_record.id))

    return {"status": "released", "conversation_id": conversation_id}

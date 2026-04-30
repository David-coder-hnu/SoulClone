from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.dependencies import get_db, get_current_user_id
from app.schemas.clone import CloneOut, CloneConfigUpdate
from app.services.clone_service import CloneService
from app.models.clone import Clone
from app.models.clone_action_log import CloneActionLog

router = APIRouter()


@router.get("/me", response_model=CloneOut)
async def get_my_clone(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's clone"""
    service = CloneService(db)
    clone = await service.get_by_user_id(user_id)
    if not clone:
        raise HTTPException(status_code=404, detail="Clone not found")
    return clone


@router.put("/me")
async def update_clone(
    data: CloneConfigUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update clone configuration"""
    service = CloneService(db)
    clone = await service.update_config(
        user_id=user_id,
        name=data.name,
        autonomy_level=data.autonomy_level,
    )
    return clone


@router.post("/me/activate")
async def activate_clone(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Activate clone to start socializing"""
    service = CloneService(db)
    clone = await service.activate(user_id)
    return {"status": "activated", "clone_id": str(clone.id)}


@router.post("/me/deactivate")
async def deactivate_clone(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate clone"""
    service = CloneService(db)
    clone = await service.deactivate(user_id)
    return {"status": "deactivated", "clone_id": str(clone.id)}


@router.get("/me/activities")
async def get_clone_activities(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """Get recent clone activities for the dashboard timeline."""
    import uuid

    result = await db.execute(
        select(Clone).where(Clone.user_id == uuid.UUID(user_id))
    )
    clone = result.scalar_one_or_none()
    if not clone:
        raise HTTPException(status_code=404, detail="Clone not found")

    logs_result = await db.execute(
        select(CloneActionLog)
        .where(CloneActionLog.clone_id == clone.id)
        .order_by(desc(CloneActionLog.created_at))
        .limit(limit)
    )
    logs = logs_result.scalars().all()

    return [
        {
            "id": str(log.id),
            "action_type": log.action_type,
            "description": log.description,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]

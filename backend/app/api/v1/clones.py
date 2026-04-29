from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.clone import CloneOut, CloneConfigUpdate
from app.services.clone_service import CloneService

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

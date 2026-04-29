from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.schemas.match import MatchOut, MatchAction
from app.services.match_service import MatchService

router = APIRouter()


@router.get("/discover")
async def discover_matches(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Discover potential matches"""
    service = MatchService(db)
    items = await service.discover(user_id)
    return {"items": items}


@router.get("/")
async def list_matches(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List current user's matches"""
    service = MatchService(db)
    matches = await service.list_matches(user_id)
    return {"items": matches}


@router.post("/{match_id}/action")
async def match_action(
    match_id: str,
    action: MatchAction,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Accept or reject a match"""
    service = MatchService(db)
    if action.action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")

    status = "accepted" if action.action == "accept" else "rejected"
    match = await service.update_status(match_id, status)
    return {"status": status, "match_id": str(match.id)}

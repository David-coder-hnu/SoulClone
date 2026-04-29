from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.models.date_invite import DateInvite

router = APIRouter()


@router.get("/")
async def list_date_invites(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List date invites"""
    result = await db.execute(
        select(DateInvite).where(
            (DateInvite.proposer_user_id == user_id) | (DateInvite.invitee_user_id == user_id)
        )
    )
    invites = result.scalars().all()
    return {"items": invites}


@router.post("/{invite_id}/respond")
async def respond_to_invite(
    invite_id: str,
    decision: str,  # accepted, declined
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Respond to a date invite"""
    result = await db.execute(select(DateInvite).where(DateInvite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if decision not in ("accepted", "declined"):
        raise HTTPException(status_code=400, detail="Invalid decision")

    invite.status = decision
    invite.user_decision = decision
    await db.commit()
    await db.refresh(invite)
    return {"status": decision, "invite_id": invite_id}

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user_id
from app.models.user import User
from app.schemas.user import RefreshTokenIn, UserCreate, UserLogin, TokenOut, UserOut
from app.core.security import hash_password, verify_password
from app.services.login_rate_limit_service import login_rate_limiter
from app.services.token_service import InvalidRefreshTokenError, TokenService

router = APIRouter()


@router.post("/register", response_model=TokenOut)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == data.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = User(
        phone=data.phone,
        password_hash=hash_password(data.password),
        nickname=data.nickname or f"User_{data.phone[-4:]}",
        status="distilling",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token, refresh_token = await TokenService(db).issue_pair(user.id)
    return TokenOut(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenOut)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    if await login_rate_limiter.is_blocked(data.phone):
        raise HTTPException(status_code=429, detail="Too many login attempts")

    result = await db.execute(select(User).where(User.phone == data.phone))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        await login_rate_limiter.record_failure(data.phone)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await login_rate_limiter.clear(data.phone)
    access_token, refresh_token = await TokenService(db).issue_pair(user.id)
    return TokenOut(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenOut)
async def refresh(data: RefreshTokenIn, db: AsyncSession = Depends(get_db)):
    try:
        access_token, refresh_token = await TokenService(db).rotate(data.refresh_token)
    except InvalidRefreshTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from None
    return TokenOut(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", status_code=204)
async def logout(data: RefreshTokenIn, db: AsyncSession = Depends(get_db)):
    await TokenService(db).revoke(data.refresh_token)


@router.get("/me", response_model=UserOut)
async def me(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

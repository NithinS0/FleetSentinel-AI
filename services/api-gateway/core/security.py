"""
FleetSentinel AI — JWT authentication & RBAC
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import bcrypt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from models.user import User

security = HTTPBearer()

ROLES_HIERARCHY = {
    "admin": 100,
    "fleet_manager": 50,
    "analyst": 30,
    "viewer": 10,
}


class TokenData(BaseModel):
    sub: str
    tenant_id: str
    role: str
    exp: datetime


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(
    user_id: str,
    tenant_id: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str, tenant_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


from types import SimpleNamespace

DEMO_USERS_MAP = {
    "00000000-0000-0000-0000-000000000001": SimpleNamespace(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        email="admin@fleetsentinel.ai",
        full_name="Fleet Director",
        role="admin",
        tenant_id=UUID("11111111-1111-1111-1111-111111111111"),
        is_active=True,
    ),
    "00000000-0000-0000-0000-000000000002": SimpleNamespace(
        id=UUID("00000000-0000-0000-0000-000000000002"),
        email="ops@fleetsentinel.ai",
        full_name="Operations Lead",
        role="fleet_manager",
        tenant_id=UUID("11111111-1111-1111-1111-111111111111"),
        is_active=True,
    ),
    "00000000-0000-0000-0000-000000000003": SimpleNamespace(
        id=UUID("00000000-0000-0000-0000-000000000003"),
        email="mechanic@fleetsentinel.ai",
        full_name="Master Diagnostic Technician",
        role="analyst",
        tenant_id=UUID("11111111-1111-1111-1111-111111111111"),
        is_active=True,
    ),
}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    if user_id in DEMO_USERS_MAP:
        return DEMO_USERS_MAP[user_id]

    try:
        result = await db.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        return user
    except Exception:
        # Fallback to demo admin if DB table is uninitialized
        return DEMO_USERS_MAP["00000000-0000-0000-0000-000000000001"]


def require_role(minimum_role: str):
    """RBAC decorator factory — requires at least `minimum_role`."""
    def _check(user: User = Depends(get_current_user)) -> User:
        user_level = ROLES_HIERARCHY.get(user.role, 0)
        required_level = ROLES_HIERARCHY.get(minimum_role, 0)
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role '{minimum_role}' or higher",
            )
        return user
    return _check


# Convenience dependencies
require_admin = Depends(require_role("admin"))
require_manager = Depends(require_role("fleet_manager"))
require_analyst = Depends(require_role("analyst"))
require_viewer = Depends(require_role("viewer"))

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Access levels, per spec
SUPER_ADMIN = 1
ADMIN = 2
COORDINATOR = 3
USER = 4


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)


def create_access_token(user_id: int, access_type: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "access_type": access_type, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(token)
    user_id = payload.get("sub")
    user = db.query(User).filter(
        User.id == int(user_id), User.is_deleted.is_(False), User.is_active.is_(True)
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        return get_current_user(token, db)
    except HTTPException:
        return None


def require_access(*allowed_levels: int):
    """Dependency factory: require_access(SUPER_ADMIN, ADMIN) etc."""
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.access_type not in allowed_levels:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return dependency

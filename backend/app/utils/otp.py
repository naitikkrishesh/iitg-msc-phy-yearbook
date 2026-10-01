"""OTP generation, storage and verification.

The easy-to-change OTP wording and length live in app/config/otp.py.
Runtime expiry/attempt limits come from app.core.config.Settings.
"""

import random
import string
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config.otp import OTP_LENGTH
from app.core.config import settings
from app.models.models import OtpRequest
from app.utils.mailer import send_otp_mail

otp_password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_otp(length: int = OTP_LENGTH) -> str:
    return "".join(random.choices(string.digits, k=length))


def issue_otp(db: Session, email: str, purpose: str) -> None:
    now = datetime.utcnow()
    otp = generate_otp()
    otp_hash = otp_password_context.hash(otp)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    db.query(OtpRequest).filter(
        OtpRequest.email == email,
        OtpRequest.purpose == purpose,
        OtpRequest.consumed_at.is_(None),
        OtpRequest.is_deleted.is_(False),
    ).update({"is_deleted": True, "deleted_at": now})

    db.add(OtpRequest(
        email=email,
        otp_hash=otp_hash,
        purpose=purpose,
        expires_at=expires_at,
    ))
    db.commit()

    # In development, the mailer prints the OTP to the backend terminal.
    send_otp_mail(email, otp, purpose)


def verify_otp(db: Session, email: str, purpose: str, otp: str, consume: bool = True) -> None:
    record = (
        db.query(OtpRequest)
        .filter(
            OtpRequest.email == email,
            OtpRequest.purpose == purpose,
            OtpRequest.consumed_at.is_(None),
            OtpRequest.is_deleted.is_(False),
        )
        .order_by(OtpRequest.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No OTP request found. Please request a new OTP.")
    if datetime.utcnow() > record.expires_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP expired. Please request a new one.")
    if record.attempt_count >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many incorrect attempts. Request a new OTP.")

    if not otp_password_context.verify(otp, record.otp_hash):
        record.attempt_count += 1
        db.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Incorrect OTP.")

    if consume:
        record.consumed_at = datetime.utcnow()
        db.commit()

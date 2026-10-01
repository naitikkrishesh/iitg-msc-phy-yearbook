from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Student, User, AllowedEmailDomain
from app.schemas.schemas import (
    RegistrationOtpRequest, OtpVerifyRequest, CompleteRegistrationRequest,
    LoginRequest, TokenResponse, UserOut, ForgotPasswordRequest, ResetPasswordRequest,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.utils.otp import issue_otp, verify_otp

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _is_domain_allowed(db: Session, email: str) -> bool:
    domain = email.split("@")[-1].lower()
    return db.query(AllowedEmailDomain).filter(
        AllowedEmailDomain.domain == domain,
        AllowedEmailDomain.is_active.is_(True),
        AllowedEmailDomain.is_deleted.is_(False),
    ).first() is not None

 
@router.get("/registration/batch-years", response_model=List[int])
def list_registration_batch_years(db: Session = Depends(get_db)):
    """Only years present in `students` (i.e. pre-loaded by admin) are offered."""
    rows = (
        db.query(Student.batch_year)
        .filter(Student.is_deleted.is_(False))
        .distinct()
        .order_by(Student.batch_year.desc())
        .all()
    )
    return [r[0] for r in rows]


@router.post("/registration/request-otp")
def request_registration_otp(payload: RegistrationOtpRequest, db: Session = Depends(get_db)):
    if not _is_domain_allowed(db, payload.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This email domain cannot be registered.")

    student = db.query(Student).filter(
        Student.batch_year == payload.batch_year,
        Student.roll_no == payload.roll_no,
        Student.name == payload.name,
        Student.iitg_email == payload.email,
        Student.is_deleted.is_(False),
    ).first()
    if not student:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Details do not match our records for the selected batch. Check name, roll number, and email.",
        )
    if student.is_registered:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This student is already registered.")

    existing_user = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(False)).first()
    if existing_user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "An account with this email already exists.")

    issue_otp(db, payload.email, "registration")
    return {"message": "OTP sent to your IITG email."}


@router.post("/registration/complete", response_model=TokenResponse)
def complete_registration(payload: CompleteRegistrationRequest, db: Session = Depends(get_db)):
    if not _is_domain_allowed(db, payload.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This email domain cannot be registered.")

    student = db.query(Student).filter(
        Student.batch_year == payload.batch_year,
        Student.roll_no == payload.roll_no,
        Student.name == payload.name,
        Student.iitg_email == payload.email,
        Student.is_deleted.is_(False),
    ).first()
    if not student:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Details do not match our records.")
    if student.is_registered:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This student is already registered.")

    # Verifies OTP; rejects registration outright if not verified (per spec)
    verify_otp(db, payload.email, "registration", payload.otp, consume=True)

    user = User(
        student_id=student.id,
        name=payload.name,
        roll_no=payload.roll_no,
        email=payload.email,
        batch_year=payload.batch_year,
        password_hash=hash_password(payload.password),
        access_type=4,
        is_email_verified=True,
    )
    db.add(user)
    student.is_registered = True
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.access_type)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.roll_no == payload.roll_no, User.is_deleted.is_(False)
    ).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid roll number or password.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is inactive. Contact an admin.")

    token = create_access_token(user.id, user.access_type)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password/request-otp")
def forgot_password_request_otp(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(False)).first()
    if not user:
        # Do not reveal whether the email exists
        return {"message": "If this email is registered, an OTP has been sent."}
    issue_otp(db, payload.email, "password_reset")
    return {"message": "If this email is registered, an OTP has been sent."}


@router.post("/forgot-password/reset")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid request.")

    verify_otp(db, payload.email, "password_reset", payload.otp, consume=True)

    user.password_hash = hash_password(payload.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}

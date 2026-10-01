from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth / Registration ----------
class BatchYearOut(BaseModel):
    batch_year: int


class RegistrationOtpRequest(BaseModel):
    batch_year: int
    name: str
    roll_no: str
    email: EmailStr


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=4, max_length=8)
    purpose: str  # 'registration' | 'password_reset'


class CompleteRegistrationRequest(BaseModel):
    batch_year: int
    name: str
    roll_no: str
    email: EmailStr
    otp: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    roll_no: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(min_length=8)


# ---------- User ----------
class UserOut(BaseModel):
    id: int
    name: str
    roll_no: str
    email: str
    batch_year: int
    access_type: int
    is_email_verified: bool
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Student home-feed / profile ----------
class CoreMemoryPhotoOut(BaseModel):
    photo_url: str

    class Config:
        from_attributes = True


class CoreMemoryOut(BaseModel):
    id: int
    title: Optional[str]
    memory_text: Optional[str]
    photos: List[CoreMemoryPhotoOut] = []

    class Config:
        from_attributes = True


class AdditionalPhotoOut(BaseModel):
    photo_url: str
    caption: Optional[str]

    class Config:
        from_attributes = True


class StudentCardOut(BaseModel):
    """Minimal shape for the home page grid."""
    user_id: int
    name: str
    roll_no: str
    batch_year: int
    profile_photo: Optional[str]
    quote: Optional[str]
    position_title: Optional[str]


class StudentDetailOut(BaseModel):
    user_id: int
    name: str
    roll_no: str
    batch_year: int
    email: str
    feature_photo: Optional[str]
    quote: Optional[str]
    tagline: Optional[str]
    about: Optional[str]
    physics_like: Optional[str]
    area_of_interest: Optional[str]
    hobbies: Optional[str]
    proud_of: Optional[str]
    phd: Optional[str]
    academic: Optional[str]
    jobs: Optional[str]
    linkedin: Optional[str]
    instagram: Optional[str]
    footer_quote: Optional[str]
    position_title: Optional[str]
    additional_photos: List[AdditionalPhotoOut] = []
    core_memories: List[CoreMemoryOut] = []


# ---------- Dashboard / profile self-edit ----------
class ProfileUpdateRequest(BaseModel):
    quote: Optional[str] = None
    tagline: Optional[str] = None
    about: Optional[str] = None
    physics_like: Optional[str] = None
    area_of_interest: Optional[str] = None
    hobbies: Optional[str] = None
    proud_of: Optional[str] = None
    phd: Optional[str] = None
    academic: Optional[str] = None
    jobs: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    footer_quote: Optional[str] = None


# ---------- Admin ----------
class RoleUpdateRequest(BaseModel):
    user_id: int
    new_access_type: int  # 2=admin, 3=coordinator, 4=user


class ManualStudentCreate(BaseModel):
    batch_year: int
    name: str
    roll_no: str
    iitg_email: EmailStr


class AllowedDomainCreate(BaseModel):
    domain: str


class PhotoApprovalRequest(BaseModel):
    user_id: int
    photo_type: str  # 'profile' | 'feature'
    decision: str    # 'approve' | 'reject'
    reject_reason: Optional[str] = None


class PositionAssignRequest(BaseModel):
    user_id: int
    position_title: str  # e.g. 'CR', 'DPR', or free text; '' clears it


class UserApprovalRequest(BaseModel):
    user_id: int
    approve: bool

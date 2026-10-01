from sqlalchemy import (
    Column, BigInteger, String, SmallInteger, Boolean, DateTime,
    Text, Enum, ForeignKey, Integer
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.mixins import AuditSoftDeleteMixin


class AllowedEmailDomain(Base, AuditSoftDeleteMixin):
    __tablename__ = "allowed_email_domains"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    domain = Column(String(191), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class Student(Base, AuditSoftDeleteMixin):
    __tablename__ = "students"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    batch_year = Column(SmallInteger, nullable=False)
    name = Column(String(191), nullable=False)
    roll_no = Column(String(50), nullable=False)
    iitg_email = Column(String(191), nullable=False)
    is_registered = Column(Boolean, default=False, nullable=False)


class User(Base, AuditSoftDeleteMixin):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(BigInteger, ForeignKey("students.id"), nullable=True)
    name = Column(String(191), nullable=False)
    roll_no = Column(String(50), nullable=False)
    email = Column(String(191), unique=True, nullable=False)
    batch_year = Column(SmallInteger, nullable=False)
    password_hash = Column(String(255), nullable=False)
    access_type = Column(SmallInteger, default=4, nullable=False)  # 1=super,2=admin,3=coord,4=user
    is_email_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    approved_by = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    last_update = Column(DateTime, nullable=True)

    details = relationship("UserDetail", back_populates="user", uselist=False)
    additional_photos = relationship(
        "AdditionalPhoto",
        primaryjoin="and_(User.id==AdditionalPhoto.user_id, AdditionalPhoto.is_deleted==False)",
        order_by="AdditionalPhoto.sort_order",
        viewonly=True,
    )
    core_memories = relationship(
        "CoreMemory",
        primaryjoin="and_(User.id==CoreMemory.user_id, CoreMemory.is_deleted==False)",
        viewonly=True,
    )


class UserDetail(Base, AuditSoftDeleteMixin):
    __tablename__ = "user_details"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)

    profile_photo_current = Column(String(500), nullable=True)
    profile_photo_pending = Column(String(500), nullable=True)
    profile_photo_status = Column(Enum("none", "pending", "approved", "rejected", name="photo_status_enum"), default="none")
    profile_photo_reviewed_by = Column(BigInteger, nullable=True)
    profile_photo_reviewed_at = Column(DateTime, nullable=True)
    profile_photo_reject_reason = Column(String(500), nullable=True)

    feature_photo_current = Column(String(500), nullable=True)
    feature_photo_pending = Column(String(500), nullable=True)
    feature_photo_status = Column(Enum("none", "pending", "approved", "rejected", name="feature_status_enum"), default="none")
    feature_photo_reviewed_by = Column(BigInteger, nullable=True)
    feature_photo_reviewed_at = Column(DateTime, nullable=True)
    feature_photo_reject_reason = Column(String(500), nullable=True)

    quote = Column(String(500), nullable=True)
    tagline = Column(String(255), nullable=True)
    about = Column(Text, nullable=True)

    physics_like = Column(Text, nullable=True)
    area_of_interest = Column(String(255), nullable=True)
    hobbies = Column(Text, nullable=True)
    proud_of = Column(Text, nullable=True)

    phd = Column(String(255), nullable=True)
    academic = Column(String(255), nullable=True)
    jobs = Column(String(255), nullable=True)

    linkedin = Column(String(255), nullable=True)
    instagram = Column(String(255), nullable=True)
    footer_quote = Column(String(255), nullable=True)

    position_title = Column(String(100), nullable=True)
    position_set_by = Column(BigInteger, nullable=True)
    position_set_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="details")


class AdditionalPhoto(Base, AuditSoftDeleteMixin):
    __tablename__ = "additional_photos"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    photo_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)


class CoreMemory(Base, AuditSoftDeleteMixin):
    __tablename__ = "core_memories"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    title = Column(String(191), nullable=True)
    memory_text = Column(Text, nullable=True)

    photos = relationship("CoreMemoryPhoto", backref="memory")


class CoreMemoryPhoto(Base, AuditSoftDeleteMixin):
    __tablename__ = "core_memory_photos"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    core_memory_id = Column(BigInteger, ForeignKey("core_memories.id"), nullable=False)
    photo_url = Column(String(500), nullable=False)


class OtpRequest(Base, AuditSoftDeleteMixin):
    __tablename__ = "otp_requests"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(191), nullable=False)
    otp_hash = Column(String(255), nullable=False)
    purpose = Column(Enum("registration", "password_reset", name="otp_purpose_enum"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
    attempt_count = Column(SmallInteger, default=0)


class UserNotification(Base, AuditSoftDeleteMixin):
    __tablename__ = "user_notifications"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)


class ExcelImportBatch(Base, AuditSoftDeleteMixin):
    __tablename__ = "excel_import_batches"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    file_name = Column(String(255), nullable=False)
    total_rows = Column(Integer, default=0)
    success_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)

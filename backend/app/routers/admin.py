from datetime import datetime
from typing import List

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    User, UserDetail, Student, AllowedEmailDomain, ExcelImportBatch, UserNotification,
)
from app.schemas.schemas import (
    ManualStudentCreate, AllowedDomainCreate, PhotoApprovalRequest,
    RoleUpdateRequest, PositionAssignRequest, UserApprovalRequest,
)
from app.core.security import require_access, SUPER_ADMIN, ADMIN, COORDINATOR
from app.utils.mailer import send_notification_mail

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------------- Allowed email domains (super admin only) ----------------
@router.get("/domains")
def list_domains(db: Session = Depends(get_db), _=Depends(require_access(SUPER_ADMIN))):
    rows = db.query(AllowedEmailDomain).filter(AllowedEmailDomain.is_deleted.is_(False)).all()
    return [{"id": r.id, "domain": r.domain, "is_active": r.is_active} for r in rows]


@router.post("/domains")
def add_domain(payload: AllowedDomainCreate, db: Session = Depends(get_db), me: User = Depends(require_access(SUPER_ADMIN))):
    domain = payload.domain.lower().strip().lstrip("@")
    existing = db.query(AllowedEmailDomain).filter(AllowedEmailDomain.domain == domain).first()
    if existing:
        existing.is_active = True
        existing.is_deleted = False
        existing.updated_by = me.id
    else:
        db.add(AllowedEmailDomain(domain=domain, created_by=me.id, updated_by=me.id))
    db.commit()
    return {"message": f"{domain} is now an allowed registration domain."}


@router.delete("/domains/{domain_id}")
def remove_domain(domain_id: int, db: Session = Depends(get_db), me: User = Depends(require_access(SUPER_ADMIN))):
    row = db.query(AllowedEmailDomain).filter(AllowedEmailDomain.id == domain_id).first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Domain not found.")
    row.is_active = False
    row.is_deleted = True
    row.deleted_at = datetime.utcnow()
    row.updated_by = me.id
    db.commit()
    return {"message": "Domain removed."}


# ---------------- Student roster (admin + super admin) ----------------
@router.post("/students")
def add_student_manual(
    payload: ManualStudentCreate, db: Session = Depends(get_db),
    me: User = Depends(require_access(SUPER_ADMIN, ADMIN)),
):
    dup = db.query(Student).filter(
        Student.roll_no == payload.roll_no, Student.batch_year == payload.batch_year,
        Student.is_deleted.is_(False),
    ).first()
    if dup:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Student already exists for that batch/roll number.")
    student = Student(
        batch_year=payload.batch_year, name=payload.name, roll_no=payload.roll_no,
        iitg_email=str(payload.iitg_email), created_by=me.id, updated_by=me.id,
    )
    db.add(student)
    db.commit()
    return {"message": "Student added to roster."}


@router.post("/students/import-excel")
def import_students_excel(
    file: UploadFile = File(...), db: Session = Depends(get_db),
    me: User = Depends(require_access(SUPER_ADMIN, ADMIN)),
):
    """Expected columns (case-insensitive): batch_year, name, roll_no, iitg_email"""
    try:
        df = pd.read_excel(file.file)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Could not read the excel file.")

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    required = {"batch_year", "name", "roll_no", "iitg_email"}
    if not required.issubset(set(df.columns)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Excel must contain columns: {', '.join(sorted(required))}")

    success, failed, errors = 0, 0, []
    for idx, row in df.iterrows():
        try:
            batch_year = int(row["batch_year"])
            roll_no = str(row["roll_no"]).strip()
            name = str(row["name"]).strip()
            email = str(row["iitg_email"]).strip()

            dup = db.query(Student).filter(
                Student.roll_no == roll_no, Student.batch_year == batch_year,
                Student.is_deleted.is_(False),
            ).first()
            if dup:
                failed += 1
                errors.append(f"Row {idx + 2}: duplicate roll_no {roll_no} for {batch_year}")
                continue

            db.add(Student(
                batch_year=batch_year, name=name, roll_no=roll_no, iitg_email=email,
                created_by=me.id, updated_by=me.id,
            ))
            success += 1
        except Exception as e:
            failed += 1
            errors.append(f"Row {idx + 2}: {e}")

    db.add(ExcelImportBatch(
        file_name=file.filename, total_rows=len(df), success_rows=success, failed_rows=failed,
        error_log="\n".join(errors) or None, created_by=me.id, updated_by=me.id,
    ))
    db.commit()
    return {"total": len(df), "success": success, "failed": failed, "errors": errors}


@router.get("/students")
def list_roster(db: Session = Depends(get_db), _=Depends(require_access(SUPER_ADMIN, ADMIN))):
    rows = db.query(Student).filter(Student.is_deleted.is_(False)).order_by(
        Student.batch_year.desc(), Student.roll_no.asc()
    ).all()
    return [
        {"id": s.id, "batch_year": s.batch_year, "name": s.name, "roll_no": s.roll_no,
         "iitg_email": s.iitg_email, "is_registered": s.is_registered}
        for s in rows
    ]


# ---------------- Role management ----------------
@router.put("/users/role")
def update_role(payload: RoleUpdateRequest, db: Session = Depends(get_db), me: User = Depends(require_access(SUPER_ADMIN, ADMIN))):
    target = db.query(User).filter(User.id == payload.user_id, User.is_deleted.is_(False)).first()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    if target.id == 1 or target.access_type == SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "The super admin's role cannot be changed.")

    if me.access_type == ADMIN:
        # Admin may only grant/revoke coordinator; only super admin can create admins.
        if payload.new_access_type not in (COORDINATOR, 4):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Admins can only assign or remove the coordinator role.")
    elif me.access_type == SUPER_ADMIN:
        if payload.new_access_type not in (ADMIN, COORDINATOR, 4):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid access type.")

    target.access_type = payload.new_access_type
    target.updated_by = me.id
    target.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Role updated."}


@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_access(SUPER_ADMIN, ADMIN, COORDINATOR))):
    rows = db.query(User).filter(User.is_deleted.is_(False), User.access_type != SUPER_ADMIN).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id, "name": u.name, "roll_no": u.roll_no, "email": u.email,
            "batch_year": u.batch_year, "access_type": u.access_type,
            "approved_at": u.approved_at, "is_active": u.is_active,
        }
        for u in rows
    ]


# ---------------- User (registration) approval ----------------
@router.put("/users/approve")
def approve_user(payload: UserApprovalRequest, db: Session = Depends(get_db), me: User = Depends(require_access(SUPER_ADMIN, ADMIN, COORDINATOR))):
    target = db.query(User).filter(User.id == payload.user_id, User.is_deleted.is_(False)).first()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    if target.id == me.id and me.access_type != SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot approve your own account.")

    if payload.approve:
        target.approved_by = me.id
        target.approved_at = datetime.utcnow()
    else:
        target.approved_by = None
        target.approved_at = None
    target.updated_by = me.id
    db.commit()
    return {"message": "User approval updated."}


# ---------------- Photo approval ----------------
@router.get("/photo/pending")
def list_pending_photos(db: Session = Depends(get_db), _=Depends(require_access(SUPER_ADMIN, ADMIN, COORDINATOR))):
    rows = db.query(UserDetail).join(User, User.id == UserDetail.user_id).filter(
        UserDetail.is_deleted.is_(False),
        User.is_deleted.is_(False),
        (UserDetail.profile_photo_status == "pending") | (UserDetail.feature_photo_status == "pending"),
    ).all()
    out = []
    for d in rows:
        u = db.query(User).filter(User.id == d.user_id).first()
        out.append({
            "user_id": d.user_id, "name": u.name, "roll_no": u.roll_no,
            "profile_photo_pending": d.profile_photo_pending, "profile_photo_status": d.profile_photo_status,
            "feature_photo_pending": d.feature_photo_pending, "feature_photo_status": d.feature_photo_status,
        })
    return out


@router.get("/users/{user_id}/review")
def review_user_detail(user_id: int, db: Session = Depends(get_db), _=Depends(require_access(SUPER_ADMIN, ADMIN, COORDINATOR))):
    """Everything an admin/coordinator/super admin sees when clicking into a user:
    all submitted details, plus current vs pending photos for approval."""
    user = db.query(User).filter(User.id == user_id, User.is_deleted.is_(False)).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    details = db.query(UserDetail).filter(UserDetail.user_id == user_id, UserDetail.is_deleted.is_(False)).first()

    return {
        "user": {
            "id": user.id, "name": user.name, "roll_no": user.roll_no, "email": user.email,
            "batch_year": user.batch_year, "approved_at": user.approved_at,
        },
        "details": None if not details else {
            "profile_photo_current": details.profile_photo_current,
            "profile_photo_pending": details.profile_photo_pending,
            "profile_photo_status": details.profile_photo_status,
            "feature_photo_current": details.feature_photo_current,
            "feature_photo_pending": details.feature_photo_pending,
            "feature_photo_status": details.feature_photo_status,
            "quote": details.quote, "tagline": details.tagline, "about": details.about,
            "physics_like": details.physics_like, "area_of_interest": details.area_of_interest,
            "hobbies": details.hobbies, "proud_of": details.proud_of,
            "phd": details.phd, "academic": details.academic, "jobs": details.jobs,
            "linkedin": details.linkedin, "instagram": details.instagram,
            "footer_quote": details.footer_quote, "position_title": details.position_title,
        },
    }


@router.put("/photo/review")
def review_photo(payload: PhotoApprovalRequest, db: Session = Depends(get_db), me: User = Depends(require_access(SUPER_ADMIN, ADMIN, COORDINATOR))):
    if payload.user_id == me.id and me.access_type != SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot approve your own photo.")
    if payload.photo_type not in ("profile", "feature"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "photo_type must be 'profile' or 'feature'.")
    if payload.decision not in ("approve", "reject"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "decision must be 'approve' or 'reject'.")

    details = db.query(UserDetail).filter(UserDetail.user_id == payload.user_id, UserDetail.is_deleted.is_(False)).first()
    if not details:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No submitted details for this user.")

    prefix = "profile_photo_" if payload.photo_type == "profile" else "feature_photo_"
    pending_url = getattr(details, prefix + "pending")
    if not pending_url:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No pending photo to review.")

    if payload.decision == "approve":
        setattr(details, prefix + "current", pending_url)
        setattr(details, prefix + "status", "approved")
        setattr(details, prefix + "reject_reason", None)
        message = f"Your {payload.photo_type} photo was approved and is now live."
    else:
        # old *_current is untouched — stays live on the home page
        setattr(details, prefix + "status", "rejected")
        setattr(details, prefix + "reject_reason", payload.reject_reason or "Image did not meet the required standard.")
        message = f"Your {payload.photo_type} photo was not approved: {payload.reject_reason or 'did not meet the required standard.'}"

    setattr(details, prefix + "pending", None)
    setattr(details, prefix + "reviewed_by", me.id)
    setattr(details, prefix + "reviewed_at", datetime.utcnow())
    details.updated_by = me.id
    db.commit()

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    db.add(UserNotification(user_id=payload.user_id, message=message, created_by=me.id, updated_by=me.id))
    db.commit()
    if target_user:
        send_notification_mail(target_user.email, message)

    return {"message": message}


# ---------------- Position of responsibility (coordinator + admin + super admin) ----------------
@router.put("/users/position")
def assign_position(payload: PositionAssignRequest, db: Session = Depends(get_db), me: User = Depends(require_access(SUPER_ADMIN, ADMIN, COORDINATOR))):
    details = db.query(UserDetail).filter(UserDetail.user_id == payload.user_id, UserDetail.is_deleted.is_(False)).first()
    if not details:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User has not submitted profile details yet.")
    details.position_title = payload.position_title or None
    details.position_set_by = me.id
    details.position_set_at = datetime.utcnow()
    details.updated_by = me.id
    db.commit()
    return {"message": "Position updated."}

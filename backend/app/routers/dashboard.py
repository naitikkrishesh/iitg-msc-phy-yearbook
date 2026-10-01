from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, UserDetail, AdditionalPhoto, CoreMemory, CoreMemoryPhoto, UserNotification
from app.schemas.schemas import ProfileUpdateRequest
from app.core.security import get_current_user
from app.utils.storage import save_upload

router = APIRouter(prefix="/api/dashboard", tags=["dashboard (self)"])


def _get_or_create_details(db: Session, user: User) -> UserDetail:
    details = db.query(UserDetail).filter(UserDetail.user_id == user.id, UserDetail.is_deleted.is_(False)).first()
    if not details:
        details = UserDetail(user_id=user.id, created_by=user.id, updated_by=user.id)
        db.add(details)
        db.commit()
        db.refresh(details)
    return details


@router.get("/me")
def get_my_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    details = _get_or_create_details(db, user)
    return {
        "user": {
            "id": user.id, "name": user.name, "roll_no": user.roll_no,
            "email": user.email, "batch_year": user.batch_year, "access_type": user.access_type,
        },
        "details": {
            "profile_photo_current": details.profile_photo_current,
            "profile_photo_pending": details.profile_photo_pending,
            "profile_photo_status": details.profile_photo_status,
            "profile_photo_reject_reason": details.profile_photo_reject_reason,
            "feature_photo_current": details.feature_photo_current,
            "feature_photo_pending": details.feature_photo_pending,
            "feature_photo_status": details.feature_photo_status,
            "feature_photo_reject_reason": details.feature_photo_reject_reason,
            "quote": details.quote, "tagline": details.tagline, "about": details.about,
            "physics_like": details.physics_like, "area_of_interest": details.area_of_interest,
            "hobbies": details.hobbies, "proud_of": details.proud_of,
            "phd": details.phd, "academic": details.academic, "jobs": details.jobs,
            "linkedin": details.linkedin, "instagram": details.instagram,
            "footer_quote": details.footer_quote, "position_title": details.position_title,
        },
    }


@router.put("/profile")
def update_profile(payload: ProfileUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    details = _get_or_create_details(db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(details, field, value)
    details.updated_by = user.id
    details.updated_at = datetime.utcnow()
    user.last_update = datetime.utcnow()
    db.commit()
    return {"message": "Profile updated."}


def _upload_photo(db: Session, user: User, file: UploadFile, kind: str):
    """kind: 'profile' or 'feature'. Sets *_pending, marks status pending —
    old *_current stays live on the home page until an admin approves."""
    details = _get_or_create_details(db, user)
    url = save_upload(file, subfolder=f"{kind}_photos")

    if kind == "profile":
        details.profile_photo_pending = url
        details.profile_photo_status = "pending"
        details.profile_photo_reviewed_by = None
        details.profile_photo_reviewed_at = None
        details.profile_photo_reject_reason = None
    else:
        details.feature_photo_pending = url
        details.feature_photo_status = "pending"
        details.feature_photo_reviewed_by = None
        details.feature_photo_reviewed_at = None
        details.feature_photo_reject_reason = None

    details.updated_by = user.id
    details.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"{kind.capitalize()} photo submitted for approval.", "pending_url": url}


@router.post("/photo/profile")
def upload_profile_photo(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _upload_photo(db, user, file, "profile")


@router.post("/photo/feature")
def upload_feature_photo(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _upload_photo(db, user, file, "feature")


@router.post("/photo/gallery")
def upload_gallery_photo(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = save_upload(file, subfolder="gallery")
    photo = AdditionalPhoto(user_id=user.id, photo_url=url, caption=caption, created_by=user.id, updated_by=user.id)
    db.add(photo)
    db.commit()
    return {"message": "Photo added.", "photo_url": url}


@router.post("/core-memory")
def add_core_memory(
    title: str = Form(...),
    memory_text: str = Form(""),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memory = CoreMemory(user_id=user.id, title=title, memory_text=memory_text, created_by=user.id, updated_by=user.id)
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return {"id": memory.id, "message": "Core memory added."}


@router.post("/core-memory/{memory_id}/photo")
def add_core_memory_photo(
    memory_id: int, file: UploadFile = File(...),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    memory = db.query(CoreMemory).filter(
        CoreMemory.id == memory_id, CoreMemory.user_id == user.id, CoreMemory.is_deleted.is_(False)
    ).first()
    if not memory:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Core memory not found.")
    url = save_upload(file, subfolder="core_memories")
    photo = CoreMemoryPhoto(core_memory_id=memory.id, photo_url=url, created_by=user.id, updated_by=user.id)
    db.add(photo)
    db.commit()
    return {"message": "Photo added to memory.", "photo_url": url}


@router.get("/notifications")
def my_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(UserNotification).filter(
        UserNotification.user_id == user.id, UserNotification.is_deleted.is_(False)
    ).order_by(UserNotification.created_at.desc()).all()
    return [{"id": n.id, "message": n.message, "is_read": n.is_read, "created_at": n.created_at} for n in notes]

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import User, UserDetail, Student
from app.schemas.schemas import StudentCardOut, StudentDetailOut, AdditionalPhotoOut, CoreMemoryOut
from app.core.security import SUPER_ADMIN

router = APIRouter(prefix="/api/students", tags=["students (public)"])


def _approved_user_query(db: Session):
    return (
        db.query(User)
        .join(UserDetail, UserDetail.user_id == User.id)
        .filter(
            User.is_deleted.is_(False),
            User.is_active.is_(True),
            User.access_type != SUPER_ADMIN,       # super admin excluded from listing
            User.approved_at.isnot(None),           # approved by admin/coordinator/super admin
            UserDetail.is_deleted.is_(False),
        )
    )


@router.get("/years", response_model=List[int])
def list_batch_years(db: Session = Depends(get_db)):
    """Return only batch years that were actually uploaded to the student roster."""
    # The student roster is the source of truth. It is populated by admin/super-admin
    # roster uploads, and may contain years for which nobody has registered yet.
    roster_rows = (
        db.query(Student.batch_year)
        .filter(Student.is_deleted.is_(False))
        .distinct()
        .order_by(Student.batch_year.desc())
        .all()
    )
    return [row[0] for row in roster_rows]


@router.get("", response_model=List[StudentCardOut])
def list_students(batch_year: Optional[int] = Query(None), db: Session = Depends(get_db)):
    q = _approved_user_query(db)
    if batch_year is not None:
        q = q.filter(User.batch_year == batch_year)

    users = q.order_by(User.batch_year.asc(), User.roll_no.asc()).all()

    return [
        StudentCardOut(
            user_id=u.id,
            name=u.name,
            roll_no=u.roll_no,
            batch_year=u.batch_year,
            profile_photo=u.details.profile_photo_current if u.details else None,
            quote=u.details.quote if u.details else None,
            position_title=u.details.position_title if u.details else None,
        )
        for u in users
    ]


@router.get("/{user_id}", response_model=StudentDetailOut)
def get_student_detail(user_id: int, db: Session = Depends(get_db)):
    user = (
        _approved_user_query(db)
        .options(joinedload(User.details))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student not found or not yet approved.")

    d = user.details
    return StudentDetailOut(
        user_id=user.id,
        name=user.name,
        roll_no=user.roll_no,
        batch_year=user.batch_year,
        email=user.email,
        feature_photo=d.feature_photo_current if d else None,
        quote=d.quote if d else None,
        tagline=d.tagline if d else None,
        about=d.about if d else None,
        physics_like=d.physics_like if d else None,
        area_of_interest=d.area_of_interest if d else None,
        hobbies=d.hobbies if d else None,
        proud_of=d.proud_of if d else None,
        phd=d.phd if d else None,
        academic=d.academic if d else None,
        jobs=d.jobs if d else None,
        linkedin=d.linkedin if d else None,
        instagram=d.instagram if d else None,
        footer_quote=d.footer_quote if d else None,
        position_title=d.position_title if d else None,
        additional_photos=[AdditionalPhotoOut.model_validate(p) for p in user.additional_photos],
        core_memories=[CoreMemoryOut.model_validate(m) for m in user.core_memories],
    )

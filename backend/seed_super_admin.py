"""
Run once against an empty DB (after applying schema.sql):
    python seed_super_admin.py

Creates the super admin as users.id = 1, per spec: "Super admin: id = 1".
"""
import getpass

from app.database import SessionLocal
from app.models.models import User
from app.core.security import hash_password


def main():
    db = SessionLocal()
    existing = db.query(User).filter(User.id == 1).first()
    if existing:
        print("A user with id=1 already exists. Aborting to avoid overwriting the super admin.")
        return

    name = input("Super admin name: ").strip()
    roll_no = input("Super admin roll no: ").strip()
    email = input("Super admin IITG email: ").strip()
    batch_year = int(input("Super admin batch year: ").strip())
    password = getpass.getpass("Super admin password: ")

    user = User(
        id=1,
        name=name, roll_no=roll_no, email=email, batch_year=batch_year,
        password_hash=hash_password(password),
        access_type=1,  # super admin
        is_email_verified=True,
        approved_by=1,
    )
    db.add(user)
    db.commit()
    print(f"Super admin created with id={user.id}.")


if __name__ == "__main__":
    main()

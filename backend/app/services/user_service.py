from sqlalchemy.orm import Session

from app.db.models import User
from app.schemas.user import UserCreate
from app.core.security import hash_password
from app.schemas.user import UserLogin
from app.core.security import verify_password

def register_user(db: Session, user: UserCreate):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise ValueError("Email already exists")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user

def login_user(db: Session, user: UserLogin):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user is None:
        raise ValueError("Invalid email or password")

    if not verify_password(
        user.password,
        existing_user.hashed_password
    ):
        raise ValueError("Invalid email or password")

    return existing_user
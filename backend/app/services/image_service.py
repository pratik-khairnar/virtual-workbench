from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Image


def get_images(db: Session):
    return db.query(Image).all()


def get_image(db: Session, image_id: UUID):
    image = db.query(Image).filter(
        Image.id == image_id
    ).first()

    if image is None:
        raise ValueError("Image not found")

    return image
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.image import ImageResponse
from app.services.image_service import (
    get_images as get_images_service,
    get_image as get_image_service,
)

router = APIRouter(
    prefix="/images",
    tags=["Images"]
)


@router.get("/", response_model=List[ImageResponse])
def get_images(db: Session = Depends(get_db)):
    return get_images_service(db)


@router.get("/{image_id}", response_model=ImageResponse)
def get_image(
    image_id: UUID,
    db: Session = Depends(get_db)
):
    try:
        return get_image_service(db, image_id)

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/images",
    tags=["Images"]
)


@router.get("/")
def get_images():
    raise HTTPException(
        status_code=501,
        detail="Get images API not implemented yet"
    )


@router.get("/{image_id}")
def get_image(image_id: str):
    raise HTTPException(
        status_code=501,
        detail="Get image API not implemented yet"
    )
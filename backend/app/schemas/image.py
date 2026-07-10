from uuid import UUID
from datetime import datetime

from app.schemas.base import BaseSchema

class ImageCreate(BaseSchema):
    name: str
    version: str
    os: str
    description: str
    image_uri: str

class ImageResponse(BaseSchema):
    id: UUID
    name: str
    version: str
    os: str
    description: str
    image_uri: str
    created_at: datetime


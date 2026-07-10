from uuid import UUID
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema

class UserCreate(BaseSchema):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)

class UserLogin(BaseSchema):
    email: EmailStr
    password: str

class UserResponse(BaseSchema):
    id: UUID
    username: str
    email: EmailStr
    role: str
    created_at: datetime
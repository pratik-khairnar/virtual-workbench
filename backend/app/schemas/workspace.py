from uuid import UUID
from datetime import datetime

from app.schemas.base import BaseSchema
from app.db.models import WorkspaceStatus

class WorkspaceCreate(BaseSchema):
    name: str
    image_id: UUID

class WorkspaceUpdate(BaseSchema):
    name: str

class WorkspaceResponse(BaseSchema):
    id: UUID
    name: str
    owner_id: UUID
    image_id: UUID
    status: WorkspaceStatus
    workspace_url: str | None
    created_at: datetime
    updated_at: datetime


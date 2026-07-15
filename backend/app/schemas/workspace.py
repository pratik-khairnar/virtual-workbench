from uuid import UUID
from datetime import datetime

from app.schemas.base import BaseSchema
from app.db.models import WorkspaceStatus

class WorkspaceCreate(BaseSchema):
    name: str
    developer_id: UUID
    image_id: UUID
    provider: str
    selected_tools: list[str]

class WorkspaceUpdate(BaseSchema):
    name: str

class WorkspaceResponse(BaseSchema):
    id: UUID
    name: str
    image_id: UUID
    image_name: str
    developer_id: UUID
    provider: str
    selected_tools: list[str]
    status: WorkspaceStatus
    workspace_url: str | None
    created_at: datetime
    updated_at: datetime

class WorkspaceActionResponse(BaseSchema):
    message: str
    status: WorkspaceStatus
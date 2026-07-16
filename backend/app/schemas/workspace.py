from uuid import UUID
from datetime import datetime
from typing import Optional

from app.schemas.base import BaseSchema
from app.db.models import WorkspaceStatus

class WorkspaceCreate(BaseSchema):
    name: str
    developer_id: Optional[str] = None
    image_id: UUID
    provider: str
    selected_tools: Optional[list[str]] = None

class WorkspaceUpdate(BaseSchema):
    name: str

class WorkspaceResponse(BaseSchema):
    id: UUID
    name: str
    image_id: UUID
    image_name: str
    developer_id: Optional[str] = None
    provider: str
    selected_tools: Optional[list[str]] = None
    status: WorkspaceStatus
    workspace_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class WorkspaceActionResponse(BaseSchema):
    message: str
    status: WorkspaceStatus
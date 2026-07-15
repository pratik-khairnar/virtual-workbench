from uuid import UUID
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceActionResponse,
)

from app.db.models import WorkspaceStatus

from app.services.workspace_service import (
    create_workspace as create_workspace_service,
    get_workspace as get_workspace_service,
    delete_workspace as delete_workspace_service,
    get_workspaces as get_workspaces_service,
    start_workspace as start_workspace_service,
    stop_workspace as stop_workspace_service,
)

router = APIRouter(
    prefix="/workspaces",
    tags=["Workspaces"]
)


@router.get("/", response_model=List[WorkspaceResponse])
def get_workspaces(
    db: Session = Depends(get_db)
):
    workspaces = get_workspaces_service(db)

    return [
        WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,

            image_id=workspace.image_id,
            image_name=workspace.image.name,

            developer_id=workspace.assigned_to,

            provider=workspace.provider,
            selected_tools=workspace.selected_tools,

            status=workspace.status,
            workspace_url=workspace.workspace_url,

            created_at=workspace.created_at,
            updated_at=workspace.updated_at
        )
        for workspace in workspaces
    ]


@router.post("/", response_model=WorkspaceResponse)
def create_workspace(
    workspace: WorkspaceCreate,
    db: Session = Depends(get_db)
):
    try:
        new_workspace = create_workspace_service(db, workspace)

        return WorkspaceResponse(
            id=new_workspace.id,
            name=new_workspace.name,

            image_id=new_workspace.image_id,
            image_name=new_workspace.image.name,

            developer_id=new_workspace.assigned_to,

            provider=new_workspace.provider,
            selected_tools=new_workspace.selected_tools,

            status=new_workspace.status,
            workspace_url=new_workspace.workspace_url,

            created_at=new_workspace.created_at,
            updated_at=new_workspace.updated_at
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db)
):
    try:
        workspace = get_workspace_service(db, workspace_id)

        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,

            image_id=workspace.image_id,
            image_name=workspace.image.name,

            developer_id=workspace.assigned_to,

            provider=workspace.provider,
            selected_tools=workspace.selected_tools,

            status=workspace.status,
            workspace_url=workspace.workspace_url,

            created_at=workspace.created_at,
            updated_at=workspace.updated_at
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.patch("/{workspace_id}")
def update_workspace(workspace_id: UUID):
    raise HTTPException(
        status_code=501,
        detail="Update workspace API not implemented yet"
    )


@router.delete("/{workspace_id}", response_model=WorkspaceActionResponse)
def delete_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db)
):
    try:
        delete_workspace_service(db, workspace_id)

        return WorkspaceActionResponse(
            message="Workspace deleted successfully",
            status=WorkspaceStatus.DELETED
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.post("/{workspace_id}/start", response_model=WorkspaceActionResponse)
def start_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db)
):
    try:
        start_workspace_service(db, workspace_id)

        return WorkspaceActionResponse(
            message="Workspace started successfully",
            status=WorkspaceStatus.RUNNING
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.post("/{workspace_id}/stop", response_model=WorkspaceActionResponse)
def stop_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db)
):
    try:
        stop_workspace_service(db, workspace_id)

        return WorkspaceActionResponse(
            message="Workspace stopped successfully",
            status=WorkspaceStatus.STOPPED
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.models import (
    Workspace,
    Image,
    User,
    WorkspaceStatus,
)

from app.schemas.workspace import WorkspaceCreate

from app.services.provisioning_client import (
    delete_workspace as provision_delete,
    start_workspace as provision_start,
    stop_workspace as provision_stop,
)


def create_workspace(db: Session, workspace: WorkspaceCreate):
    """
    Admin provisions a new workspace for a developer.
    Developer can be identified by email or username.
    """

    # Validate image
    image = db.query(Image).filter(
        Image.id == workspace.image_id
    ).first()

    if image is None:
        raise ValueError("Image not found")

    # Validate developer — lookup by email OR username
    developer = db.query(User).filter(
        or_(
            User.email == workspace.developer_id,
            User.username == workspace.developer_id
        )
    ).first()

    if developer is None:
        raise ValueError(f"Developer '{workspace.developer_id}' not found. Use the developer's email or username.")

    if developer.role != "DEVELOPER":
        raise ValueError("Selected user is not a developer")

    # Find admin user (the one creating this workspace)
    admin = db.query(User).filter(
        User.role == "ADMIN"
    ).first()

    if admin is None:
        raise ValueError("No admin user found")

    # Create workspace entry — save directly as STOPPED (provisioner not connected)
    new_workspace = Workspace(
        name=workspace.name,
        owner_id=admin.id,
        assigned_to=developer.id,
        image_id=workspace.image_id,
        provider=workspace.provider,
        selected_tools=workspace.selected_tools or [],
        status=WorkspaceStatus.STOPPED
    )

    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)

    return new_workspace


def get_workspace(db: Session, workspace_id: UUID):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id
    ).first()

    if workspace is None:
        raise ValueError("Workspace not found")

    return workspace


def get_workspaces(db: Session):
    """
    Admin dashboard.
    Returns every provisioned workspace.
    """
    return db.query(Workspace).all()


def get_my_workspace(db: Session, developer_id: UUID):
    """
    Developer dashboard.
    Returns the workspace assigned to the logged-in developer.
    """

    workspace = db.query(Workspace).filter(
        Workspace.assigned_to == developer_id
    ).first()

    if workspace is None:
        raise ValueError("No workspace assigned")

    return workspace


def delete_workspace(db: Session, workspace_id: UUID):
    workspace = get_workspace(db, workspace_id)

    try:
        provision_delete(str(workspace.id))
    except Exception:
        pass  # Provisioning service may not be running

    db.delete(workspace)
    db.commit()

    return workspace


def start_workspace(db: Session, workspace_id: UUID):
    workspace = get_workspace(db, workspace_id)

    try:
        provision_start(str(workspace.id))
    except Exception:
        pass  # Provisioning service may not be running

    workspace.status = WorkspaceStatus.RUNNING

    db.commit()
    db.refresh(workspace)

    return workspace


def stop_workspace(db: Session, workspace_id: UUID):
    workspace = get_workspace(db, workspace_id)

    try:
        provision_stop(str(workspace.id))
    except Exception:
        pass  # Provisioning service may not be running

    workspace.status = WorkspaceStatus.STOPPED

    db.commit()
    db.refresh(workspace)

    return workspace
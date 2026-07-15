from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import (
    Workspace,
    Image,
    User,
    WorkspaceStatus,
)

from app.schemas.workspace import WorkspaceCreate

from app.services.provisioning_client import (
    create_workspace as provision_workspace,
    delete_workspace as provision_delete,
    start_workspace as provision_start,
    stop_workspace as provision_stop,
)


def create_workspace(db: Session, workspace: WorkspaceCreate):
    """
    Admin provisions a new workspace for a developer.
    """

    # Validate image
    image = db.query(Image).filter(
        Image.id == workspace.image_id
    ).first()

    if image is None:
        raise ValueError("Image not found")

    # Validate developer
    developer = db.query(User).filter(
        User.id == workspace.developer_id
    ).first()

    if developer is None:
        raise ValueError("Developer not found")

    if developer.role != "DEVELOPER":
        raise ValueError("Selected user is not a developer")

    # Temporary admin until authentication is implemented
    admin = db.query(User).filter(
        User.role == "ADMIN"
    ).first()

    if admin is None:
        raise ValueError("No admin user found")

    # Create workspace entry
    new_workspace = Workspace(
        name=workspace.name,
        owner_id=admin.id,
        assigned_to=developer.id,
        image_id=workspace.image_id,
        provider=workspace.provider,
        selected_tools=workspace.selected_tools,
        status=WorkspaceStatus.CREATING
    )

    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)

    # Call provisioning service
    try:
        result = provision_workspace(
            workspace_id=str(new_workspace.id),
            name=new_workspace.name,
            image_id=str(new_workspace.image_id),
            provider=new_workspace.provider,
            selected_tools=new_workspace.selected_tools,
        )

    except Exception as e:
        new_workspace.status = WorkspaceStatus.FAILED
        db.commit()
        raise ValueError(f"Provisioning failed: {e}")

    workspace_data = result["workspace"]

    # Update workspace
    new_workspace.workspace_url = workspace_data["accessUrl"]
    new_workspace.status = WorkspaceStatus(
        workspace_data["status"].upper()
    )

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

    provision_delete(str(workspace.id))

    db.delete(workspace)
    db.commit()

    return workspace


def start_workspace(db: Session, workspace_id: UUID):
    workspace = get_workspace(db, workspace_id)

    provision_start(str(workspace.id))

    workspace.status = WorkspaceStatus.RUNNING

    db.commit()
    db.refresh(workspace)

    return workspace


def stop_workspace(db: Session, workspace_id: UUID):
    workspace = get_workspace(db, workspace_id)

    provision_stop(str(workspace.id))

    workspace.status = WorkspaceStatus.STOPPED

    db.commit()
    db.refresh(workspace)

    return workspace
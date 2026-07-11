from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Workspace, Image, User
from app.schemas.workspace import WorkspaceCreate


def create_workspace(db: Session, workspace: WorkspaceCreate):
    """
    Creates a new workspace in the database.
    """

    # Check if image exists
    image = db.query(Image).filter(
        Image.id == workspace.image_id
    ).first()

    if image is None:
        raise ValueError("Image not found")

    # Temporary owner until authentication is implemented
    owner = db.query(User).first()

    if owner is None:
        raise ValueError("No users found")

    new_workspace = Workspace(
        name=workspace.name,
        image_id=workspace.image_id,
        owner_id=owner.id,
        provider=workspace.provider
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


def delete_workspace(db: Session, workspace_id: UUID):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id
    ).first()

    if workspace is None:
        raise ValueError("Workspace not found")

    db.delete(workspace)

    db.commit()

    return workspace

def get_workspaces(db: Session):
    return db.query(Workspace).all()
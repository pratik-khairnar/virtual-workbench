import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    Enum,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from sqlalchemy.orm import relationship

from app.db.database import Base

class WorkspaceStatus(str, enum.Enum):
    CREATING = "CREATING"
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
    FAILED = "FAILED"
    DELETED = "DELETED"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(
    String(20),
    nullable=False,
    default="DEVELOPER"
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    owned_workspaces = relationship(
    "Workspace",
    foreign_keys="Workspace.owner_id",
    back_populates="owner"
    )

    assigned_workspaces = relationship(
    "Workspace",
    foreign_keys="Workspace.assigned_to",
    back_populates="developer"
    )

class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    os = Column(String(50), nullable=False)
    description = Column(Text)
    image_uri = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspaces = relationship("Workspace", back_populates="image")

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)

    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    assigned_to = Column(
    UUID(as_uuid=True),
    ForeignKey("users.id"),
    nullable=False
    )
    
    image_id = Column(
        UUID(as_uuid=True),
        ForeignKey("images.id"),
        nullable=False
    )

    provider = Column(
    String(20),
    nullable=False,
    default="aws"
    )

    selected_tools = Column(
    ARRAY(String),
    nullable=True
    )

    status = Column(
        Enum(WorkspaceStatus),
        default=WorkspaceStatus.CREATING,
        nullable=False
    )

    workspace_url = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    owner = relationship(
    "User",
    foreign_keys=[owner_id],
    back_populates="owned_workspaces"
    )

    developer = relationship(
    "User",
    foreign_keys=[assigned_to],
    back_populates="assigned_workspaces"
    )
    
    image = relationship("Image", back_populates="workspaces")

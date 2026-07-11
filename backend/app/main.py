from fastapi import FastAPI

from app.db.database import Base, engine
from app.db import models
from app.api.v1.users import router as user_router
from app.api.v1.images import router as image_router
from app.api.v1.workspaces import router as workspace_router

from fastapi.middleware.cors import CORSMiddleware



Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Virtual Workbench Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Virtual Workbench Backend is running!"}

app.include_router(user_router)
app.include_router(image_router)
app.include_router(workspace_router)
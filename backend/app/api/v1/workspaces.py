from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/workspaces",
    tags=["Workspaces"]
)


@router.get("/")
def get_workspaces():
    raise HTTPException(
        status_code=501,
        detail="Get workspaces API not implemented yet"
    )


@router.post("/")
def create_workspace():
    raise HTTPException(
        status_code=501,
        detail="Create workspace API not implemented yet"
    )


@router.get("/{workspace_id}")
def get_workspace(workspace_id: str):
    raise HTTPException(
        status_code=501,
        detail="Get workspace API not implemented yet"
    )


@router.patch("/{workspace_id}")
def update_workspace(workspace_id: str):
    raise HTTPException(
        status_code=501,
        detail="Update workspace API not implemented yet"
    )


@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: str):
    raise HTTPException(
        status_code=501,
        detail="Delete workspace API not implemented yet"
    )


@router.post("/{workspace_id}/start")
def start_workspace(workspace_id: str):
    raise HTTPException(
        status_code=501,
        detail="Start workspace API not implemented yet"
    )


@router.post("/{workspace_id}/stop")
def stop_workspace(workspace_id: str):
    raise HTTPException(
        status_code=501,
        detail="Stop workspace API not implemented yet"
    )
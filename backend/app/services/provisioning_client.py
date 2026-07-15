import requests

BASE_URL = "http://localhost:3001/api/workspaces"


def create_workspace(
    workspace_id: str,
    name: str,
    image_id: str,
    provider: str,
    selected_tools: list[str],
):
    response = requests.post(
        BASE_URL,
        json={
            "id": workspace_id,
            "name": name,
            "imageId": image_id,
            "provider": provider,
            "selectedTools": selected_tools,
        },
        timeout=120,
    )

    response.raise_for_status()

    return response.json()


def delete_workspace(workspace_id: str):
    response = requests.delete(
        f"{BASE_URL}/{workspace_id}",
        timeout=60,
    )

    response.raise_for_status()

    return response.json()


def start_workspace(workspace_id: str):
    response = requests.post(
        f"{BASE_URL}/{workspace_id}/start",
        timeout=60,
    )

    response.raise_for_status()

    return response.json()


def stop_workspace(workspace_id: str):
    response = requests.post(
        f"{BASE_URL}/{workspace_id}/stop",
        timeout=60,
    )

    response.raise_for_status()

    return response.json()
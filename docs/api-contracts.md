# Virtual Workbench Backend API Contracts

Version: v1
Base URL: /api/v1 (Future)
Current Development: Localhost

---

# Authentication APIs

## POST /users/register

### Purpose
Registers a new user.

### Request

```json
{
    "username": "pratik",
    "email": "pratik@gmail.com",
    "password": "password123"
}
```

### Response (201 Created)

```json
{
    "id": "uuid",
    "username": "pratik",
    "email": "pratik@gmail.com",
    "role": "USER",
    "created_at": "2026-07-10T13:00:00"
}
```

### Errors

400 → Email already exists

422 → Invalid request

---

## POST /users/login

### Purpose

Authenticates user and returns JWT.

### Request

```json
{
    "email": "pratik@gmail.com",
    "password": "password123"
}
```

### Response

```json
{
    "access_token": "jwt_token",
    "token_type": "bearer"
}
```

### Errors

401 → Invalid credentials

422 → Invalid request

---

## GET /users/me

### Purpose

Returns currently logged in user.

### Headers

Authorization: Bearer <JWT>

### Response

```json
{
    "id": "uuid",
    "username": "pratik",
    "email": "pratik@gmail.com",
    "role": "USER"
}
```

---

# Image APIs

## GET /images

### Purpose

Returns all available workspace images.

### Response

```json
[
    {
        "id": "uuid",
        "name": "Ubuntu 24.04",
        "version": "24.04",
        "os": "Ubuntu",
        "description": "Ubuntu Development Image"
    }
]
```

---

## GET /images/{image_id}

### Purpose

Returns details of one workspace image.

### Response

```json
{
    "id": "uuid",
    "name": "Ubuntu 24.04",
    "version": "24.04",
    "os": "Ubuntu",
    "description": "Ubuntu Development Image"
}
```

404 → Image not found

---

# Workspace APIs

## GET /workspaces

### Purpose

Returns all workspaces owned by current user.

### Headers

Authorization: Bearer <JWT>

### Response

```json
[
    {
        "id": "uuid",
        "name": "ADAS Workspace",
        "status": "RUNNING",
        "workspace_url": "https://workspace.example.com",
        "image_name": "Ubuntu 24.04"
    }
]
```

---

## POST /workspaces

### Purpose

Creates a new workspace.

### Request

```json
{
    "name": "ADAS Workspace",
    "image_id": "uuid"
}
```

### Response

```json
{
    "id": "uuid",
    "status": "CREATING",
    "message": "Workspace provisioning initiated"
}
```

### Errors

404 → Image not found

400 → Invalid request

---

## GET /workspaces/{workspace_id}

### Purpose

Returns details of a workspace.

### Response

```json
{
    "id": "uuid",
    "name": "ADAS Workspace",
    "status": "RUNNING",
    "workspace_url": "https://workspace.example.com",
    "image_name": "Ubuntu 24.04",
    "created_at": "2026-07-10T13:00:00"
}
```

404 → Workspace not found

---

## PATCH /workspaces/{workspace_id}

### Purpose

Updates workspace metadata.

### Request

```json
{
    "name": "ADAS Development Workspace"
}
```

### Response

```json
{
    "message": "Workspace updated successfully"
}
```

---

## DELETE /workspaces/{workspace_id}

### Purpose

Deletes a workspace.

### Response

```json
{
    "message": "Workspace deleted successfully"
}
```

---

## POST /workspaces/{workspace_id}/start

### Purpose

Starts a stopped workspace.

### Response

```json
{
    "message": "Workspace start initiated",
    "status": "STARTING"
}
```

---

## POST /workspaces/{workspace_id}/stop

### Purpose

Stops a running workspace.

### Response

```json
{
    "message": "Workspace stop initiated",
    "status": "STOPPING"
}
```
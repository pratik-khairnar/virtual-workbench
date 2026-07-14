# Virtual Workbench

Open-source cloud workspace platform — provision, manage, and access development environments from your browser.

## Project Structure

```
kpit/
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── server.js                  # Express app entry point
│   │   ├── config.js                  # Environment-driven config
│   │   ├── db/                        # JSON file-based database
│   │   ├── image-service/             # Docker image management
│   │   ├── catalog-service/           # Image catalog & versioning
│   │   ├── provisioning-service/      # Workspace lifecycle (create/stop/start/delete)
│   │   ├── events/                    # Internal event bus
│   │   └── shared/                    # Alerting utilities
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/         # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
└── package.json      # Root orchestration scripts
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Docker** (optional — workspaces run in simulation mode without it)

### Install Dependencies

```bash
npm run install:all
```

### Run in Development

Start both backend and frontend simultaneously:

```bash
npm run dev
```

Or run them individually:

```bash
# Backend only (http://localhost:3001)
npm run dev:backend

# Frontend only (http://localhost:5173)
npm run dev:frontend
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workspaces` | Create a workspace |
| `GET` | `/api/workspaces` | List all workspaces |
| `GET` | `/api/workspaces/active` | List running workspaces |
| `GET` | `/api/workspaces/:id` | Get workspace details |
| `POST` | `/api/workspaces/:id/stop` | Stop a workspace |
| `POST` | `/api/workspaces/:id/start` | Start a stopped workspace |
| `DELETE` | `/api/workspaces/:id` | Delete a workspace |
| `GET` | `/api/images` | List registered images |
| `POST` | `/api/images/register` | Register a new image |
| `GET` | `/api/catalog` | Browse image catalog |
| `GET` | `/health` | Health check |

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `WEBHOOK_SECRET` | `dev-secret-...` | Gitea/GitHub webhook secret |
| `ENABLE_VULN_SCAN` | `false` | Enable Trivy vulnerability scanning |
| `CONTAINER_REGISTRY` | `localhost:5000` | Docker registry URL |
| `ALERT_WEBHOOK_URL` | — | Slack/Discord alert webhook |

## License

MIT

const crypto = require('crypto');
const { execSync } = require('child_process');
const { db } = require('../db/database');
const { redAlert } = require('../shared/alerter');
const config = require('../config');

/**
 * PROVISIONING SERVICE
 *
 * Launches actual workspace containers from catalog images.
 * Each workspace is a Docker container running code-server (VS Code in browser).
 *
 * Flow:
 *   1. User picks an image from the catalog
 *   2. Service pulls/builds the Docker image
 *   3. Runs a container with code-server exposed on a unique port
 *   4. Returns the workspace URL to the user
 *   5. Manages lifecycle: start, stop, delete
 */

const WORKSPACE_PORT_START = 8100; // Workspaces get ports 8100, 8101, 8102...

// ─── Docker Helpers ───────────────────────────────────────────────────

function isDockerAvailable() {
  try {
    execSync('docker info', { encoding: 'utf-8', stdio: 'pipe', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function getNextPort() {
  const workspaces = db.getAllWorkspaces();
  const usedPorts = workspaces
    .filter(w => w.status !== 'deleted')
    .map(w => w.port);

  let port = WORKSPACE_PORT_START;
  while (usedPorts.includes(port)) {
    port++;
  }
  return port;
}

// ─── Create Workspace ─────────────────────────────────────────────────

/**
 * Creates and starts a new workspace container.
 *
 * Supports multiple Docker images:
 *  - codercom/code-server (VS Code, port 8080, PASSWORD env)
 *  - linuxserver/code-server (VS Code, port 8443, PASSWORD env)
 *  - linuxserver/webtop:* (Full desktop, port 3000, no password)
 *  - Any custom image
 */
function createWorkspace({ name, catalogEntryId, userId, dockerImage, containerPort }) {
  const id = crypto.randomUUID();
  const containerName = `workspace-${name}-${id.substring(0, 8)}`;
  const port = getNextPort();

  // Resolve Docker image and internal port
  const image = dockerImage || 'codercom/code-server:latest';
  const internalPort = containerPort || 8080;

  // Look up the catalog entry to get the image info
  const catalogEntry = catalogEntryId ? db.getCatalogEntryById(catalogEntryId) : null;

  const workspace = {
    id,
    name: name || 'my-workspace',
    containerName,
    catalogEntryId: catalogEntryId || null,
    catalogImageName: catalogEntry ? catalogEntry.name : null,
    dockerImage: image,
    userId: userId || 'default',
    port,
    status: 'creating',
    accessUrl: null,
    containerId: null,
    error: null,
  };

  db.insertWorkspace(workspace);

  if (!isDockerAvailable()) {
    // Simulation mode — no Docker installed
    console.log(`[Provisioning] Docker not available — running in simulation mode`);
    db.updateWorkspace(id, {
      status: 'running',
      accessUrl: `http://localhost:${port} (simulated — install Docker for real workspaces)`,
      containerId: `sim-${id.substring(0, 12)}`,
    });

    return {
      ...workspace,
      status: 'running',
      accessUrl: `http://localhost:${port} (simulated)`,
      containerId: `sim-${id.substring(0, 12)}`,
      simulated: true,
    };
  }

  try {
    console.log(`[Provisioning] Pulling image: ${image}`);
    try {
      execSync(`docker pull ${image}`, { encoding: 'utf-8', stdio: 'pipe', timeout: 300000 });
    } catch (pullErr) {
      console.warn(`[Provisioning] Pull failed (may already exist locally): ${pullErr.message}`);
    }

    // Build env vars based on image type
    let envFlags = '';
    let password = null;
    if (image.includes('linuxserver/webtop')) {
      // linuxserver/webtop — full desktop, no password by default
      envFlags = `-e "PUID=1000" -e "PGID=1000"`;
    } else if (image.includes('linuxserver/code-server')) {
      // linuxserver/code-server — VS Code with PASSWORD env
      password = 'workspace123';
      envFlags = `-e "PASSWORD=${password}" -e "PUID=1000" -e "PGID=1000"`;
    } else {
      // codercom/code-server or other — PASSWORD env
      password = 'workspace123';
      envFlags = `-e "PASSWORD=${password}"`;
    }

    console.log(`[Provisioning] Starting container: ${containerName} on port ${port} (image: ${image}, internal: ${internalPort})`);
    const containerId = execSync(
      `docker run -d ` +
      `--name "${containerName}" ` +
      `-p ${port}:${internalPort} ` +
      `${envFlags} ` +
      `--restart unless-stopped ` +
      `${image}`,
      { encoding: 'utf-8', stdio: 'pipe', timeout: 60000 }
    ).trim();

    const accessUrl = `http://localhost:${port}`;

    db.updateWorkspace(id, {
      status: 'running',
      accessUrl,
      containerId,
    });

    const logMsg = password
      ? `✅ Workspace ready: ${accessUrl} (password: ${password})`
      : `✅ Workspace ready: ${accessUrl} (no password)`;
    console.log(`[Provisioning] ${logMsg}`);

    return {
      ...workspace,
      status: 'running',
      accessUrl,
      containerId,
      password,
      simulated: false,
    };
  } catch (err) {
    const errorMsg = err.stderr || err.message;
    console.error(`[Provisioning] Failed to create workspace:`, errorMsg);
    db.updateWorkspace(id, { status: 'failed', error: errorMsg });
    redAlert('provisioning', `Failed to create workspace "${name}"`, { error: errorMsg });
    return { ...workspace, status: 'failed', error: errorMsg };
  }
}

// ─── Stop Workspace ───────────────────────────────────────────────────

function stopWorkspace(id) {
  const workspace = db.getWorkspaceById(id);
  if (!workspace) return { success: false, error: 'Workspace not found' };
  if (workspace.status === 'stopped') return { success: true, message: 'Already stopped' };

  if (isDockerAvailable() && workspace.containerId && !workspace.containerId.startsWith('sim-')) {
    try {
      execSync(`docker stop "${workspace.containerName}"`, {
        encoding: 'utf-8', stdio: 'pipe', timeout: 30000,
      });
    } catch (err) {
      console.warn(`[Provisioning] Stop warning: ${err.message}`);
    }
  }

  db.updateWorkspace(id, { status: 'stopped' });
  console.log(`[Provisioning] Workspace stopped: ${workspace.name}`);
  return { success: true, message: 'Workspace stopped' };
}

// ─── Start Workspace ──────────────────────────────────────────────────

function startWorkspace(id) {
  const workspace = db.getWorkspaceById(id);
  if (!workspace) return { success: false, error: 'Workspace not found' };
  if (workspace.status === 'running') return { success: true, message: 'Already running' };

  if (isDockerAvailable() && workspace.containerId && !workspace.containerId.startsWith('sim-')) {
    try {
      execSync(`docker start "${workspace.containerName}"`, {
        encoding: 'utf-8', stdio: 'pipe', timeout: 30000,
      });
    } catch (err) {
      console.error(`[Provisioning] Start failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  db.updateWorkspace(id, { status: 'running' });
  console.log(`[Provisioning] Workspace started: ${workspace.name}`);
  return { success: true, message: 'Workspace started', accessUrl: workspace.accessUrl };
}

// ─── Delete Workspace ─────────────────────────────────────────────────

function deleteWorkspace(id) {
  const workspace = db.getWorkspaceById(id);
  if (!workspace) return { success: false, error: 'Workspace not found' };

  if (isDockerAvailable() && workspace.containerId && !workspace.containerId.startsWith('sim-')) {
    try {
      execSync(`docker rm -f "${workspace.containerName}"`, {
        encoding: 'utf-8', stdio: 'pipe', timeout: 30000,
      });
    } catch (err) {
      console.warn(`[Provisioning] Remove warning: ${err.message}`);
    }
  }

  db.updateWorkspace(id, { status: 'deleted' });
  console.log(`[Provisioning] Workspace deleted: ${workspace.name}`);
  return { success: true, message: 'Workspace deleted' };
}

// ─── Query Helpers ────────────────────────────────────────────────────

function getWorkspaceById(id) {
  return db.getWorkspaceById(id);
}

function getAllWorkspaces() {
  return db.getAllWorkspaces();
}

function getActiveWorkspaces() {
  return db.getWorkspacesByStatus('running');
}

module.exports = {
  isDockerAvailable,
  createWorkspace,
  stopWorkspace,
  startWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  getAllWorkspaces,
  getActiveWorkspaces,
};

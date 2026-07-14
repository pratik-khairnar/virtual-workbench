import api from './api';

// Available workspace images — each maps to a real Docker image
export const FALLBACK_IMAGES = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Standard Ubuntu 24.04 LTS",
    version: "24.04",
    os: "Ubuntu",
    description: "Full Ubuntu Desktop VM in browser — KDE environment",
    dockerImage: "lscr.io/linuxserver/webtop:ubuntu-kde",
    containerPort: 3000,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Enterprise Cloud Linux 2023",
    version: "2023",
    os: "Cloud Linux",
    description: "Full Linux desktop in browser — Ubuntu XFCE with GUI",
    dockerImage: "linuxserver/webtop:ubuntu-xfce",
    containerPort: 3000,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Minimal Debian 12 Bookworm",
    version: "12",
    os: "Debian",
    description: "VS Code in browser — Debian-based lightweight environment",
    dockerImage: "linuxserver/code-server:latest",
    containerPort: 8443,
  }
];

// ─── Auth (client-side session — Node.js backend has no auth) ─────────

export const login = async (email, password) => {
  // Simulate login with local session since the Node.js backend has no auth
  const userData = {
    id: 'local-user',
    username: email.split('@')[0],
    email: email,
    role: 'USER',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem('user', JSON.stringify(userData));
  return userData;
};

export const register = async (username, email, password) => {
  // Simulate registration — store locally
  const userData = {
    id: 'local-user',
    username: username,
    email: email,
    role: 'USER',
    created_at: new Date().toISOString(),
  };
  return userData;
};

export const getCurrentUser = async () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  throw new Error("No active session profile found");
};

// ─── Helper: normalize status to uppercase ────────────────────────────

const normalizeStatus = (status) => {
  if (!status) return 'UNKNOWN';
  return status.toUpperCase();
};

// ─── Workspaces ───────────────────────────────────────────────────────

export const getWorkspaces = async () => {
  try {
    const response = await api.get('/workspaces');
    const workspaces = response.data.workspaces || [];

    return workspaces.map(ws => ({
      id: ws.id,
      name: ws.name,
      status: normalizeStatus(ws.status),
      provider: 'Docker',
      image_name: ws.catalogImageName || ws.dockerImage || 'code-server',
      image_id: ws.catalogEntryId,
      workspace_url: ws.accessUrl ? ws.accessUrl.replace('localhost', window.location.hostname) : null,
      dockerImage: ws.dockerImage || null,
      created_at: ws.created_at,
      updated_at: ws.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return [];
  }
};

export const createWorkspace = async (payload) => {
  // Look up the selected image to get its Docker config
  const selectedImage = FALLBACK_IMAGES.find(img => img.id === payload.image_id);

  const backendPayload = {
    name: payload.name,
    catalogEntryId: payload.image_id || null,
    dockerImage: selectedImage?.dockerImage || 'codercom/code-server:latest',
    containerPort: selectedImage?.containerPort || 8080,
    userId: 'default',
  };

  const response = await api.post('/workspaces', backendPayload);
  return response.data;
};

export const deleteWorkspace = async (workspaceId) => {
  const response = await api.delete(`/workspaces/${workspaceId}`);
  return response.data;
};

export const startWorkspace = async (workspaceId) => {
  const response = await api.post(`/workspaces/${workspaceId}/start`);
  return { status: "RUNNING", message: response.data.message || "Workspace start initiated" };
};

export const stopWorkspace = async (workspaceId) => {
  const response = await api.post(`/workspaces/${workspaceId}/stop`);
  return { status: "STOPPED", message: response.data.message || "Workspace stop initiated" };
};

// ─── Images ───────────────────────────────────────────────────────────

export const getImages = async () => {
  // Always return the pre-configured images with correct Docker mappings
  return FALLBACK_IMAGES;
};

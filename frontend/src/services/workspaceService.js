import api from './api';

// Deterministic image UUIDs seeded in the database (generic names)
export const FALLBACK_IMAGES = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Standard Ubuntu 24.04 LTS",
    version: "24.04",
    os: "Ubuntu",
    description: "Ubuntu Development Environment with Python, Node.js and Docker"
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Enterprise Cloud Linux 2023",
    version: "2023",
    os: "Cloud Linux",
    description: "Cloud-optimized Linux image for backend microservices"
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Minimal Debian 12 Bookworm",
    version: "12",
    os: "Debian",
    description: "Minimal debian system image"
  }
];

// Helper to manage client-side state simulation for unimplemented start/stop APIs
const getSimulatedStatus = (id, backendStatus) => {
  const simulated = localStorage.getItem('simulated_statuses');
  if (simulated) {
    const statuses = JSON.parse(simulated);
    if (statuses[id]) return statuses[id];
  }
  return backendStatus;
};

const setSimulatedStatus = (id, status) => {
  const simulated = localStorage.getItem('simulated_statuses') || '{}';
  const statuses = JSON.parse(simulated);
  statuses[id] = status;
  localStorage.setItem('simulated_statuses', JSON.stringify(statuses));
};

export const login = async (email, password) => {
  // Original backend login returns UserResponse directly on success
  const response = await api.post('/users/login', { email, password });
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await api.post('/users/register', { username, email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  // Since GET /users/me returns 501 on original backend, we rely on the local session
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  throw new Error("No active session profile found");
};

export const getWorkspaces = async () => {
  const response = await api.get('/workspaces');
  
  // Override status and urls with simulated data
  return response.data.map(ws => {
    const simulatedStatus = getSimulatedStatus(ws.id, ws.status);
    return {
      ...ws,
      status: simulatedStatus,
      workspace_url: simulatedStatus === 'RUNNING' 
        ? `https://ws-${ws.id.substring(0, 6)}.cloudbench.net` 
        : null
    };
  });
};

export const createWorkspace = async (payload) => {
  // Payload structure: { name, image_id, provider }
  const response = await api.post('/workspaces', payload);
  return response.data;
};

export const deleteWorkspace = async (workspaceId) => {
  const response = await api.delete(`/workspaces/${workspaceId}`);
  
  // Clean up local simulation status
  const simulated = localStorage.getItem('simulated_statuses');
  if (simulated) {
    const statuses = JSON.parse(simulated);
    delete statuses[workspaceId];
    localStorage.setItem('simulated_statuses', JSON.stringify(statuses));
  }
  return response.data;
};

export const startWorkspace = async (workspaceId) => {
  try {
    // Attempt backend POST start (returns 501 on original backend)
    await api.post(`/workspaces/${workspaceId}/start`);
  } catch (error) {
    console.warn("Start workspace API returned error (expected on 501), simulating locally.");
  }
  setSimulatedStatus(workspaceId, 'RUNNING');
  return { status: "RUNNING", message: "Workspace start initiated" };
};

export const stopWorkspace = async (workspaceId) => {
  try {
    // Attempt backend POST stop (returns 501 on original backend)
    await api.post(`/workspaces/${workspaceId}/stop`);
  } catch (error) {
    console.warn("Stop workspace API returned error (expected on 501), simulating locally.");
  }
  setSimulatedStatus(workspaceId, 'STOPPED');
  return { status: "STOPPED", message: "Workspace stop initiated" };
};

export const getImages = async () => {
  try {
    const response = await api.get('/images');
    // Map any brand names to generic names dynamically
    return response.data.map(img => {
      if (img.name.includes("Amazon")) {
        return {
          ...img,
          name: img.name.replace("Amazon", "Enterprise Cloud"),
          os: img.os.replace("Amazon", "Cloud")
        };
      }
      return img;
    });
  } catch (error) {
    console.warn("Images API failed (expected 501), falling back to local seed data", error);
    return FALLBACK_IMAGES;
  }
};

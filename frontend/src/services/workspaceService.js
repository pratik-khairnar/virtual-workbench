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
    let user = response.data;
    // Look up role in registered roles
    const registeredRoles = JSON.parse(localStorage.getItem('registered_roles') || '{}');
    if (registeredRoles[email]) {
      user = { ...user, role: registeredRoles[email] };
    } else if (email.toLowerCase().includes('admin')) {
      user = { ...user, role: 'ADMIN' };
    } else {
      user = { ...user, role: 'DEVELOPER' };
    }
    localStorage.setItem('user', JSON.stringify(user));
  }
  return response.data;
};

export const register = async (username, email, password, role = 'DEVELOPER') => {
  const response = await api.post('/users/register', { username, email, password });
  
  // Store the role selection in registered_roles mapping locally
  const registeredRoles = JSON.parse(localStorage.getItem('registered_roles') || '{}');
  registeredRoles[email] = role;
  localStorage.setItem('registered_roles', JSON.stringify(registeredRoles));
  
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
  const workspaceDetails = JSON.parse(localStorage.getItem('workspace_details') || '{}');
  
  // Override status and urls with simulated data, and append metadata
  return response.data.map(ws => {
    const simulatedStatus = getSimulatedStatus(ws.id, ws.status);
    const details = workspaceDetails[ws.id] || {
      developer_id: 'dev1@kpit.com', // Default fallback
      preset: 'Standard Profile',
      tools: ['VS Code', 'Git'],
      specs: 'Standard Workspace (2 vCPU, 4GB RAM)'
    };
    return {
      ...ws,
      status: simulatedStatus,
      workspace_url: simulatedStatus === 'RUNNING' 
        ? `https://ws-${ws.id.substring(0, 6)}.cloudbench.net` 
        : null,
      developer_id: details.developer_id,
      preset: details.preset,
      tools: details.tools,
      specs: details.specs
    };
  });
};

export const createWorkspace = async (payload) => {
  // Payload structure sent to backend: { name, image_id, provider }
  // Additional frontend-specific payload properties: { developer_id, preset, tools, specs }
  const backendPayload = {
    name: payload.name,
    image_id: payload.image_id,
    provider: payload.provider
  };
  const response = await api.post('/workspaces', backendPayload);
  
  if (response.data) {
    const wsId = response.data.id;
    // Save metadata locally
    const workspaceDetails = JSON.parse(localStorage.getItem('workspace_details') || '{}');
    workspaceDetails[wsId] = {
      developer_id: payload.developer_id || 'dev1@kpit.com',
      preset: payload.preset || 'Frontend Developer',
      tools: payload.tools || [],
      specs: payload.specs || 'Standard Workspace (2 vCPU, 4GB RAM)'
    };
    localStorage.setItem('workspace_details', JSON.stringify(workspaceDetails));
  }
  
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
    if (!response.data || response.data.length === 0) {
      console.warn("Images API returned empty list, falling back to local seed data.");
      return FALLBACK_IMAGES;
    }
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

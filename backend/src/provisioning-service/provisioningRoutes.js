const express = require('express');
const router = express.Router();
const provisioningService = require('./provisioningService');

/**
 * PROVISIONING API ROUTES
 *
 * POST   /api/workspaces            — Create a new workspace
 * GET    /api/workspaces            — List all workspaces
 * GET    /api/workspaces/active     — List running workspaces
 * GET    /api/workspaces/:id        — Get workspace details
 * POST   /api/workspaces/:id/stop   — Stop a workspace
 * POST   /api/workspaces/:id/start  — Start a stopped workspace
 * DELETE /api/workspaces/:id        — Delete a workspace
 * GET    /api/workspaces/docker     — Check if Docker is available
 */

// ─── Check Docker status ─────────────────────────────────────────────

router.get('/docker', (req, res) => {
  const available = provisioningService.isDockerAvailable();
  res.json({
    dockerAvailable: available,
    message: available
      ? 'Docker is available — workspaces will run as real containers'
      : 'Docker not found — workspaces will run in simulation mode. Install Docker Desktop to launch real workspaces.',
  });
});

// ─── Create workspace ────────────────────────────────────────────────

router.post('/', express.json(), (req, res) => {
  const { name, catalogEntryId, userId, dockerImage, containerPort } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: '"name" is required' });
  }

  try {
    const workspace = provisioningService.createWorkspace({ name, catalogEntryId, userId, dockerImage, containerPort });

    if (workspace.status === 'failed') {
      return res.status(500).json({ success: false, workspace });
    }

    res.status(201).json({
      success: true,
      workspace,
      message: workspace.simulated
        ? `Workspace "${name}" created in simulation mode. Install Docker for real workspaces.`
        : `Workspace "${name}" is ready! Open ${workspace.accessUrl} (password: workspace123)`,
    });
  } catch (err) {
    console.error('[ProvisioningRoutes] Create error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── List workspaces ─────────────────────────────────────────────────

router.get('/', (req, res) => {
  const workspaces = provisioningService.getAllWorkspaces();
  res.json({ success: true, count: workspaces.length, workspaces });
});

router.get('/active', (req, res) => {
  const workspaces = provisioningService.getActiveWorkspaces();
  res.json({ success: true, count: workspaces.length, workspaces });
});

// ─── Get workspace by ID ─────────────────────────────────────────────

router.get('/:id', (req, res) => {
  const workspace = provisioningService.getWorkspaceById(req.params.id);
  if (!workspace) {
    return res.status(404).json({ success: false, error: 'Workspace not found' });
  }
  res.json({ success: true, workspace });
});

// ─── Stop workspace ──────────────────────────────────────────────────

router.post('/:id/stop', (req, res) => {
  const result = provisioningService.stopWorkspace(req.params.id);
  res.json({ success: result.success, ...result });
});

// ─── Start workspace ─────────────────────────────────────────────────

router.post('/:id/start', (req, res) => {
  const result = provisioningService.startWorkspace(req.params.id);
  res.json({ success: result.success, ...result });
});

// ─── Delete workspace ────────────────────────────────────────────────

router.delete('/:id', (req, res) => {
  const result = provisioningService.deleteWorkspace(req.params.id);
  res.json({ success: result.success, ...result });
});

module.exports = router;

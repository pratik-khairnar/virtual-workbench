const express = require('express');
const router = express.Router();
const imageService = require('./imageService');

/**
 * IMAGE SERVICE API ROUTES
 *
 * POST /api/images/webhook         — Receive Gitea/GitHub webhook (commit push)
 * POST /api/images/register        — Manually register an image (no webhook)
 * GET  /api/images                  — List all images
 * GET  /api/images/:id              — Get image by ID
 * GET  /api/images/status/:status   — Get images by status
 */

// ─── Webhook Endpoint (Gitea/GitHub push events) ──────────────────────

router.post('/webhook', express.json(), (req, res) => {
  const signature = req.headers['x-hub-signature-256'] || req.headers['x-gitea-signature'];

  // Step 1: Validate webhook signature
  if (signature) {
    const isValid = imageService.validateWebhookSignature(req.body, signature);
    if (!isValid) {
      console.error('[ImageRoutes] Invalid webhook signature — rejecting commit');
      return res.status(403).json({
        success: false,
        error: 'Invalid webhook signature — commit rejected (Red Alert)',
      });
    }
  }

  // Extract info from webhook payload (Gitea/GitHub format)
  const payload = req.body;
  const commitId = payload.after || payload.head_commit?.id || null;
  const repoUrl = payload.repository?.clone_url || payload.repository?.html_url || '';
  const repoName = payload.repository?.name || 'unknown';

  // Parse image name and version from commit message or branch
  // Convention: commit message contains "[image:name:version]" or use branch name
  const commitMessage = payload.head_commit?.message || payload.commits?.[0]?.message || '';
  const imageMatch = commitMessage.match(/\[image:([^:]+):([^\]]+)\]/);
  const name = imageMatch ? imageMatch[1] : repoName;
  const version = imageMatch ? imageMatch[2] : (commitId ? commitId.substring(0, 8) : Date.now().toString());

  // Step 2: Validate commit signature (if repo path available)
  // In MVP, we trust the webhook signature validation above.
  // In production, clone the repo and verify GPG signature.

  // Step 3-8: Run the full pipeline asynchronously
  // Respond immediately, process in background
  res.status(202).json({
    success: true,
    message: `Pipeline started for ${name}:${version}`,
    name,
    version,
  });

  // Run pipeline async (non-blocking)
  imageService.runPipeline({
    name,
    version,
    description: commitMessage,
    commitId,
    repoUrl,
    // In MVP without Docker build, these are null (register-only mode)
    dockerfilePath: null,
    contextPath: null,
  }).then(result => {
    if (result.success) {
      console.log(`[ImageRoutes] Pipeline completed: ${name}:${version}`);
    } else {
      console.error(`[ImageRoutes] Pipeline failed at step "${result.step}": ${result.error || JSON.stringify(result.report)}`);
    }
  }).catch(err => {
    console.error(`[ImageRoutes] Pipeline error:`, err);
  });
});

// ─── Manual Image Registration ────────────────────────────────────────

router.post('/register', express.json(), async (req, res) => {
  const { name, version, description, imageRef, dockerfilePath, contextPath } = req.body;

  if (!name || !version) {
    return res.status(400).json({
      success: false,
      error: 'name and version are required',
    });
  }

  try {
    const result = await imageService.runPipeline({
      name,
      version,
      description: description || '',
      commitId: null,
      repoUrl: null,
      dockerfilePath: dockerfilePath || null,
      contextPath: contextPath || null,
    });

    if (result.success) {
      res.status(201).json({ success: true, ...result });
    } else {
      res.status(422).json({ success: false, ...result });
    }
  } catch (err) {
    console.error(`[ImageRoutes] Registration error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Query Endpoints ─────────────────────────────────────────────────

router.get('/', (req, res) => {
  const images = imageService.getAllImages();
  res.json({ success: true, count: images.length, images });
});

router.get('/status/:status', (req, res) => {
  const images = imageService.getImagesByStatus(req.params.status);
  res.json({ success: true, count: images.length, images });
});

router.get('/:id', (req, res) => {
  const image = imageService.getImageById(req.params.id);
  if (!image) {
    return res.status(404).json({ success: false, error: 'Image not found' });
  }
  res.json({ success: true, image });
});

module.exports = router;

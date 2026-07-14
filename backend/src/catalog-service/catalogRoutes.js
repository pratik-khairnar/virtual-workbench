const express = require('express');
const router = express.Router();
const catalogService = require('./catalogService');

/**
 * CATALOG SERVICE API ROUTES
 *
 * GET  /api/catalog                 — List all available workspace images
 * GET  /api/catalog/:id             — Get catalog entry by ID
 * GET  /api/catalog/image/:name     — Get all versions of an image
 * GET  /api/catalog/alerts          — Get active alerts
 * POST /api/catalog/alerts/:id/ack  — Acknowledge an alert
 */

// ─── Catalog Queries ──────────────────────────────────────────────────

router.get('/', (req, res) => {
  const entries = catalogService.getAllCatalogEntries();
  res.json({
    success: true,
    count: entries.length,
    catalog: entries,
  });
});

router.get('/alerts', (req, res) => {
  const alerts = catalogService.getAlerts(false);
  res.json({
    success: true,
    count: alerts.length,
    alerts,
  });
});

router.get('/:id', (req, res) => {
  const entry = catalogService.getCatalogEntryById(req.params.id);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Catalog entry not found' });
  }
  res.json({ success: true, entry });
});

router.get('/image/:name', (req, res) => {
  const { getDb } = require('../db/database');
  const db = getDb();
  const entries = db
    .prepare('SELECT * FROM catalog_entries WHERE name = ? AND status = ? ORDER BY created_at DESC')
    .all(req.params.name, 'active');
  res.json({
    success: true,
    name: req.params.name,
    count: entries.length,
    versions: entries,
  });
});

// ─── Alert Management ─────────────────────────────────────────────────

router.post('/alerts/:id/ack', express.json(), (req, res) => {
  const { getDb } = require('../db/database');
  const db = getDb();
  const result = db
    .prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }
  res.json({ success: true, message: 'Alert acknowledged' });
});

module.exports = router;

const path = require('path');

module.exports = {
  port: process.env.PORT || 3001,

  db: {
    path: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'workbench.db'),
  },

  // Webhook secret for validating incoming Gitea/GitHub pushes
  webhookSecret: process.env.WEBHOOK_SECRET || 'dev-secret-change-in-production',

  // Where built image artifacts are stored on disk (MVP local storage replaces MinIO)
  imageStoragePath: process.env.IMAGE_STORAGE_PATH || path.join(__dirname, '..', 'data', 'images'),

  // Where generated YAML catalog manifests are stored
  catalogManifestPath: process.env.CATALOG_MANIFEST_PATH || path.join(__dirname, '..', 'data', 'catalog'),

  // Vulnerability scanning (set to true if Trivy CLI is installed)
  enableVulnScan: process.env.ENABLE_VULN_SCAN === 'true',

  // Container registry (e.g. Harbor, Docker Hub, or local)
  containerRegistry: process.env.CONTAINER_REGISTRY || 'localhost:5000',

  // Alert webhook URL for red alerts (Slack, Discord, etc.)
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || null,
};

const express = require('express');
const config = require('./config');
const { init, close } = require('./db/database');
const catalogService = require('./catalog-service/catalogService');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ─── Initialize Database ──────────────────────────────────────────────

init();

// ─── Start Catalog Service Event Listener ─────────────────────────────

catalogService.startListening();

// ─── Mount Routes ─────────────────────────────────────────────────────

app.use('/api/images', require('./image-service/imageRoutes'));
app.use('/api/catalog', require('./catalog-service/catalogRoutes'));
app.use('/api/workspaces', require('./provisioning-service/provisioningRoutes'));

// ─── Health Check ─────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  const provisioningService = require('./provisioning-service/provisioningService');
  res.json({
    status: 'ok',
    services: {
      imageService: 'running',
      catalogService: 'running',
      provisioningService: 'running',
    },
    dockerAvailable: provisioningService.isDockerAvailable(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Index ────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    name: 'Virtual Workbench — Image, Catalog & Provisioning Services',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      imageService: {
        webhook: 'POST /api/images/webhook',
        register: 'POST /api/images/register',
        listAll: 'GET /api/images',
        getById: 'GET /api/images/:id',
        byStatus: 'GET /api/images/status/:status',
      },
      catalogService: {
        listAll: 'GET /api/catalog',
        getById: 'GET /api/catalog/:id',
        byImage: 'GET /api/catalog/image/:name',
        alerts: 'GET /api/catalog/alerts',
        ackAlert: 'POST /api/catalog/alerts/:id/ack',
      },
      provisioningService: {
        create: 'POST /api/workspaces',
        listAll: 'GET /api/workspaces',
        active: 'GET /api/workspaces/active',
        getById: 'GET /api/workspaces/:id',
        stop: 'POST /api/workspaces/:id/stop',
        start: 'POST /api/workspaces/:id/start',
        delete: 'DELETE /api/workspaces/:id',
        dockerStatus: 'GET /api/workspaces/docker',
      },
    },
  });
});

// ─── Start Server ─────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Virtual Workbench Services`);
  console.log(`  Running on http://localhost:${config.port}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n  Image Service:      http://localhost:${config.port}/api/images`);
  console.log(`  Catalog Service:   http://localhost:${config.port}/api/catalog`);
  console.log(`  Provisioning:      http://localhost:${config.port}/api/workspaces`);
  console.log(`  Health Check:      http://localhost:${config.port}/health\n`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  close();
  process.exit(0);
});

module.exports = app;

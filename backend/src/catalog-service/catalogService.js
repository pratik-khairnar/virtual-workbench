const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { db } = require('../db/database');
const eventBus = require('../events/eventBus');
const { redAlert } = require('../shared/alerter');
const config = require('../config');

/**
 * CATALOG SERVICE
 *
 * Full pipeline from the architecture diagram:
 *   1. Read event from queue (EventBus replaces Kafka for MVP)
 *   2. Validate the event payload
 *   3. Build YAML manifest (image name, version, location, description)
 *   4. Push commit to Gitea (MVP: store locally)
 *   5. Schema validation (MVP: local AJV, replaces FluxCD/Argo)
 *   6. Store in database (MVP: JSON store, replaces PostgreSQL)
 *   7. Notify portal
 *   — On failure: Reject entity + Red Alert
 */

// ─── JSON Schema for catalog entries ──────────────────────────────────

const catalogEntrySchema = {
  type: 'object',
  required: ['name', 'version', 'location', 'sha256'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[a-zA-Z0-9][a-zA-Z0-9._-]*$',
    },
    version: {
      type: 'string',
      minLength: 1,
      maxLength: 64,
    },
    description: {
      type: 'string',
      maxLength: 1024,
    },
    location: {
      type: 'string',
      minLength: 1,
    },
    sha256: {
      type: 'string',
      pattern: '^[a-f0-9]{64}$',
    },
    imageType: {
      type: 'string',
      enum: ['container', 'vm'],
    },
  },
  additionalProperties: false,
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(catalogEntrySchema);

// ─── Step 1 & 2: Event Consumption + Payload Validation ───────────────

function validateEventPayload(payload) {
  if (!payload) {
    return { valid: false, errors: ['Payload is null or undefined'] };
  }
  const requiredFields = ['imageId', 'name', 'version', 'sha256', 'imageRef'];
  const missingFields = requiredFields.filter(f => !payload[f]);
  if (missingFields.length > 0) {
    return { valid: false, errors: [`Missing required fields: ${missingFields.join(', ')}`] };
  }
  return { valid: true, errors: [] };
}

// ─── Step 3: Build YAML Manifest ──────────────────────────────────────

function buildYamlManifest(payload) {
  const manifest = {
    apiVersion: 'catalog.workbench/v1',
    kind: 'WorkspaceImage',
    metadata: {
      name: payload.name,
      version: payload.version,
      createdAt: new Date().toISOString(),
    },
    spec: {
      description: payload.description || '',
      location: payload.imageRef,
      sha256: payload.sha256,
      imageType: payload.imageType || 'container',
      source: {
        repository: payload.repoUrl || '',
        commit: payload.commitId || '',
      },
    },
  };

  const yamlContent = yaml.dump(manifest, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  return { manifest, yamlContent };
}

function saveManifestToDisk(name, version, yamlContent) {
  const manifestDir = path.join(config.catalogManifestPath, name);
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifestPath = path.join(manifestDir, `${version}.yaml`);
  fs.writeFileSync(manifestPath, yamlContent, 'utf-8');
  console.log(`[CatalogService] Manifest saved: ${manifestPath}`);
  return manifestPath;
}

// ─── Step 4: Push to Gitea (MVP: stub) ────────────────────────────────

function pushToGitea(manifestPath, name, version) {
  console.log(`[CatalogService] [MVP-STUB] Would push ${manifestPath} to Gitea catalog repo`);
  return { success: true, stub: true };
}

// ─── Step 5: Schema Validation (replaces FluxCD/Argo) ─────────────────

function validateCatalogSchema(entry) {
  const dataToValidate = {
    name: entry.name,
    version: entry.version,
    description: entry.description || '',
    location: entry.location,
    sha256: entry.sha256,
    imageType: entry.imageType || 'container',
  };

  const isValid = validateSchema(dataToValidate);
  if (!isValid) {
    const errors = validateSchema.errors.map(e => `${e.instancePath} ${e.message}`);
    return { valid: false, errors };
  }
  return { valid: true, errors: [] };
}

// ─── Step 6: Store in Database ────────────────────────────────────────

function storeCatalogEntry(entry) {
  const id = crypto.randomUUID();
  const record = {
    id,
    imageId: entry.imageId,
    name: entry.name,
    version: entry.version,
    description: entry.description || '',
    location: entry.location,
    sha256: entry.sha256,
    manifestPath: entry.manifestPath || null,
    schemaValid: 1,
    status: 'active',
  };

  db.insertCatalogEntry(record);
  console.log(`[CatalogService] Catalog entry stored: ${entry.name} v${entry.version} (${id})`);
  return record;
}

// ─── Step 7: Notify Portal ────────────────────────────────────────────

function notifyPortal(catalogEntry) {
  eventBus.publish('catalog-updated', {
    entryId: catalogEntry.id,
    name: catalogEntry.name,
    version: catalogEntry.version,
    description: catalogEntry.description,
    location: catalogEntry.location,
    status: 'available',
    message: `New workspace image available: ${catalogEntry.name} v${catalogEntry.version}`,
  });
  console.log(`[CatalogService] Portal notified: ${catalogEntry.name} v${catalogEntry.version} is now available`);
}

// ─── Full Pipeline Orchestrator ───────────────────────────────────────

function processImageEvent(event) {
  const { payload } = event;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[CatalogService] Processing event: ${event.id}`);
  console.log(`${'─'.repeat(60)}\n`);

  // ── Step 1: Validate event payload ──
  const payloadValidation = validateEventPayload(payload);
  if (!payloadValidation.valid) {
    console.error(`[CatalogService] Invalid payload:`, payloadValidation.errors);
    db.upsertEvent({
      id: event.id,
      topic: event.topic,
      payload: JSON.stringify(payload),
      status: 'failed',
    });
    return { success: false, step: 'payload-validation', errors: payloadValidation.errors };
  }

  // ── Step 2: Build YAML manifest ──
  const { manifest, yamlContent } = buildYamlManifest(payload);
  const manifestPath = saveManifestToDisk(payload.name, payload.version, yamlContent);

  // ── Step 3: Push to Gitea (stub) ──
  pushToGitea(manifestPath, payload.name, payload.version);

  // ── Step 4: Validate schema (replaces FluxCD/Argo) ──
  const schemaValidation = validateCatalogSchema({
    name: payload.name,
    version: payload.version,
    description: payload.description,
    location: payload.imageRef,
    sha256: payload.sha256,
    imageType: payload.imageType,
  });

  if (!schemaValidation.valid) {
    redAlert('catalog-service', `Schema validation failed for ${payload.name}:${payload.version}`, {
      errors: schemaValidation.errors,
    });
    return { success: false, step: 'schema-validation', errors: schemaValidation.errors };
  }

  // ── Step 5: Store in database ──
  const catalogEntry = storeCatalogEntry({
    imageId: payload.imageId,
    name: payload.name,
    version: payload.version,
    description: payload.description,
    location: payload.imageRef,
    sha256: payload.sha256,
    manifestPath,
  });

  // ── Step 6: Notify portal ──
  notifyPortal(catalogEntry);

  // Mark event as consumed
  db.upsertEvent({
    id: event.id,
    topic: event.topic,
    payload: JSON.stringify(payload),
    status: 'consumed',
  });

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[CatalogService] Event processed successfully: ${event.id}`);
  console.log(`${'─'.repeat(60)}\n`);

  return { success: true, catalogEntryId: catalogEntry.id };
}

// ─── Start Listener ───────────────────────────────────────────────────

function startListening() {
  eventBus.subscribe('image-ready', (event) => {
    try {
      processImageEvent(event);
    } catch (err) {
      console.error(`[CatalogService] Error processing event:`, err);
      redAlert('catalog-service', `Unhandled error processing event ${event.id}: ${err.message}`, {
        eventId: event.id,
        stack: err.stack,
      });
    }
  });
  console.log('[CatalogService] Listening for image-ready events...');
}

// ─── Query Helpers ────────────────────────────────────────────────────

function getCatalogEntryById(id) {
  return db.getCatalogEntryById(id);
}

function getAllCatalogEntries() {
  return db.getAllCatalogEntries();
}

function getCatalogEntryByNameVersion(name, version) {
  return db.getCatalogEntryByNameVersion(name, version);
}

function getAlerts(acknowledged = false) {
  return acknowledged ? db.getAlerts(true) : db.getUnacknowledgedAlerts();
}

module.exports = {
  validateEventPayload,
  buildYamlManifest,
  saveManifestToDisk,
  pushToGitea,
  validateCatalogSchema,
  storeCatalogEntry,
  notifyPortal,
  processImageEvent,
  startListening,
  getCatalogEntryById,
  getAllCatalogEntries,
  getCatalogEntryByNameVersion,
  getAlerts,
};

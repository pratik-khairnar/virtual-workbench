const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * JSON File Store — zero-dependency database for MVP.
 *
 * Replaces SQLite/PostgreSQL with a simple JSON file.
 * Data lives in memory and is flushed to disk on every write.
 * Swap to PostgreSQL for production by matching the exported API.
 */

const DB_FILE = config.db.path.replace('.db', '.json');

// In-memory store
let store = {
  images: [],
  catalog_entries: [],
  event_log: [],
  alerts: [],
  workspaces: [],
};

// ─── Load / Save ──────────────────────────────────────────────────────

function load() {
  try {
    const dir = path.dirname(DB_FILE);
    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      store = JSON.parse(raw);
      console.log(`[Database] Loaded from ${DB_FILE}`);
    } else {
      save();
      console.log(`[Database] Created new store at ${DB_FILE}`);
    }
  } catch (err) {
    console.error(`[Database] Failed to load, starting fresh:`, err.message);
    save();
  }
}

function save() {
  try {
    const dir = path.dirname(DB_FILE);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Database] Failed to save:`, err.message);
  }
}

// ─── Generic CRUD Operations ──────────────────────────────────────────

function insert(collection, record) {
  if (!store[collection]) {
    store[collection] = [];
  }
  record.created_at = record.created_at || new Date().toISOString();
  record.updated_at = record.updated_at || new Date().toISOString();
  store[collection].push(record);
  save();
  return record;
}

function findById(collection, id) {
  return (store[collection] || []).find(r => r.id === id) || null;
}

function findAll(collection, filter = {}) {
  let results = store[collection] || [];
  for (const [key, value] of Object.entries(filter)) {
    results = results.filter(r => r[key] === value);
  }
  return results;
}

function update(collection, id, updates) {
  const idx = (store[collection] || []).findIndex(r => r.id === id);
  if (idx === -1) return null;
  store[collection][idx] = {
    ...store[collection][idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  save();
  return store[collection][idx];
}

function upsert(collection, record) {
  const idx = (store[collection] || []).findIndex(r => r.id === record.id);
  if (idx === -1) {
    return insert(collection, record);
  }
  store[collection][idx] = {
    ...store[collection][idx],
    ...record,
    updated_at: new Date().toISOString(),
  };
  save();
  return store[collection][idx];
}

// ─── Typed Helpers (match the API the services expect) ────────────────

const db = {
  // ── Images ──
  insertImage(record) {
    return insert('images', record);
  },
  getImageById(id) {
    return findById('images', id);
  },
  getAllImages() {
    return findAll('images').sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getImagesByStatus(status) {
    return findAll('images', { status }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  updateImage(id, updates) {
    return update('images', id, updates);
  },

  // ── Catalog Entries ──
  insertCatalogEntry(record) {
    return insert('catalog_entries', record);
  },
  getCatalogEntryById(id) {
    return findById('catalog_entries', id);
  },
  getAllCatalogEntries(status = 'active') {
    return findAll('catalog_entries', { status }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getCatalogEntriesByName(name) {
    return findAll('catalog_entries', { name, status: 'active' }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getCatalogEntryByNameVersion(name, version) {
    return findAll('catalog_entries', { name, version })[0] || null;
  },

  // ── Event Log ──
  insertEvent(record) {
    return insert('event_log', record);
  },
  upsertEvent(record) {
    return upsert('event_log', record);
  },

  // ── Alerts ──
  insertAlert(record) {
    return insert('alerts', record);
  },
  getAlerts(acknowledged = false) {
    return findAll('alerts', { acknowledged: acknowledged ? 1 : 0 }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getUnacknowledgedAlerts() {
    return (store.alerts || []).filter(a => !a.acknowledged).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  acknowledgeAlert(id) {
    return update('alerts', id, { acknowledged: 1 });
  },

  // ── Workspaces ──
  insertWorkspace(record) {
    return insert('workspaces', record);
  },
  getWorkspaceById(id) {
    return findById('workspaces', id);
  },
  getAllWorkspaces() {
    return findAll('workspaces').filter(w => w.status !== 'deleted').sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getWorkspacesByStatus(status) {
    return findAll('workspaces', { status }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  updateWorkspace(id, updates) {
    return update('workspaces', id, updates);
  },
};

// ─── Initialize ───────────────────────────────────────────────────────

function init() {
  load();
  console.log('[Database] Ready');
  return db;
}

function close() {
  save();
  console.log('[Database] Saved and closed');
}

module.exports = { init, close, db };

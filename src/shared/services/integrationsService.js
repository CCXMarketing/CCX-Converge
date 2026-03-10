/**
 * @fileoverview Integrations Service for Converge Module 6.
 * Provides async CRUD operations for API keys, field mappings,
 * activity logging, and system health monitoring via Firestore.
 *
 * All public functions return a standardised response object:
 *   { success: boolean, data: any | null, error: string | null }
 *
 * @module integrationsService
 * @requires firebase/firestore
 * @requires ../../config/firebase
 * @requires ../utils/encryption
 */

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';
import { encrypt, decrypt } from '../utils/encryption.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Firestore document reference paths */
const SETTINGS_COLLECTION = 'settings';
const API_KEYS_DOC = 'apiKeys';
const FIELD_MAPPINGS_DOC = 'fieldMappings';
const INTEGRATION_STATUS_DOC = 'integrationStatus';
const ACTIVITY_LOG_DOC = 'activityLog';
const ACTIVITY_ENTRIES_SUBCOLLECTION = 'entries';

/** Default query limit for activity log retrieval */
const DEFAULT_LOG_LIMIT = 50;

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the currently authenticated user or throws if not signed in.
 * @returns {{ uid: string, email: string | null }} Current user info
 * @throws {Error} If no user is authenticated
 * @private
 */
function _requireAuth() {
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('Authentication required. Please sign in to continue.');
  }
  return { uid: user.uid, email: user.email || null };
}

/**
 * Builds a standardised success response.
 * @param {*} data - Payload to return
 * @returns {{ success: true, data: *, error: null }}
 * @private
 */
function _ok(data = null) {
  return { success: true, data, error: null };
}

/**
 * Builds a standardised error response.
 * @param {string} message - Human-readable error description
 * @returns {{ success: false, data: null, error: string }}
 * @private
 */
function _fail(message) {
  return { success: false, data: null, error: message };
}

// ---------------------------------------------------------------------------
// API Key Operations
// ---------------------------------------------------------------------------

/**
 * Encrypts and saves an API key to the `settings/apiKeys` document.
 *
 * The key is stored inside the `keys` map under the given integration name.
 * Each key object contains the encrypted value, a human-readable label,
 * creation/update timestamps, and the UID of the user who saved it.
 *
 * @async
 * @param {string} keyName   - Integration identifier (e.g. "pointClickCare", "gemini")
 * @param {string} keyValue  - Plaintext API key to encrypt and store
 * @returns {Promise<{ success: boolean, data: object | null, error: string | null }>}
 *
 * @example
 * const result = await saveApiKey('pointClickCare', 'pk_live_abc123');
 * if (result.success) console.log('Key saved:', result.data);
 */
export async function saveApiKey(keyName, keyValue) {
  try {
    // --- Validation ---
    if (!keyName || typeof keyName !== 'string' || keyName.trim().length === 0) {
      return _fail('Key name is required and must be a non-empty string.');
    }
    if (!keyValue || typeof keyValue !== 'string' || keyValue.trim().length === 0) {
      return _fail('Key value is required and must be a non-empty string.');
    }

    const { uid } = _requireAuth();

    // --- Encrypt the plaintext key ---
    const encryptedValue = await encrypt(keyValue);

    // --- Build a readable label from the key name ---
    const label = keyName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim() + ' API Key';

    const now = Timestamp.now();

    // --- Read existing doc to preserve other keys ---
    const docRef = doc(db, SETTINGS_COLLECTION, API_KEYS_DOC);
    const snapshot = await getDoc(docRef);
    const existingKeys = snapshot.exists() ? (snapshot.data().keys || {}) : {};

    // Determine if this is a new key or an update
    const isUpdate = !!existingKeys[keyName];

    const keyEntry = {
      value: encryptedValue,
      label,
      createdAt: isUpdate ? existingKeys[keyName].createdAt : now,
      updatedAt: now,
      createdBy: isUpdate ? existingKeys[keyName].createdBy : uid
    };

    // --- Merge into the keys map ---
    const updatedKeys = { ...existingKeys, [keyName]: keyEntry };

    await setDoc(docRef, {
      keys: updatedKeys,
      updatedAt: serverTimestamp(),
      updatedBy: uid
    }, { merge: true });

    return _ok({
      keyName,
      label,
      isUpdate,
      updatedAt: now.toDate().toISOString()
    });
  } catch (error) {
    console.error('[integrationsService] saveApiKey error:', error);
    return _fail(error.message || 'Failed to save API key.');
  }
}

/**
 * Retrieves and decrypts an API key from the `settings/apiKeys` document.
 *
 * @async
 * @param {string} keyName - Integration identifier (e.g. "pointClickCare")
 * @returns {Promise<{ success: boolean, data: object | null, error: string | null }>}
 *   On success, `data` contains `{ keyName, value, label, createdAt, updatedAt }`.
 *
 * @example
 * const result = await getApiKey('gemini');
 * if (result.success) console.log('Decrypted key:', result.data.value);
 */
export async function getApiKey(keyName) {
  try {
    if (!keyName || typeof keyName !== 'string' || keyName.trim().length === 0) {
      return _fail('Key name is required and must be a non-empty string.');
    }

    _requireAuth();

    const docRef = doc(db, SETTINGS_COLLECTION, API_KEYS_DOC);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return _fail('No API keys have been configured yet.');
    }

    const keys = snapshot.data().keys || {};
    const keyEntry = keys[keyName];

    if (!keyEntry) {
      return _fail(`No API key found for integration "${keyName}".`);
    }

    // --- Decrypt the stored value ---
    const decryptedValue = await decrypt(keyEntry.value);

    return _ok({
      keyName,
      value: decryptedValue,
      label: keyEntry.label || keyName,
      createdAt: keyEntry.createdAt?.toDate?.() ? keyEntry.createdAt.toDate().toISOString() : null,
      updatedAt: keyEntry.updatedAt?.toDate?.() ? keyEntry.updatedAt.toDate().toISOString() : null
    });
  } catch (error) {
    console.error('[integrationsService] getApiKey error:', error);
    return _fail(error.message || 'Failed to retrieve API key.');
  }
}

// ---------------------------------------------------------------------------
// Field Mapping Operations
// ---------------------------------------------------------------------------

/**
 * Saves field mapping configuration for a given integration.
 *
 * Each mapping entry describes how a source system field maps to a
 * Converge field, including data type, whether it is required, and
 * an optional transformation rule.
 *
 * @async
 * @param {string} integration - Integration identifier (e.g. "pointClickCare")
 * @param {Array<{
 *   sourceField: string,
 *   targetField: string,
 *   dataType: string,
 *   required: boolean,
 *   transform?: string | null
 * }>} mappings - Array of field mapping objects
 * @returns {Promise<{ success: boolean, data: object | null, error: string | null }>}
 *
 * @example
 * const result = await saveFieldMapping('pointClickCare', [
 *   { sourceField: 'resident_id', targetField: 'residentId', dataType: 'string', required: true, transform: null },
 *   { sourceField: 'first_name', targetField: 'firstName', dataType: 'string', required: true, transform: 'capitalize' }
 * ]);
 */
export async function saveFieldMapping(integration, mappings) {
  try {
    // --- Validation ---
    if (!integration || typeof integration !== 'string' || integration.trim().length === 0) {
      return _fail('Integration name is required and must be a non-empty string.');
    }
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return _fail('Mappings must be a non-empty array of field mapping objects.');
    }

    // Validate each mapping entry
    for (let i = 0; i < mappings.length; i++) {
      const m = mappings[i];
      if (!m.sourceField || typeof m.sourceField !== 'string') {
        return _fail(`Mapping at index ${i} is missing a valid "sourceField".`);
      }
      if (!m.targetField || typeof m.targetField !== 'string') {
        return _fail(`Mapping at index ${i} is missing a valid "targetField".`);
      }
      if (!m.dataType || typeof m.dataType !== 'string') {
        return _fail(`Mapping at index ${i} is missing a valid "dataType".`);
      }
      if (typeof m.required !== 'boolean') {
        return _fail(`Mapping at index ${i} must have a boolean "required" field.`);
      }
    }

    const { uid } = _requireAuth();

    const docRef = doc(db, SETTINGS_COLLECTION, FIELD_MAPPINGS_DOC);
    const snapshot = await getDoc(docRef);
    const existingIntegrations = snapshot.exists()
      ? (snapshot.data().integrations || {})
      : {};

    // Normalise mappings (ensure transform defaults to null)
    const normalisedMappings = mappings.map((m) => ({
      sourceField: m.sourceField.trim(),
      targetField: m.targetField.trim(),
      dataType: m.dataType.trim(),
      required: m.required,
      transform: m.transform || null
    }));

    const integrationEntry = {
      mappings: normalisedMappings,
      active: true,
      updatedAt: Timestamp.now(),
      updatedBy: uid
    };

    const updatedIntegrations = {
      ...existingIntegrations,
      [integration]: integrationEntry
    };

    await setDoc(docRef, {
      integrations: updatedIntegrations,
      updatedAt: serverTimestamp(),
      updatedBy: uid
    }, { merge: true });

    return _ok({
      integration,
      mappingCount: normalisedMappings.length,
      active: true,
      updatedAt: integrationEntry.updatedAt.toDate().toISOString()
    });
  } catch (error) {
    console.error('[integrationsService] saveFieldMapping error:', error);
    return _fail(error.message || 'Failed to save field mappings.');
  }
}

/**
 * Retrieves field mapping configuration for a given integration.
 *
 * @async
 * @param {string} integration - Integration identifier (e.g. "pointClickCare")
 * @returns {Promise<{ success: boolean, data: object | null, error: string | null }>}
 *   On success, `data` contains `{ integration, mappings, active, updatedAt }`.
 *
 * @example
 * const result = await getFieldMappings('pointClickCare');
 * if (result.success) console.log('Mappings:', result.data.mappings);
 */
export async function getFieldMappings(integration) {
  try {
    if (!integration || typeof integration !== 'string' || integration.trim().length === 0) {
      return _fail('Integration name is required and must be a non-empty string.');
    }

    _requireAuth();

    const docRef = doc(db, SETTINGS_COLLECTION, FIELD_MAPPINGS_DOC);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return _fail('No field mappings have been configured yet.');
    }

    const integrations = snapshot.data().integrations || {};
    const entry = integrations[integration];

    if (!entry) {
      return _fail(`No field mappings found for integration "${integration}".`);
    }

    return _ok({
      integration,
      mappings: entry.mappings || [],
      active: entry.active ?? true,
      updatedAt: entry.updatedAt?.toDate?.() ? entry.updatedAt.toDate().toISOString() : null,
      updatedBy: entry.updatedBy || null
    });
  } catch (error) {
    console.error('[integrationsService] getFieldMappings error:', error);
    return _fail(error.message || 'Failed to retrieve field mappings.');
  }
}

// ---------------------------------------------------------------------------
// Activity Log Operations
// ---------------------------------------------------------------------------

/**
 * Writes an activity log entry to the `settings/activityLog/entries` subcollection.
 *
 * Log entries are immutable once created (enforced by Firestore security rules).
 *
 * @async
 * @param {string} integration - Integration name (e.g. "pointClickCare")
 * @param {string} eventType   - Event type identifier (e.g. "api_key_saved")
 * @param {string} details     - Human-readable event description
 * @param {Object} [options]              - Optional additional fields
 * @param {string} [options.status='success'] - Event outcome ("success" | "error" | "warning")
 * @param {Object} [options.metadata=null]    - Additional context map
 * @returns {Promise<{ success: boolean, data: object | null, error: string | null }>}
 *
 * @example
 * await logActivity('pointClickCare', 'api_key_saved', 'API key saved by admin');
 * await logActivity('gemini', 'sync_failed', 'Sync failed: timeout', { status: 'error' });
 */
export async function logActivity(integration, eventType, details, options = {}) {
  try {
    // --- Validation ---
    if (!integration || typeof integration !== 'string' || integration.trim().length === 0) {
      return _fail('Integration name is required for activity logging.');
    }
    if (!eventType || typeof eventType !== 'string' || eventType.trim().length === 0) {
      return _fail('Event type is required for activity logging.');
    }
    if (!details || typeof details !== 'string' || details.trim().length === 0) {
      return _fail('Details description is required for activity logging.');
    }

    const { uid, email } = _requireAuth();

    const status = options.status || 'success';
    const metadata = options.metadata || null;

    const entryData = {
      integration: integration.trim(),
      eventType: eventType.trim(),
      details: details.trim(),
      status,
      userId: uid,
      userEmail: email,
      timestamp: Timestamp.now(),
      createdAt: serverTimestamp()
    };

    if (metadata && typeof metadata === 'object') {
      entryData.metadata = metadata;
    }

    const entriesRef = collection(
      db,
      SETTINGS_COLLECTION,
      ACTIVITY_LOG_DOC,
      ACTIVITY_ENTRIES_SUBCOLLECTION
    );

    const docRef = await addDoc(entriesRef, entryData);

    return _ok({
      entryId: docRef.id,
      integration: entryData.integration,
      eventType: entryData.eventType,
      status: entryData.status,
      timestamp: entryData.timestamp.toDate().toISOString()
    });
  } catch (error) {
    console.error('[integrationsService] logActivity error:', error);
    return _fail(error.message || 'Failed to write activity log entry.');
  }
}

/**
 * Queries the activity log with optional filters.
 *
 * Results are ordered by `timestamp` descending (newest first) and
 * capped at the specified limit (default 50).
 *
 * @async
 * @param {Object} [filters]                  - Optional filter criteria
 * @param {string} [filters.integration]       - Filter by integration name
 * @param {string} [filters.eventType]         - Filter by event type
 * @param {string} [filters.status]            - Filter by status ("success" | "error" | "warning")
 * @param {number} [filters.limitCount=50]     - Maximum entries to return
 * @returns {Promise<{ success: boolean, data: object | null, error: string | null }>}
 *   On success, `data` contains `{ entries: Array, totalReturned: number }`.
 *
 * @example
 * const result = await getActivityLog({ integration: 'pointClickCare', limitCount: 20 });
 * if (result.success) console.log('Entries:', result.data.entries);
 */
export async function getActivityLog(filters = {}) {
  try {
    _requireAuth();

    const entriesRef = collection(
      db,
      SETTINGS_COLLECTION,
      ACTIVITY_LOG_DOC,
      ACTIVITY_ENTRIES_SUBCOLLECTION
    );

    // --- Build query constraints ---
    const constraints = [];

    if (filters.integration && typeof filters.integration === 'string') {
      constraints.push(where('integration', '==', filters.integration.trim()));
    }
    if (filters.eventType && typeof filters.eventType === 'string') {
      constraints.push(where('eventType', '==', filters.eventType.trim()));
    }
    if (filters.status && typeof filters.status === 'string') {
      constraints.push(where('status', '==', filters.status.trim()));
    }

    constraints.push(orderBy('timestamp', 'desc'));

    const maxEntries = typeof filters.limitCount === 'number' && filters.limitCount > 0
      ? Math.min(filters.limitCount, 200)
      : DEFAULT_LOG_LIMIT;
    constraints.push(limit(maxEntries));

    const q = query(entriesRef, ...constraints);
    const snapshot = await getDocs(q);

    const entries = snapshot.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        integration: d.integration || '',
        eventType: d.eventType || '',
        details: d.details || '',
        status: d.status || 'success',
        userId: d.userId || null,
        userEmail: d.userEmail || null,
        metadata: d.metadata || null,
        timestamp: d.timestamp?.toDate?.() ? d.timestamp.toDate().toISOString() : null,
        createdAt: d.createdAt?.toDate?.() ? d.createdAt.toDate().toISOString() : null
      };
    });

    return _ok({ entries, totalReturned: entries.length });
  } catch (error) {
    console.error('[integrationsService] getActivityLog error:', error);
    return _fail(error.message || 'Failed to retrieve activity log.');
  }
}

// ---------------------------------------------------------------------------
// System Health Operations
// ---------------------------------------------------------------------------

/**
 * Retrieves integration health status from the `settings/integrationStatus` document.
 *
 * Returns the per-integration connection status and the overall system health.
 *
 * @async
 * @returns {Promise<{ success: boolean, data: object | null, error: string | null }>}
 *   On success, `data` contains `{ integrations: Object, globalHealth: string, updatedAt: string }`.
 *
 * @example
 * const result = await getSystemHealth();
 * if (result.success) {
 *   console.log('Global health:', result.data.globalHealth);
 *   console.log('PCC connected:', result.data.integrations.pointClickCare?.connected);
 * }
 */
export async function getSystemHealth() {
  try {
    _requireAuth();

    const docRef = doc(db, SETTINGS_COLLECTION, INTEGRATION_STATUS_DOC);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return _ok({
        integrations: {},
        globalHealth: 'unknown',
        updatedAt: null
      });
    }

    const data = snapshot.data();
    const integrations = data.integrations || {};

    // Serialise Firestore timestamps to ISO strings for each integration
    const serialised = {};
    for (const [name, info] of Object.entries(integrations)) {
      serialised[name] = {
        connected: info.connected ?? false,
        lastSyncAt: info.lastSyncAt?.toDate?.() ? info.lastSyncAt.toDate().toISOString() : null,
        lastSyncStatus: info.lastSyncStatus || null,
        lastError: info.lastError || null,
        lastErrorAt: info.lastErrorAt?.toDate?.() ? info.lastErrorAt.toDate().toISOString() : null,
        endpoint: info.endpoint || null,
        version: info.version || null,
        healthCheckAt: info.healthCheckAt?.toDate?.() ? info.healthCheckAt.toDate().toISOString() : null
      };
    }

    return _ok({
      integrations: serialised,
      globalHealth: data.globalHealth || 'unknown',
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : null
    });
  } catch (error) {
    console.error('[integrationsService] getSystemHealth error:', error);
    return _fail(error.message || 'Failed to retrieve system health status.');
  }
}

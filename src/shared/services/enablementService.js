/**
 * @fileoverview Enablement Service – Module 8 (Enablement)
 *
 * Firestore CRUD operations for partner enablement resources:
 *   - createChecklist     – Create a new enablement checklist
 *   - getChecklists       – Fetch checklists for a partner
 *   - getChecklistById    – Fetch a single checklist by ID
 *   - updateChecklist     – Update an existing checklist
 *   - deleteChecklist     – Soft-delete a checklist
 *   - getTierCriteria     – Fetch tier criteria definitions
 *   - updateTierCriteria  – Update tier criteria for a tier level
 *   - getAssetLinks       – Fetch asset links for a partner or tier
 *   - createAssetLink     – Create a new asset link
 *   - deleteAssetLink     – Remove an asset link
 *
 * Every public function returns { success, data, error }.
 */

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';

// =============================================================================
// Constants
// =============================================================================

const CHECKLISTS_COLLECTION = 'enablement_checklists';
const TIER_CRITERIA_COLLECTION = 'tier_criteria';
const ASSET_LINKS_COLLECTION = 'asset_links';
const PARTNERS_COLLECTION = 'partners';
const DEFAULT_QUERY_LIMIT = 50;

const VALID_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

const VALID_CHECKLIST_STATUSES = ['active', 'completed', 'archived'];

const VALID_ASSET_TYPES = [
  'document',
  'video',
  'link',
  'template',
  'training',
  'other',
];

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Ensure the caller is authenticated.
 * @returns {string} The current user's UID.
 * @throws {Error} If no user is signed in.
 */
function _requireAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  return user.uid;
}

/**
 * Build a success response.
 * @param {*} data – Payload to return.
 * @returns {{ success: true, data: *, error: null }}
 */
function _ok(data) {
  return { success: true, data, error: null };
}

/**
 * Build a failure response.
 * @param {string} message – Human-readable error description.
 * @returns {{ success: false, data: null, error: string }}
 */
function _fail(message) {
  return { success: false, data: null, error: message };
}

/**
 * Safely serialise a Firestore Timestamp to ISO string.
 * @param {import('firebase/firestore').Timestamp|null} field
 * @returns {string|null}
 */
function _ts(field) {
  return field?.toDate?.() ? field.toDate().toISOString() : null;
}

// =============================================================================
// createChecklist
// =============================================================================

/**
 * Create a new enablement checklist for a partner.
 *
 * @param {Object} checklistData
 * @param {string} checklistData.partner_id    – Associated partner ID (required).
 * @param {string} checklistData.title         – Checklist title (required).
 * @param {string} [checklistData.description] – Checklist description.
 * @param {string} [checklistData.tier]        – Associated tier level.
 * @param {Array}  [checklistData.items]       – Array of checklist item objects.
 * @param {string} [checklistData.status='active'] – Checklist status.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createChecklist(checklistData = {}) {
  try {
    const uid = _requireAuth();

    const { partner_id, title } = checklistData;

    // --- validation ---------------------------------------------------------
    if (!partner_id) return _fail('partner_id is required');
    if (!title) return _fail('title is required');

    if (checklistData.tier && !VALID_TIERS.includes(checklistData.tier)) {
      return _fail(`Invalid tier "${checklistData.tier}". Must be one of: ${VALID_TIERS.join(', ')}`);
    }

    if (checklistData.status && !VALID_CHECKLIST_STATUSES.includes(checklistData.status)) {
      return _fail(`Invalid status "${checklistData.status}". Must be one of: ${VALID_CHECKLIST_STATUSES.join(', ')}`);
    }

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partner_id);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partner_id}" not found`);

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    const items = (checklistData.items || []).map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      label: item.label || '',
      completed: item.completed || false,
      completed_at: item.completed_at || null,
      completed_by: item.completed_by || null,
      order: item.order ?? idx,
    }));

    const record = {
      partner_id,
      title,
      description: checklistData.description || '',
      tier: checklistData.tier || null,
      items,
      status: checklistData.status || 'active',
      progress: 0,
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, CHECKLISTS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[enablementService.createChecklist]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getChecklists
// =============================================================================

/**
 * Fetch enablement checklists for a partner.
 *
 * @param {string} partnerId                   – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.status]            – Filter by checklist status.
 * @param {string} [options.tier]              – Filter by tier level.
 * @param {number} [options.limit]             – Max records (default 50, max 500).
 * @param {string} [options.sort_dir='desc']   – Sort direction for created_at.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getChecklists(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const constraints = [where('partner_id', '==', partnerId)];

    // Status filter
    if (options.status) {
      if (!VALID_CHECKLIST_STATUSES.includes(options.status)) {
        return _fail(`Invalid status "${options.status}"`);
      }
      constraints.push(where('status', '==', options.status));
    }

    // Tier filter
    if (options.tier) {
      if (!VALID_TIERS.includes(options.tier)) {
        return _fail(`Invalid tier "${options.tier}"`);
      }
      constraints.push(where('tier', '==', options.tier));
    }

    // Sort direction
    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    // Limit
    let maxResults = options.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, CHECKLISTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const checklists = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(checklists);
  } catch (err) {
    console.error('[enablementService.getChecklists]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getChecklistById
// =============================================================================

/**
 * Fetch a single enablement checklist by its document ID.
 *
 * @param {string} checklistId – Checklist document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function getChecklistById(checklistId) {
  try {
    _requireAuth();

    if (!checklistId) return _fail('checklistId is required');

    const docRef = doc(db, CHECKLISTS_COLLECTION, checklistId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return _fail(`Checklist "${checklistId}" not found`);

    const data = snap.data();
    return _ok({
      id: snap.id,
      ...data,
      created_at: _ts(data.created_at),
      updated_at: _ts(data.updated_at),
    });
  } catch (err) {
    console.error('[enablementService.getChecklistById]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updateChecklist
// =============================================================================

/**
 * Update an existing enablement checklist.
 *
 * Recalculates progress automatically when items are updated.
 *
 * @param {string} checklistId – Checklist document ID (required).
 * @param {Object} updates     – Fields to update.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateChecklist(checklistId, updates = {}) {
  try {
    const uid = _requireAuth();

    if (!checklistId) return _fail('checklistId is required');
    if (!updates || Object.keys(updates).length === 0) return _fail('No updates provided');

    const docRef = doc(db, CHECKLISTS_COLLECTION, checklistId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Checklist "${checklistId}" not found`);

    // Validate status if being updated
    if (updates.status && !VALID_CHECKLIST_STATUSES.includes(updates.status)) {
      return _fail(`Invalid status "${updates.status}"`);
    }

    // Validate tier if being updated
    if (updates.tier && !VALID_TIERS.includes(updates.tier)) {
      return _fail(`Invalid tier "${updates.tier}"`);
    }

    // Strip system fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;
    delete safeUpdates.partner_id; // partner_id is immutable

    // Recalculate progress if items are updated
    if (safeUpdates.items && Array.isArray(safeUpdates.items)) {
      const total = safeUpdates.items.length;
      const completed = safeUpdates.items.filter((i) => i.completed).length;
      safeUpdates.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    safeUpdates.updated_at = serverTimestamp();
    safeUpdates.updated_by = uid;

    await setDoc(docRef, safeUpdates, { merge: true });

    const refreshed = await getDoc(docRef);
    const data = refreshed.data();

    return _ok({
      id: refreshed.id,
      ...data,
      created_at: _ts(data.created_at),
      updated_at: _ts(data.updated_at),
    });
  } catch (err) {
    console.error('[enablementService.updateChecklist]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// deleteChecklist
// =============================================================================

/**
 * Soft-delete an enablement checklist by setting its status to 'archived'.
 *
 * @param {string} checklistId – Checklist document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function deleteChecklist(checklistId) {
  try {
    const uid = _requireAuth();

    if (!checklistId) return _fail('checklistId is required');

    const docRef = doc(db, CHECKLISTS_COLLECTION, checklistId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Checklist "${checklistId}" not found`);

    await setDoc(
      docRef,
      {
        status: 'archived',
        updated_at: serverTimestamp(),
        updated_by: uid,
      },
      { merge: true },
    );

    const refreshed = await getDoc(docRef);
    const data = refreshed.data();

    return _ok({
      id: refreshed.id,
      ...data,
      created_at: _ts(data.created_at),
      updated_at: _ts(data.updated_at),
    });
  } catch (err) {
    console.error('[enablementService.deleteChecklist]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getTierCriteria
// =============================================================================

/**
 * Fetch tier criteria definitions.
 *
 * @param {string} [tier] – Optional tier level to fetch criteria for.
 *                          If omitted, returns all tier criteria.
 * @returns {Promise<{ success: boolean, data: Array|Object|null, error: string|null }>}
 */
export async function getTierCriteria(tier) {
  try {
    _requireAuth();

    if (tier) {
      if (!VALID_TIERS.includes(tier)) {
        return _fail(`Invalid tier "${tier}". Must be one of: ${VALID_TIERS.join(', ')}`);
      }

      const docRef = doc(db, TIER_CRITERIA_COLLECTION, tier);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return _fail(`Tier criteria for "${tier}" not found`);

      const data = snap.data();
      return _ok({
        id: snap.id,
        ...data,
        updated_at: _ts(data.updated_at),
      });
    }

    // Fetch all tier criteria
    const q = query(collection(db, TIER_CRITERIA_COLLECTION));
    const snapshot = await getDocs(q);

    const criteria = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(criteria);
  } catch (err) {
    console.error('[enablementService.getTierCriteria]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updateTierCriteria
// =============================================================================

/**
 * Update tier criteria for a specific tier level.
 *
 * @param {string} tier       – Tier level (required). Must be in VALID_TIERS.
 * @param {Object} criteria   – Criteria fields to update (required).
 * @param {number} [criteria.min_deals]         – Minimum deal count.
 * @param {number} [criteria.min_revenue]       – Minimum revenue threshold.
 * @param {number} [criteria.min_certifications] – Minimum certifications.
 * @param {Array}  [criteria.required_trainings] – Required training IDs.
 * @param {string} [criteria.description]       – Tier description.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateTierCriteria(tier, criteria = {}) {
  try {
    const uid = _requireAuth();

    if (!tier) return _fail('tier is required');
    if (!VALID_TIERS.includes(tier)) {
      return _fail(`Invalid tier "${tier}". Must be one of: ${VALID_TIERS.join(', ')}`);
    }
    if (!criteria || Object.keys(criteria).length === 0) return _fail('No criteria provided');

    const docRef = doc(db, TIER_CRITERIA_COLLECTION, tier);

    const safeUpdates = { ...criteria };
    delete safeUpdates.id;
    safeUpdates.tier = tier;
    safeUpdates.updated_at = serverTimestamp();
    safeUpdates.updated_by = uid;

    await setDoc(docRef, safeUpdates, { merge: true });

    const refreshed = await getDoc(docRef);
    const data = refreshed.data();

    return _ok({
      id: refreshed.id,
      ...data,
      updated_at: _ts(data.updated_at),
    });
  } catch (err) {
    console.error('[enablementService.updateTierCriteria]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getAssetLinks
// =============================================================================

/**
 * Fetch asset links, optionally filtered by partner or tier.
 *
 * @param {Object} [options]
 * @param {string} [options.partner_id]        – Filter by partner ID.
 * @param {string} [options.tier]              – Filter by tier level.
 * @param {string} [options.asset_type]        – Filter by asset type.
 * @param {number} [options.limit]             – Max records (default 50, max 500).
 * @param {string} [options.sort_dir='desc']   – Sort direction for created_at.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getAssetLinks(options = {}) {
  try {
    _requireAuth();

    const constraints = [];

    // Partner filter
    if (options.partner_id) {
      constraints.push(where('partner_id', '==', options.partner_id));
    }

    // Tier filter
    if (options.tier) {
      if (!VALID_TIERS.includes(options.tier)) {
        return _fail(`Invalid tier "${options.tier}"`);
      }
      constraints.push(where('tier', '==', options.tier));
    }

    // Asset type filter
    if (options.asset_type) {
      if (!VALID_ASSET_TYPES.includes(options.asset_type)) {
        return _fail(`Invalid asset_type "${options.asset_type}". Must be one of: ${VALID_ASSET_TYPES.join(', ')}`);
      }
      constraints.push(where('asset_type', '==', options.asset_type));
    }

    // Sort direction
    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    // Limit
    let maxResults = options.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, ASSET_LINKS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const assets = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(assets);
  } catch (err) {
    console.error('[enablementService.getAssetLinks]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// createAssetLink
// =============================================================================

/**
 * Create a new asset link.
 *
 * @param {Object} assetData
 * @param {string} assetData.title          – Asset title (required).
 * @param {string} assetData.url            – Asset URL (required).
 * @param {string} [assetData.asset_type='document'] – Asset type.
 * @param {string} [assetData.partner_id]   – Associated partner ID.
 * @param {string} [assetData.tier]         – Associated tier level.
 * @param {string} [assetData.description]  – Asset description.
 * @param {Array}  [assetData.tags]         – Tags for categorisation.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createAssetLink(assetData = {}) {
  try {
    const uid = _requireAuth();

    const { title, url } = assetData;

    // --- validation ---------------------------------------------------------
    if (!title) return _fail('title is required');
    if (!url) return _fail('url is required');

    if (assetData.asset_type && !VALID_ASSET_TYPES.includes(assetData.asset_type)) {
      return _fail(`Invalid asset_type "${assetData.asset_type}". Must be one of: ${VALID_ASSET_TYPES.join(', ')}`);
    }

    if (assetData.tier && !VALID_TIERS.includes(assetData.tier)) {
      return _fail(`Invalid tier "${assetData.tier}". Must be one of: ${VALID_TIERS.join(', ')}`);
    }

    // Verify partner exists if provided
    if (assetData.partner_id) {
      const partnerRef = doc(db, PARTNERS_COLLECTION, assetData.partner_id);
      const partnerSnap = await getDoc(partnerRef);
      if (!partnerSnap.exists()) return _fail(`Partner "${assetData.partner_id}" not found`);
    }

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    const record = {
      title,
      url,
      asset_type: assetData.asset_type || 'document',
      partner_id: assetData.partner_id || null,
      tier: assetData.tier || null,
      description: assetData.description || '',
      tags: assetData.tags || [],
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, ASSET_LINKS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[enablementService.createAssetLink]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// deleteAssetLink
// =============================================================================

/**
 * Permanently remove an asset link.
 *
 * @param {string} assetLinkId – Asset link document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function deleteAssetLink(assetLinkId) {
  try {
    _requireAuth();

    if (!assetLinkId) return _fail('assetLinkId is required');

    const docRef = doc(db, ASSET_LINKS_COLLECTION, assetLinkId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Asset link "${assetLinkId}" not found`);

    const data = snap.data();
    await deleteDoc(docRef);

    return _ok({
      id: snap.id,
      ...data,
      created_at: _ts(data.created_at),
      updated_at: _ts(data.updated_at),
    });
  } catch (err) {
    console.error('[enablementService.deleteAssetLink]', err);
    return _fail(err.message);
  }
}

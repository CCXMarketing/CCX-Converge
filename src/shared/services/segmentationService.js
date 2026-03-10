/**
 * @fileoverview Segmentation Service – Module 2 (Radar)
 *
 * Firestore CRUD operations for saved segmentation / filter views:
 *   - saveView    – Create or update a saved filter view
 *   - getAllViews – List all saved views for the current user
 *   - deleteView  – Remove a saved view
 *   - applyView   – Load a saved view's filters and execute the query
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

const SEGMENTATION_COLLECTION = 'segmentation_views';
const PARTNERS_COLLECTION = 'partners';
const DEFAULT_QUERY_LIMIT = 50;

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
// saveView
// =============================================================================

/**
 * Create or update a saved segmentation / filter view.
 *
 * If `viewId` is provided, the existing view is updated; otherwise a new
 * document is created.
 *
 * @param {Object} viewData
 * @param {string} viewData.name           – Display name (required).
 * @param {Object} viewData.filters        – Filter criteria object (required).
 * @param {string} [viewData.description]  – Optional description.
 * @param {boolean} [viewData.is_default]  – Whether this is the user's default view.
 * @param {string} [viewId]               – Existing view ID to update.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function saveView(viewData = {}, viewId = null) {
  try {
    const uid = _requireAuth();

    const { name, filters } = viewData;

    // --- validation ---------------------------------------------------------
    if (!name) return _fail('View name is required');
    if (!filters || typeof filters !== 'object' || Object.keys(filters).length === 0) {
      return _fail('filters object is required and must not be empty');
    }

    const now = serverTimestamp();

    // --- update existing ----------------------------------------------------
    if (viewId) {
      const docRef = doc(db, SEGMENTATION_COLLECTION, viewId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return _fail(`View "${viewId}" not found`);

      const safeUpdates = {
        name,
        filters,
        description: viewData.description ?? snap.data().description ?? '',
        is_default: viewData.is_default ?? snap.data().is_default ?? false,
        updated_at: now,
        updated_by: uid,
      };

      await setDoc(docRef, safeUpdates, { merge: true });

      const refreshed = await getDoc(docRef);
      const data = refreshed.data();

      return _ok({
        id: refreshed.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      });
    }

    // --- create new ---------------------------------------------------------
    const record = {
      name,
      filters,
      description: viewData.description || '',
      is_default: viewData.is_default || false,
      created_at: now,
      updated_at: now,
      created_by: uid,
      owner_uid: uid,
    };

    const colRef = collection(db, SEGMENTATION_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[segmentationService.saveView]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getAllViews
// =============================================================================

/**
 * List all saved segmentation views for the current user.
 *
 * @param {Object} [options]
 * @param {boolean} [options.include_shared] – If true, also include views shared with the user.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getAllViews(options = {}) {
  try {
    const uid = _requireAuth();

    const q = query(
      collection(db, SEGMENTATION_COLLECTION),
      where('owner_uid', '==', uid),
      orderBy('updated_at', 'desc'),
    );

    const snapshot = await getDocs(q);

    const views = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(views);
  } catch (err) {
    console.error('[segmentationService.getAllViews]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// deleteView
// =============================================================================

/**
 * Remove a saved segmentation view.
 *
 * @param {string} viewId – View document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function deleteView(viewId) {
  try {
    const uid = _requireAuth();

    if (!viewId) return _fail('viewId is required');

    const docRef = doc(db, SEGMENTATION_COLLECTION, viewId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`View "${viewId}" not found`);

    // Only owner can delete
    const data = snap.data();
    if (data.owner_uid !== uid) {
      return _fail('You can only delete your own views');
    }

    await deleteDoc(docRef);

    return _ok({ id: viewId, deleted: true });
  } catch (err) {
    console.error('[segmentationService.deleteView]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// applyView
// =============================================================================

/**
 * Load a saved view's filters and execute the partner query.
 *
 * Supported filter keys in the saved view's `filters` object:
 *   - status        {string}   – Partner status
 *   - tier          {string}   – Partner tier
 *   - partner_type  {string}   – Type of partner
 *   - region        {string}   – Geographic region
 *   - tags          {string[]} – Array of tag IDs (partners must have ALL listed tags)
 *   - health_min    {number}   – Minimum health score (0-100)
 *   - health_max    {number}   – Maximum health score (0-100)
 *   - sort_by       {string}   – Field to sort by (default 'updated_at')
 *   - sort_dir      {string}   – 'asc' or 'desc' (default 'desc')
 *   - limit         {number}   – Max results (default 50, max 500)
 *
 * @param {string} viewId – View document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 *   data.view {Object} – The saved view metadata.
 *   data.partners {Array} – Partners matching the filters.
 */
export async function applyView(viewId) {
  try {
    _requireAuth();

    if (!viewId) return _fail('viewId is required');

    const viewRef = doc(db, SEGMENTATION_COLLECTION, viewId);
    const viewSnap = await getDoc(viewRef);
    if (!viewSnap.exists()) return _fail(`View "${viewId}" not found`);

    const viewData = viewSnap.data();
    const filters = viewData.filters || {};

    // Build Firestore query from saved filters
    const constraints = [];

    if (filters.status) constraints.push(where('status', '==', filters.status));
    if (filters.tier) constraints.push(where('tier', '==', filters.tier));
    if (filters.partner_type) constraints.push(where('partner_type', '==', filters.partner_type));
    if (filters.region) constraints.push(where('region', '==', filters.region));

    // Tag filtering (array-contains can only be used once per query)
    if (filters.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains', filters.tags[0]));
    }

    // Health score range (requires composite index)
    if (filters.health_min !== undefined) {
      constraints.push(where('health_score', '>=', filters.health_min));
    }
    if (filters.health_max !== undefined) {
      constraints.push(where('health_score', '<=', filters.health_max));
    }

    // Sort
    const sortField = filters.sort_by || 'updated_at';
    const sortDir = filters.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy(sortField, sortDir));

    // Limit
    let maxResults = filters.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, PARTNERS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let partners = snapshot.docs.map((d) => {
      const pData = d.data();
      return {
        id: d.id,
        ...pData,
        created_at: _ts(pData.created_at),
        updated_at: _ts(pData.updated_at),
      };
    });

    // Client-side filtering for additional tags (Firestore only supports one array-contains)
    if (filters.tags && filters.tags.length > 1) {
      const requiredTags = filters.tags.slice(1);
      partners = partners.filter((p) =>
        requiredTags.every((t) => p.tags && p.tags.includes(t)),
      );
    }

    // Update last_used timestamp on the view
    await setDoc(viewRef, { last_used_at: serverTimestamp() }, { merge: true });

    return _ok({
      view: {
        id: viewSnap.id,
        ...viewData,
        created_at: _ts(viewData.created_at),
        updated_at: _ts(viewData.updated_at),
      },
      partners,
      total: partners.length,
    });
  } catch (err) {
    console.error('[segmentationService.applyView]', err);
    return _fail(err.message);
  }
}

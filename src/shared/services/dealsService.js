/**
 * @fileoverview Deals Service – Module 2 (Radar)
 *
 * Firestore CRUD operations for partner deal / opportunity tracking:
 *   - registerDeal    – Create a new deal for a partner
 *   - getPartnerDeals – Fetch deals associated with a partner
 *   - updateDealStage – Move a deal to a new pipeline stage
 *   - checkConflict   – Check for deal-registration conflicts
 *   - updateDeal      – General-purpose deal update
 *
 * Every public function returns { success, data, error }.
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
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';

// =============================================================================
// Constants
// =============================================================================

const DEALS_COLLECTION = 'deals';
const PARTNERS_COLLECTION = 'partners';
const DEFAULT_QUERY_LIMIT = 50;

const VALID_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
];

const ACTIVE_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
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
// registerDeal
// =============================================================================

/**
 * Create a new deal / opportunity for a partner.
 *
 * @param {Object} dealData
 * @param {string} dealData.partner_id       – Associated partner ID (required).
 * @param {string} dealData.deal_name        – Name / title of the deal (required).
 * @param {string} [dealData.stage='prospecting'] – Pipeline stage.
 * @param {number} [dealData.value]          – Monetary value of the deal.
 * @param {string} [dealData.currency='USD'] – Currency code.
 * @param {string} [dealData.expected_close_date] – ISO date string.
 * @param {string} [dealData.contact_name]   – Primary contact name.
 * @param {string} [dealData.contact_email]  – Primary contact email.
 * @param {string} [dealData.description]    – Deal description / notes.
 * @param {string} [dealData.product]        – Product or service being sold.
 * @param {string} [dealData.source]         – Lead source.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function registerDeal(dealData = {}) {
  try {
    const uid = _requireAuth();

    const { partner_id, deal_name } = dealData;

    // --- validation ---------------------------------------------------------
    if (!partner_id) return _fail('partner_id is required');
    if (!deal_name) return _fail('deal_name is required');

    if (dealData.stage && !VALID_STAGES.includes(dealData.stage)) {
      return _fail(`Invalid stage "${dealData.stage}". Must be one of: ${VALID_STAGES.join(', ')}`);
    }

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partner_id);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partner_id}" not found`);

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    const record = {
      partner_id,
      deal_name,
      stage: dealData.stage || 'prospecting',
      value: dealData.value || 0,
      currency: dealData.currency || 'USD',
      expected_close_date: dealData.expected_close_date || null,
      contact_name: dealData.contact_name || '',
      contact_email: dealData.contact_email || '',
      description: dealData.description || '',
      product: dealData.product || '',
      source: dealData.source || '',
      stage_history: [
        {
          stage: dealData.stage || 'prospecting',
          entered_at: new Date().toISOString(),
          entered_by: uid,
        },
      ],
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, DEALS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    // Update partner's updated_at
    await setDoc(partnerRef, { updated_at: now }, { merge: true });

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[dealsService.registerDeal]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getPartnerDeals
// =============================================================================

/**
 * Fetch deals associated with a specific partner.
 *
 * @param {string} partnerId                  – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.stage]            – Filter by pipeline stage.
 * @param {boolean} [options.active_only]     – If true, only return active-stage deals.
 * @param {number} [options.limit]            – Max records (default 50, max 500).
 * @param {string} [options.sort_dir='desc']  – Sort direction for created_at.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getPartnerDeals(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const constraints = [where('partner_id', '==', partnerId)];

    // Stage filter
    if (options.stage) {
      if (!VALID_STAGES.includes(options.stage)) {
        return _fail(`Invalid stage "${options.stage}"`);
      }
      constraints.push(where('stage', '==', options.stage));
    } else if (options.active_only) {
      constraints.push(where('stage', 'in', ACTIVE_STAGES));
    }

    // Sort direction
    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    // Limit
    let maxResults = options.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, DEALS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const deals = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(deals);
  } catch (err) {
    console.error('[dealsService.getPartnerDeals]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updateDealStage
// =============================================================================

/**
 * Move a deal to a new pipeline stage, appending to stage_history.
 *
 * @param {string} dealId   – Deal document ID (required).
 * @param {string} newStage – Target stage (required). Must be in VALID_STAGES.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateDealStage(dealId, newStage) {
  try {
    const uid = _requireAuth();

    if (!dealId) return _fail('dealId is required');
    if (!newStage) return _fail('newStage is required');
    if (!VALID_STAGES.includes(newStage)) {
      return _fail(`Invalid stage "${newStage}". Must be one of: ${VALID_STAGES.join(', ')}`);
    }

    const docRef = doc(db, DEALS_COLLECTION, dealId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Deal "${dealId}" not found`);

    const current = snap.data();

    if (current.stage === newStage) {
      return _fail(`Deal is already in stage "${newStage}"`);
    }

    const stageEntry = {
      stage: newStage,
      entered_at: new Date().toISOString(),
      entered_by: uid,
    };

    const stageHistory = [...(current.stage_history || []), stageEntry];

    await setDoc(
      docRef,
      {
        stage: newStage,
        stage_history: stageHistory,
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
    console.error('[dealsService.updateDealStage]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// checkConflict
// =============================================================================

/**
 * Check whether a deal-registration conflict exists.
 *
 * A conflict is detected when an active deal already exists for the same
 * partner + product combination.
 *
 * @param {string} partnerId – Partner document ID (required).
 * @param {string} product   – Product / service identifier (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 *   data.has_conflict {boolean}, data.conflicting_deals {Array}
 */
export async function checkConflict(partnerId, product) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');
    if (!product) return _fail('product is required');

    const q = query(
      collection(db, DEALS_COLLECTION),
      where('partner_id', '==', partnerId),
      where('product', '==', product),
      where('stage', 'in', ACTIVE_STAGES),
    );

    const snapshot = await getDocs(q);

    const conflictingDeals = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        deal_name: data.deal_name,
        stage: data.stage,
        created_by: data.created_by,
        created_at: _ts(data.created_at),
      };
    });

    return _ok({
      has_conflict: conflictingDeals.length > 0,
      conflicting_deals: conflictingDeals,
    });
  } catch (err) {
    console.error('[dealsService.checkConflict]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updateDeal
// =============================================================================

/**
 * General-purpose update for a deal record.
 *
 * Use `updateDealStage` when moving between pipeline stages so that
 * stage_history is tracked correctly.
 *
 * @param {string} dealId   – Deal document ID (required).
 * @param {Object} updates  – Fields to update.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateDeal(dealId, updates = {}) {
  try {
    const uid = _requireAuth();

    if (!dealId) return _fail('dealId is required');
    if (!updates || Object.keys(updates).length === 0) return _fail('No updates provided');

    const docRef = doc(db, DEALS_COLLECTION, dealId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Deal "${dealId}" not found`);

    // Validate stage if being updated (prefer updateDealStage for this)
    if (updates.stage && !VALID_STAGES.includes(updates.stage)) {
      return _fail(`Invalid stage "${updates.stage}"`);
    }

    // Strip system fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;
    delete safeUpdates.partner_id; // partner_id is immutable
    delete safeUpdates.stage_history; // managed by updateDealStage

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
    console.error('[dealsService.updateDeal]', err);
    return _fail(err.message);
  }
}

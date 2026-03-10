/**
 * @fileoverview Partners Service – Module 2 (Radar)
 *
 * Firestore CRUD operations for partner management including:
 *   - createPartner        – Add a new channel partner record
 *   - getPartner           – Fetch a single partner by ID
 *   - getAllPartners        – Query partners with optional filters
 *   - updatePartner        – Partial update of partner fields
 *   - archivePartner       – Move partner to partners_archived collection
 *   - restorePartner       – Restore archived partner back to partners
 *   - calculateHealthScore – Weighted health score algorithm
 *   - calculateDataCompleteness – Percentage-based field completeness
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
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const PARTNERS_COLLECTION = 'partners';
const PARTNERS_ARCHIVED_COLLECTION = 'partners_archived';
const INTERACTIONS_COLLECTION = 'interactions';
const DEALS_COLLECTION = 'deals';
const DEFAULT_QUERY_LIMIT = 100;

/** Default weights for health-score calculation */
const DEFAULT_HEALTH_WEIGHTS = {
  interaction_recency: 0.3,
  interaction_frequency: 0.25,
  deal_activity: 0.25,
  data_completeness: 0.2,
};

/** Fields checked by calculateDataCompleteness */
const COMPLETENESS_FIELDS = [
  'company_name',
  'contact_name',
  'contact_email',
  'contact_phone',
  'partner_type',
  'tier',
  'status',
  'region',
  'address',
  'website',
  'notes',
];

// ---------------------------------------------------------------------------
//  Internal helpers
// ---------------------------------------------------------------------------

function _requireAuth() {
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('Authentication required. Please sign in to continue.');
  }
  return { uid: user.uid, email: user.email || null };
}

function _ok(data = null) {
  return { success: true, data, error: null };
}

function _fail(message) {
  return { success: false, data: null, error: message };
}

/**
 * Serialise a Firestore Timestamp (or null) to an ISO string.
 * @param {import('firebase/firestore').Timestamp|null} field
 * @returns {string|null}
 */
function _ts(field) {
  return field?.toDate?.() ? field.toDate().toISOString() : null;
}

// ---------------------------------------------------------------------------
//  createPartner
// ---------------------------------------------------------------------------

/**
 * Create a new channel partner record.
 *
 * @async
 * @param {Object} partnerData
 * @param {string} partnerData.company_name – Required company name.
 * @param {string} [partnerData.contact_name]
 * @param {string} [partnerData.contact_email]
 * @param {string} [partnerData.contact_phone]
 * @param {string} [partnerData.partner_type] – e.g. "reseller", "referral", "technology"
 * @param {string} [partnerData.tier] – e.g. "gold", "silver", "bronze"
 * @param {string} [partnerData.status] – e.g. "active", "inactive", "prospect"
 * @param {string} [partnerData.region]
 * @param {string} [partnerData.address]
 * @param {string} [partnerData.website]
 * @param {string} [partnerData.notes]
 * @param {string[]} [partnerData.tags] – Array of tag IDs.
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 *
 * @example
 *   const result = await createPartner({ company_name: 'Acme Corp', tier: 'gold' });
 */
export async function createPartner(partnerData = {}) {
  try {
    const { company_name } = partnerData;

    if (!company_name || typeof company_name !== 'string' || company_name.trim().length === 0) {
      return _fail('Company name is required.');
    }

    const { uid, email } = _requireAuth();

    const dataCompleteness = _computeCompleteness(partnerData);

    const record = {
      company_name: company_name.trim(),
      contact_name: partnerData.contact_name?.trim() || '',
      contact_email: partnerData.contact_email?.trim() || '',
      contact_phone: partnerData.contact_phone?.trim() || '',
      partner_type: partnerData.partner_type?.trim() || '',
      tier: partnerData.tier?.trim() || '',
      status: partnerData.status?.trim() || 'prospect',
      region: partnerData.region?.trim() || '',
      address: partnerData.address?.trim() || '',
      website: partnerData.website?.trim() || '',
      notes: partnerData.notes?.trim() || '',
      tags: Array.isArray(partnerData.tags) ? partnerData.tags : [],
      health_score: 0,
      health_score_weights: { ...DEFAULT_HEALTH_WEIGHTS },
      data_completeness: dataCompleteness,
      created_by: uid,
      created_by_email: email,
      updated_by: uid,
      updated_by_email: email,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const colRef = collection(db, PARTNERS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({ id: docRef.id, ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  } catch (error) {
    console.error('[partnersService] createPartner error:', error);
    return _fail(error.message || 'Failed to create partner.');
  }
}

// ---------------------------------------------------------------------------
//  getPartner
// ---------------------------------------------------------------------------

/**
 * Fetch a single partner by its document ID.
 *
 * @async
 * @param {string} partnerId – Firestore document ID.
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 *
 * @example
 *   const result = await getPartner('abc123');
 */
export async function getPartner(partnerId) {
  try {
    if (!partnerId || typeof partnerId !== 'string' || partnerId.trim().length === 0) {
      return _fail('Partner ID is required.');
    }

    _requireAuth();

    const docRef = doc(db, PARTNERS_COLLECTION, partnerId.trim());
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return _fail('Partner not found.');
    }

    const data = snap.data();

    return _ok({
      id: snap.id,
      ...data,
      created_at: _ts(data.created_at),
      updated_at: _ts(data.updated_at),
    });
  } catch (error) {
    console.error('[partnersService] getPartner error:', error);
    return _fail(error.message || 'Failed to fetch partner.');
  }
}

// ---------------------------------------------------------------------------
//  getAllPartners
// ---------------------------------------------------------------------------

/**
 * Query partners with optional filters.
 *
 * @async
 * @param {Object} [filters={}]
 * @param {string} [filters.status]       – Filter by status.
 * @param {string} [filters.tier]         – Filter by tier.
 * @param {string} [filters.partner_type] – Filter by partner_type.
 * @param {string} [filters.region]       – Filter by region.
 * @param {string} [filters.sort_by]      – Field to sort by (default "company_name").
 * @param {string} [filters.sort_dir]     – "asc" or "desc" (default "asc").
 * @param {number} [filters.max]          – Max results (default 100).
 * @returns {Promise<{success: boolean, data: Object[]|null, error: string|null}>}
 *
 * @example
 *   const result = await getAllPartners({ status: 'active', tier: 'gold' });
 */
export async function getAllPartners(filters = {}) {
  try {
    _requireAuth();

    const colRef = collection(db, PARTNERS_COLLECTION);
    const constraints = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.tier) {
      constraints.push(where('tier', '==', filters.tier));
    }
    if (filters.partner_type) {
      constraints.push(where('partner_type', '==', filters.partner_type));
    }
    if (filters.region) {
      constraints.push(where('region', '==', filters.region));
    }

    const sortField = filters.sort_by || 'company_name';
    const sortDir = filters.sort_dir === 'desc' ? 'desc' : 'asc';
    constraints.push(orderBy(sortField, sortDir));

    const maxResults = Math.min(Number(filters.max) || DEFAULT_QUERY_LIMIT, 500);
    constraints.push(limit(maxResults));

    const q = query(colRef, ...constraints);
    const snap = await getDocs(q);

    const partners = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(partners);
  } catch (error) {
    console.error('[partnersService] getAllPartners error:', error);
    return _fail(error.message || 'Failed to fetch partners.');
  }
}

// ---------------------------------------------------------------------------
//  updatePartner
// ---------------------------------------------------------------------------

/**
 * Partial update of a partner document.
 *
 * @async
 * @param {string} partnerId – Document ID.
 * @param {Object} updates   – Fields to merge.
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 *
 * @example
 *   const result = await updatePartner('abc123', { tier: 'gold', status: 'active' });
 */
export async function updatePartner(partnerId, updates = {}) {
  try {
    if (!partnerId || typeof partnerId !== 'string' || partnerId.trim().length === 0) {
      return _fail('Partner ID is required.');
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return _fail('At least one field to update is required.');
    }

    const { uid, email } = _requireAuth();

    const docRef = doc(db, PARTNERS_COLLECTION, partnerId.trim());
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return _fail('Partner not found.');
    }

    // Prevent overwriting system fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;
    delete safeUpdates.created_by_email;

    // Recalculate data completeness with merged data
    const merged = { ...snap.data(), ...safeUpdates };
    const dataCompleteness = _computeCompleteness(merged);

    const payload = {
      ...safeUpdates,
      data_completeness: dataCompleteness,
      updated_by: uid,
      updated_by_email: email,
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, payload, { merge: true });

    return _ok({ id: partnerId, ...payload, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error('[partnersService] updatePartner error:', error);
    return _fail(error.message || 'Failed to update partner.');
  }
}

// ---------------------------------------------------------------------------
//  archivePartner
// ---------------------------------------------------------------------------

/**
 * Move a partner to the partners_archived collection.
 *
 * @async
 * @param {string} partnerId – Document ID of the partner to archive.
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 *
 * @example
 *   const result = await archivePartner('abc123');
 */
export async function archivePartner(partnerId) {
  try {
    if (!partnerId || typeof partnerId !== 'string' || partnerId.trim().length === 0) {
      return _fail('Partner ID is required.');
    }

    const { uid, email } = _requireAuth();

    const sourceRef = doc(db, PARTNERS_COLLECTION, partnerId.trim());
    const snap = await getDoc(sourceRef);

    if (!snap.exists()) {
      return _fail('Partner not found.');
    }

    const partnerData = snap.data();

    // Write to archive collection
    const archiveRecord = {
      ...partnerData,
      original_id: partnerId.trim(),
      archived_at: serverTimestamp(),
      archived_by: uid,
      archived_by_email: email,
    };

    const archiveColRef = collection(db, PARTNERS_ARCHIVED_COLLECTION);
    const archiveDocRef = await addDoc(archiveColRef, archiveRecord);

    // Remove from active collection
    await deleteDoc(sourceRef);

    return _ok({
      archived_id: archiveDocRef.id,
      original_id: partnerId.trim(),
      company_name: partnerData.company_name || '',
    });
  } catch (error) {
    console.error('[partnersService] archivePartner error:', error);
    return _fail(error.message || 'Failed to archive partner.');
  }
}

// ---------------------------------------------------------------------------
//  restorePartner
// ---------------------------------------------------------------------------

/**
 * Restore an archived partner back to the partners collection.
 *
 * @async
 * @param {string} archivedId – Document ID in partners_archived.
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 *
 * @example
 *   const result = await restorePartner('archXyz');
 */
export async function restorePartner(archivedId) {
  try {
    if (!archivedId || typeof archivedId !== 'string' || archivedId.trim().length === 0) {
      return _fail('Archived partner ID is required.');
    }

    const { uid, email } = _requireAuth();

    const archiveRef = doc(db, PARTNERS_ARCHIVED_COLLECTION, archivedId.trim());
    const snap = await getDoc(archiveRef);

    if (!snap.exists()) {
      return _fail('Archived partner not found.');
    }

    const archivedData = snap.data();

    // Strip archive-specific fields
    const { archived_at, archived_by, archived_by_email, original_id, ...partnerData } = archivedData;

    const restoredRecord = {
      ...partnerData,
      status: partnerData.status || 'active',
      updated_by: uid,
      updated_by_email: email,
      updated_at: serverTimestamp(),
    };

    // If original_id is available, restore to the same doc ID
    if (original_id) {
      const destRef = doc(db, PARTNERS_COLLECTION, original_id);
      await setDoc(destRef, restoredRecord);
    } else {
      await addDoc(collection(db, PARTNERS_COLLECTION), restoredRecord);
    }

    // Remove from archive
    await deleteDoc(archiveRef);

    return _ok({
      restored_id: original_id || null,
      company_name: partnerData.company_name || '',
    });
  } catch (error) {
    console.error('[partnersService] restorePartner error:', error);
    return _fail(error.message || 'Failed to restore partner.');
  }
}

// ---------------------------------------------------------------------------
//  calculateHealthScore
// ---------------------------------------------------------------------------

/**
 * Calculate a weighted health score (0-100) for a partner.
 *
 * Factors & default weights:
 *   interaction_recency  : 0.30
 *   interaction_frequency: 0.25
 *   deal_activity        : 0.25
 *   data_completeness    : 0.20
 *
 * The result is persisted on the partner document.
 *
 * @async
 * @param {string} partnerId – Document ID.
 * @param {Object} [weights] – Optional custom weights (must sum to 1.0).
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 *
 * @example
 *   const result = await calculateHealthScore('abc123');
 */
export async function calculateHealthScore(partnerId, weights = null) {
  try {
    if (!partnerId || typeof partnerId !== 'string' || partnerId.trim().length === 0) {
      return _fail('Partner ID is required.');
    }

    const { uid, email } = _requireAuth();

    const w = weights && typeof weights === 'object' ? { ...DEFAULT_HEALTH_WEIGHTS, ...weights } : DEFAULT_HEALTH_WEIGHTS;

    // --- Fetch partner ---
    const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId.trim());
    const partnerSnap = await getDoc(partnerRef);

    if (!partnerSnap.exists()) {
      return _fail('Partner not found.');
    }

    const partnerData = partnerSnap.data();

    // --- 1. Interaction recency score (0-100) ---
    const interactionsQ = query(
      collection(db, INTERACTIONS_COLLECTION),
      where('partner_id', '==', partnerId.trim()),
      orderBy('occurred_at', 'desc'),
      limit(1)
    );
    const interSnap = await getDocs(interactionsQ);

    let recencyScore = 0;
    if (!interSnap.empty) {
      const lastInteraction = interSnap.docs[0].data();
      const occurredAt = lastInteraction.occurred_at?.toDate?.() || null;
      if (occurredAt) {
        const daysSince = (Date.now() - occurredAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince <= 7) recencyScore = 100;
        else if (daysSince <= 14) recencyScore = 80;
        else if (daysSince <= 30) recencyScore = 60;
        else if (daysSince <= 60) recencyScore = 40;
        else if (daysSince <= 90) recencyScore = 20;
        else recencyScore = 5;
      }
    }

    // --- 2. Interaction frequency score (0-100) ---
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const freqQ = query(
      collection(db, INTERACTIONS_COLLECTION),
      where('partner_id', '==', partnerId.trim()),
      where('occurred_at', '>=', thirtyDaysAgo)
    );
    const freqSnap = await getDocs(freqQ);
    const interactionCount = freqSnap.size;

    let frequencyScore = 0;
    if (interactionCount >= 10) frequencyScore = 100;
    else if (interactionCount >= 7) frequencyScore = 80;
    else if (interactionCount >= 4) frequencyScore = 60;
    else if (interactionCount >= 2) frequencyScore = 40;
    else if (interactionCount >= 1) frequencyScore = 20;

    // --- 3. Deal activity score (0-100) ---
    const dealsQ = query(
      collection(db, DEALS_COLLECTION),
      where('partner_id', '==', partnerId.trim()),
      where('stage', 'in', ['discovery', 'proposal', 'negotiation', 'closed_won'])
    );
    const dealsSnap = await getDocs(dealsQ);
    const activeDeals = dealsSnap.size;

    let dealScore = 0;
    if (activeDeals >= 3) dealScore = 100;
    else if (activeDeals === 2) dealScore = 75;
    else if (activeDeals === 1) dealScore = 50;

    // --- 4. Data completeness score (already 0-100) ---
    const completenessScore = _computeCompleteness(partnerData);

    // --- Weighted total ---
    const healthScore = Math.round(
      recencyScore * w.interaction_recency +
      frequencyScore * w.interaction_frequency +
      dealScore * w.deal_activity +
      completenessScore * w.data_completeness
    );

    // Persist
    await setDoc(partnerRef, {
      health_score: healthScore,
      health_score_weights: w,
      data_completeness: completenessScore,
      updated_by: uid,
      updated_by_email: email,
      updated_at: serverTimestamp(),
    }, { merge: true });

    return _ok({
      id: partnerId,
      health_score: healthScore,
      breakdown: {
        interaction_recency: recencyScore,
        interaction_frequency: frequencyScore,
        deal_activity: dealScore,
        data_completeness: completenessScore,
      },
      weights: w,
    });
  } catch (error) {
    console.error('[partnersService] calculateHealthScore error:', error);
    return _fail(error.message || 'Failed to calculate health score.');
  }
}

// ---------------------------------------------------------------------------
//  calculateDataCompleteness
// ---------------------------------------------------------------------------

/**
 * Calculate data-completeness percentage for a partner.
 *
 * @async
 * @param {string} partnerId – Document ID.
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 *
 * @example
 *   const result = await calculateDataCompleteness('abc123');
 */
export async function calculateDataCompleteness(partnerId) {
  try {
    if (!partnerId || typeof partnerId !== 'string' || partnerId.trim().length === 0) {
      return _fail('Partner ID is required.');
    }

    const { uid, email } = _requireAuth();

    const docRef = doc(db, PARTNERS_COLLECTION, partnerId.trim());
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return _fail('Partner not found.');
    }

    const data = snap.data();
    const completeness = _computeCompleteness(data);

    // Persist updated completeness
    await setDoc(docRef, {
      data_completeness: completeness,
      updated_by: uid,
      updated_by_email: email,
      updated_at: serverTimestamp(),
    }, { merge: true });

    const missing = COMPLETENESS_FIELDS.filter((f) => {
      const val = data[f];
      return !val || (typeof val === 'string' && val.trim().length === 0);
    });

    return _ok({
      id: partnerId,
      data_completeness: completeness,
      total_fields: COMPLETENESS_FIELDS.length,
      filled_fields: COMPLETENESS_FIELDS.length - missing.length,
      missing_fields: missing,
    });
  } catch (error) {
    console.error('[partnersService] calculateDataCompleteness error:', error);
    return _fail(error.message || 'Failed to calculate data completeness.');
  }
}

// ---------------------------------------------------------------------------
//  Private: compute completeness
// ---------------------------------------------------------------------------

/**
 * Pure function – compute completeness percentage from a data object.
 * @param {Object} data
 * @returns {number} 0-100
 */
function _computeCompleteness(data = {}) {
  if (!data || typeof data !== 'object') return 0;
  const filled = COMPLETENESS_FIELDS.filter((f) => {
    const val = data[f];
    return val && (typeof val !== 'string' || val.trim().length > 0);
  });
  return Math.round((filled.length / COMPLETENESS_FIELDS.length) * 100);
}

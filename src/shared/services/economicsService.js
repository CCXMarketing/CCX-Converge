/**
 * @fileoverview Economics Service – Module 9 (Economics)
 *
 * Firestore CRUD operations for partner economics tracking:
 *   - createCommission      – Record a new commission entry
 *   - getCommissions        – Fetch commissions for a partner
 *   - updateCommission      – Update a commission record
 *   - createMDF             – Record a Market Development Fund allocation
 *   - getMDFs               – Fetch MDF records for a partner
 *   - updateMDF             – Update an MDF record
 *   - createPayout          – Record a payout
 *   - getPayouts            – Fetch payouts for a partner
 *   - updatePayout          – Update a payout record
 *   - createRevenueAttribution – Record revenue attribution
 *   - getRevenueAttributions   – Fetch revenue attributions for a partner
 *   - getForecast           – Generate a revenue / commission forecast
 *   - convertCurrency       – Convert between CAD and USD
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

const COMMISSIONS_COLLECTION = 'commissions';
const MDF_COLLECTION = 'mdf';
const PAYOUTS_COLLECTION = 'payouts';
const REVENUE_ATTRIBUTIONS_COLLECTION = 'revenue_attributions';
const PARTNERS_COLLECTION = 'partners';
const DEALS_COLLECTION = 'deals';
const DEFAULT_QUERY_LIMIT = 50;

const VALID_COMMISSION_STATUSES = [
  'pending',
  'approved',
  'paid',
  'rejected',
  'cancelled',
];

const VALID_MDF_STATUSES = [
  'requested',
  'approved',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
];

const VALID_PAYOUT_STATUSES = [
  'scheduled',
  'processing',
  'completed',
  'failed',
  'cancelled',
];

const VALID_CURRENCIES = ['USD', 'CAD'];

/**
 * Default CAD/USD exchange rates used when live rates are unavailable.
 * Keys are "{from}_{to}" pairs; values are multipliers.
 */
const DEFAULT_EXCHANGE_RATES = {
  CAD_USD: 0.74,
  USD_CAD: 1.35,
};

const COMMISSION_TYPES = [
  'referral',
  'resale',
  'influence',
  'renewal',
  'upsell',
];

const MDF_TYPES = [
  'marketing',
  'event',
  'training',
  'co_sell',
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

/**
 * Convert an amount between CAD and USD.
 *
 * @param {number} amount       – Source amount.
 * @param {string} fromCurrency – 'CAD' or 'USD'.
 * @param {string} toCurrency   – 'CAD' or 'USD'.
 * @param {number} [rate]       – Optional override rate.
 * @returns {{ converted: number, rate: number, from: string, to: string }}
 */
function _convert(amount, fromCurrency, toCurrency, rate) {
  if (fromCurrency === toCurrency) {
    return { converted: amount, rate: 1, from: fromCurrency, to: toCurrency };
  }
  const key = `${fromCurrency}_${toCurrency}`;
  const effectiveRate = rate || DEFAULT_EXCHANGE_RATES[key] || 1;
  return {
    converted: Math.round(amount * effectiveRate * 100) / 100,
    rate: effectiveRate,
    from: fromCurrency,
    to: toCurrency,
  };
}

// =============================================================================
// convertCurrency (public)
// =============================================================================

/**
 * Convert an amount between CAD and USD.
 *
 * @param {number} amount       – Source amount (required).
 * @param {string} fromCurrency – 'CAD' or 'USD' (required).
 * @param {string} toCurrency   – 'CAD' or 'USD' (required).
 * @param {number} [rate]       – Optional custom exchange rate override.
 * @returns {{ success: boolean, data: Object|null, error: string|null }}
 */
export function convertCurrency(amount, fromCurrency, toCurrency, rate) {
  try {
    if (amount == null || typeof amount !== 'number') return _fail('amount must be a number');
    if (!VALID_CURRENCIES.includes(fromCurrency)) {
      return _fail(`Invalid fromCurrency "${fromCurrency}". Must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }
    if (!VALID_CURRENCIES.includes(toCurrency)) {
      return _fail(`Invalid toCurrency "${toCurrency}". Must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }

    const result = _convert(amount, fromCurrency, toCurrency, rate);
    return _ok(result);
  } catch (err) {
    console.error('[economicsService.convertCurrency]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// createCommission
// =============================================================================

/**
 * Record a new commission entry for a partner.
 *
 * @param {Object} data
 * @param {string} data.partner_id          – Associated partner ID (required).
 * @param {string} [data.deal_id]           – Related deal ID.
 * @param {string} data.commission_type     – Type of commission (required).
 * @param {number} data.amount              – Commission amount (required).
 * @param {string} [data.currency='USD']    – Currency code.
 * @param {number} [data.rate_percent]      – Commission rate as a percentage.
 * @param {number} [data.base_amount]       – Base deal amount the commission is calculated on.
 * @param {string} [data.description]       – Notes / description.
 * @param {string} [data.period_start]      – ISO date for commission period start.
 * @param {string} [data.period_end]        – ISO date for commission period end.
 * @param {string} [data.status='pending']  – Commission status.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createCommission(data = {}) {
  try {
    const uid = _requireAuth();

    const { partner_id, commission_type, amount } = data;

    // --- validation ---------------------------------------------------------
    if (!partner_id) return _fail('partner_id is required');
    if (!commission_type) return _fail('commission_type is required');
    if (amount == null || typeof amount !== 'number') return _fail('amount is required and must be a number');

    if (!COMMISSION_TYPES.includes(commission_type)) {
      return _fail(`Invalid commission_type "${commission_type}". Must be one of: ${COMMISSION_TYPES.join(', ')}`);
    }

    if (data.status && !VALID_COMMISSION_STATUSES.includes(data.status)) {
      return _fail(`Invalid status "${data.status}". Must be one of: ${VALID_COMMISSION_STATUSES.join(', ')}`);
    }

    const currency = data.currency || 'USD';
    if (!VALID_CURRENCIES.includes(currency)) {
      return _fail(`Invalid currency "${currency}". Must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partner_id);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partner_id}" not found`);

    // Verify deal exists if provided
    if (data.deal_id) {
      const dealRef = doc(db, DEALS_COLLECTION, data.deal_id);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) return _fail(`Deal "${data.deal_id}" not found`);
    }

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    // Auto-convert to secondary currency
    const secondaryCurrency = currency === 'USD' ? 'CAD' : 'USD';
    const converted = _convert(amount, currency, secondaryCurrency);

    const record = {
      partner_id,
      deal_id: data.deal_id || null,
      commission_type,
      amount,
      currency,
      amount_converted: converted.converted,
      currency_converted: secondaryCurrency,
      exchange_rate: converted.rate,
      rate_percent: data.rate_percent || null,
      base_amount: data.base_amount || null,
      description: data.description || '',
      period_start: data.period_start || null,
      period_end: data.period_end || null,
      status: data.status || 'pending',
      status_history: [
        {
          status: data.status || 'pending',
          changed_at: new Date().toISOString(),
          changed_by: uid,
        },
      ],
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, COMMISSIONS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[economicsService.createCommission]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getCommissions
// =============================================================================

/**
 * Fetch commission records for a partner.
 *
 * @param {string} partnerId                  – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.status]           – Filter by commission status.
 * @param {string} [options.commission_type]  – Filter by commission type.
 * @param {number} [options.limit]            – Max records (default 50, max 500).
 * @param {string} [options.sort_dir='desc']  – Sort direction for created_at.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getCommissions(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const constraints = [where('partner_id', '==', partnerId)];

    if (options.status) {
      if (!VALID_COMMISSION_STATUSES.includes(options.status)) {
        return _fail(`Invalid status "${options.status}"`);
      }
      constraints.push(where('status', '==', options.status));
    }

    if (options.commission_type) {
      if (!COMMISSION_TYPES.includes(options.commission_type)) {
        return _fail(`Invalid commission_type "${options.commission_type}"`);
      }
      constraints.push(where('commission_type', '==', options.commission_type));
    }

    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    let maxResults = options.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, COMMISSIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const commissions = snapshot.docs.map((d) => {
      const rec = d.data();
      return {
        id: d.id,
        ...rec,
        created_at: _ts(rec.created_at),
        updated_at: _ts(rec.updated_at),
      };
    });

    return _ok(commissions);
  } catch (err) {
    console.error('[economicsService.getCommissions]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updateCommission
// =============================================================================

/**
 * Update a commission record.
 *
 * @param {string} commissionId – Commission document ID (required).
 * @param {Object} updates      – Fields to update.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateCommission(commissionId, updates = {}) {
  try {
    const uid = _requireAuth();

    if (!commissionId) return _fail('commissionId is required');
    if (!updates || Object.keys(updates).length === 0) return _fail('No updates provided');

    const docRef = doc(db, COMMISSIONS_COLLECTION, commissionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Commission "${commissionId}" not found`);

    const current = snap.data();

    // Validate status if being updated
    if (updates.status && !VALID_COMMISSION_STATUSES.includes(updates.status)) {
      return _fail(`Invalid status "${updates.status}"`);
    }

    if (updates.commission_type && !COMMISSION_TYPES.includes(updates.commission_type)) {
      return _fail(`Invalid commission_type "${updates.commission_type}"`);
    }

    if (updates.currency && !VALID_CURRENCIES.includes(updates.currency)) {
      return _fail(`Invalid currency "${updates.currency}"`);
    }

    // Strip system fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;
    delete safeUpdates.partner_id;
    delete safeUpdates.status_history;

    // Track status changes
    if (safeUpdates.status && safeUpdates.status !== current.status) {
      const statusEntry = {
        status: safeUpdates.status,
        changed_at: new Date().toISOString(),
        changed_by: uid,
      };
      safeUpdates.status_history = [...(current.status_history || []), statusEntry];
    }

    // Recalculate converted amount if amount or currency changed
    if (safeUpdates.amount != null || safeUpdates.currency) {
      const newAmount = safeUpdates.amount ?? current.amount;
      const newCurrency = safeUpdates.currency ?? current.currency;
      const secondaryCurrency = newCurrency === 'USD' ? 'CAD' : 'USD';
      const converted = _convert(newAmount, newCurrency, secondaryCurrency);
      safeUpdates.amount_converted = converted.converted;
      safeUpdates.currency_converted = secondaryCurrency;
      safeUpdates.exchange_rate = converted.rate;
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
    console.error('[economicsService.updateCommission]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// createMDF
// =============================================================================

/**
 * Record a Market Development Fund allocation for a partner.
 *
 * @param {Object} data
 * @param {string} data.partner_id          – Associated partner ID (required).
 * @param {string} data.mdf_type           – Type of MDF (required).
 * @param {number} data.amount_requested   – Requested amount (required).
 * @param {string} [data.currency='USD']   – Currency code.
 * @param {string} [data.title]            – MDF title / name.
 * @param {string} [data.description]      – Description of MDF use.
 * @param {string} [data.start_date]       – ISO date for activity start.
 * @param {string} [data.end_date]         – ISO date for activity end.
 * @param {number} [data.amount_approved]  – Approved amount (set later).
 * @param {string} [data.status='requested'] – MDF status.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createMDF(data = {}) {
  try {
    const uid = _requireAuth();

    const { partner_id, mdf_type, amount_requested } = data;

    // --- validation ---------------------------------------------------------
    if (!partner_id) return _fail('partner_id is required');
    if (!mdf_type) return _fail('mdf_type is required');
    if (amount_requested == null || typeof amount_requested !== 'number') {
      return _fail('amount_requested is required and must be a number');
    }

    if (!MDF_TYPES.includes(mdf_type)) {
      return _fail(`Invalid mdf_type "${mdf_type}". Must be one of: ${MDF_TYPES.join(', ')}`);
    }

    if (data.status && !VALID_MDF_STATUSES.includes(data.status)) {
      return _fail(`Invalid status "${data.status}". Must be one of: ${VALID_MDF_STATUSES.join(', ')}`);
    }

    const currency = data.currency || 'USD';
    if (!VALID_CURRENCIES.includes(currency)) {
      return _fail(`Invalid currency "${currency}". Must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partner_id);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partner_id}" not found`);

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    const secondaryCurrency = currency === 'USD' ? 'CAD' : 'USD';
    const converted = _convert(amount_requested, currency, secondaryCurrency);

    const record = {
      partner_id,
      mdf_type,
      title: data.title || '',
      description: data.description || '',
      amount_requested,
      amount_approved: data.amount_approved || null,
      amount_spent: 0,
      currency,
      amount_requested_converted: converted.converted,
      currency_converted: secondaryCurrency,
      exchange_rate: converted.rate,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      status: data.status || 'requested',
      status_history: [
        {
          status: data.status || 'requested',
          changed_at: new Date().toISOString(),
          changed_by: uid,
        },
      ],
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, MDF_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[economicsService.createMDF]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getMDFs
// =============================================================================

/**
 * Fetch MDF records for a partner.
 *
 * @param {string} partnerId                – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.status]         – Filter by MDF status.
 * @param {string} [options.mdf_type]       – Filter by MDF type.
 * @param {number} [options.limit]          – Max records (default 50, max 500).
 * @param {string} [options.sort_dir='desc'] – Sort direction for created_at.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getMDFs(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const constraints = [where('partner_id', '==', partnerId)];

    if (options.status) {
      if (!VALID_MDF_STATUSES.includes(options.status)) {
        return _fail(`Invalid status "${options.status}"`);
      }
      constraints.push(where('status', '==', options.status));
    }

    if (options.mdf_type) {
      if (!MDF_TYPES.includes(options.mdf_type)) {
        return _fail(`Invalid mdf_type "${options.mdf_type}"`);
      }
      constraints.push(where('mdf_type', '==', options.mdf_type));
    }

    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    let maxResults = options.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, MDF_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const mdfs = snapshot.docs.map((d) => {
      const rec = d.data();
      return {
        id: d.id,
        ...rec,
        created_at: _ts(rec.created_at),
        updated_at: _ts(rec.updated_at),
      };
    });

    return _ok(mdfs);
  } catch (err) {
    console.error('[economicsService.getMDFs]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updateMDF
// =============================================================================

/**
 * Update an MDF record.
 *
 * @param {string} mdfId    – MDF document ID (required).
 * @param {Object} updates  – Fields to update.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateMDF(mdfId, updates = {}) {
  try {
    const uid = _requireAuth();

    if (!mdfId) return _fail('mdfId is required');
    if (!updates || Object.keys(updates).length === 0) return _fail('No updates provided');

    const docRef = doc(db, MDF_COLLECTION, mdfId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`MDF "${mdfId}" not found`);

    const current = snap.data();

    if (updates.status && !VALID_MDF_STATUSES.includes(updates.status)) {
      return _fail(`Invalid status "${updates.status}"`);
    }

    if (updates.mdf_type && !MDF_TYPES.includes(updates.mdf_type)) {
      return _fail(`Invalid mdf_type "${updates.mdf_type}"`);
    }

    if (updates.currency && !VALID_CURRENCIES.includes(updates.currency)) {
      return _fail(`Invalid currency "${updates.currency}"`);
    }

    // Strip system fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;
    delete safeUpdates.partner_id;
    delete safeUpdates.status_history;

    // Track status changes
    if (safeUpdates.status && safeUpdates.status !== current.status) {
      const statusEntry = {
        status: safeUpdates.status,
        changed_at: new Date().toISOString(),
        changed_by: uid,
      };
      safeUpdates.status_history = [...(current.status_history || []), statusEntry];
    }

    // Recalculate converted amounts if amount_requested or currency changed
    if (safeUpdates.amount_requested != null || safeUpdates.currency) {
      const newAmount = safeUpdates.amount_requested ?? current.amount_requested;
      const newCurrency = safeUpdates.currency ?? current.currency;
      const secondaryCurrency = newCurrency === 'USD' ? 'CAD' : 'USD';
      const converted = _convert(newAmount, newCurrency, secondaryCurrency);
      safeUpdates.amount_requested_converted = converted.converted;
      safeUpdates.currency_converted = secondaryCurrency;
      safeUpdates.exchange_rate = converted.rate;
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
    console.error('[economicsService.updateMDF]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// createPayout
// =============================================================================

/**
 * Record a payout for a partner.
 *
 * @param {Object} data
 * @param {string} data.partner_id          – Associated partner ID (required).
 * @param {number} data.amount              – Payout amount (required).
 * @param {string} [data.currency='USD']    – Currency code.
 * @param {string} [data.payout_method]     – Payment method (wire, cheque, etc.).
 * @param {string} [data.reference_number]  – External reference / transaction ID.
 * @param {string} [data.description]       – Notes / description.
 * @param {string} [data.scheduled_date]    – ISO date for scheduled payout.
 * @param {Array<string>} [data.commission_ids] – Related commission IDs.
 * @param {string} [data.status='scheduled'] – Payout status.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createPayout(data = {}) {
  try {
    const uid = _requireAuth();

    const { partner_id, amount } = data;

    // --- validation ---------------------------------------------------------
    if (!partner_id) return _fail('partner_id is required');
    if (amount == null || typeof amount !== 'number') return _fail('amount is required and must be a number');

    if (data.status && !VALID_PAYOUT_STATUSES.includes(data.status)) {
      return _fail(`Invalid status "${data.status}". Must be one of: ${VALID_PAYOUT_STATUSES.join(', ')}`);
    }

    const currency = data.currency || 'USD';
    if (!VALID_CURRENCIES.includes(currency)) {
      return _fail(`Invalid currency "${currency}". Must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partner_id);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partner_id}" not found`);

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    const secondaryCurrency = currency === 'USD' ? 'CAD' : 'USD';
    const converted = _convert(amount, currency, secondaryCurrency);

    const record = {
      partner_id,
      amount,
      currency,
      amount_converted: converted.converted,
      currency_converted: secondaryCurrency,
      exchange_rate: converted.rate,
      payout_method: data.payout_method || '',
      reference_number: data.reference_number || '',
      description: data.description || '',
      scheduled_date: data.scheduled_date || null,
      commission_ids: data.commission_ids || [],
      status: data.status || 'scheduled',
      status_history: [
        {
          status: data.status || 'scheduled',
          changed_at: new Date().toISOString(),
          changed_by: uid,
        },
      ],
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, PAYOUTS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[economicsService.createPayout]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getPayouts
// =============================================================================

/**
 * Fetch payout records for a partner.
 *
 * @param {string} partnerId                – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.status]         – Filter by payout status.
 * @param {number} [options.limit]          – Max records (default 50, max 500).
 * @param {string} [options.sort_dir='desc'] – Sort direction for created_at.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getPayouts(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const constraints = [where('partner_id', '==', partnerId)];

    if (options.status) {
      if (!VALID_PAYOUT_STATUSES.includes(options.status)) {
        return _fail(`Invalid status "${options.status}"`);
      }
      constraints.push(where('status', '==', options.status));
    }

    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    let maxResults = options.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, PAYOUTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const payouts = snapshot.docs.map((d) => {
      const rec = d.data();
      return {
        id: d.id,
        ...rec,
        created_at: _ts(rec.created_at),
        updated_at: _ts(rec.updated_at),
      };
    });

    return _ok(payouts);
  } catch (err) {
    console.error('[economicsService.getPayouts]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updatePayout
// =============================================================================

/**
 * Update a payout record.
 *
 * @param {string} payoutId  – Payout document ID (required).
 * @param {Object} updates   – Fields to update.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updatePayout(payoutId, updates = {}) {
  try {
    const uid = _requireAuth();

    if (!payoutId) return _fail('payoutId is required');
    if (!updates || Object.keys(updates).length === 0) return _fail('No updates provided');

    const docRef = doc(db, PAYOUTS_COLLECTION, payoutId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Payout "${payoutId}" not found`);

    const current = snap.data();

    if (updates.status && !VALID_PAYOUT_STATUSES.includes(updates.status)) {
      return _fail(`Invalid status "${updates.status}"`);
    }

    if (updates.currency && !VALID_CURRENCIES.includes(updates.currency)) {
      return _fail(`Invalid currency "${updates.currency}"`);
    }

    // Strip system fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;
    delete safeUpdates.partner_id;
    delete safeUpdates.status_history;

    // Track status changes
    if (safeUpdates.status && safeUpdates.status !== current.status) {
      const statusEntry = {
        status: safeUpdates.status,
        changed_at: new Date().toISOString(),
        changed_by: uid,
      };
      safeUpdates.status_history = [...(current.status_history || []), statusEntry];
    }

    // Recalculate converted amount if amount or currency changed
    if (safeUpdates.amount != null || safeUpdates.currency) {
      const newAmount = safeUpdates.amount ?? current.amount;
      const newCurrency = safeUpdates.currency ?? current.currency;
      const secondaryCurrency = newCurrency === 'USD' ? 'CAD' : 'USD';
      const converted = _convert(newAmount, newCurrency, secondaryCurrency);
      safeUpdates.amount_converted = converted.converted;
      safeUpdates.currency_converted = secondaryCurrency;
      safeUpdates.exchange_rate = converted.rate;
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
    console.error('[economicsService.updatePayout]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// createRevenueAttribution
// =============================================================================

/**
 * Record a revenue attribution for a partner.
 *
 * @param {Object} data
 * @param {string} data.partner_id          – Associated partner ID (required).
 * @param {string} [data.deal_id]           – Related deal ID.
 * @param {number} data.amount              – Revenue amount (required).
 * @param {string} [data.currency='USD']    – Currency code.
 * @param {string} [data.attribution_type]  – e.g. 'sourced', 'influenced', 'co_sold'.
 * @param {number} [data.attribution_percent=100] – Partner attribution percentage.
 * @param {string} [data.product]           – Product / service name.
 * @param {string} [data.customer_name]     – End-customer name.
 * @param {string} [data.close_date]        – ISO date deal was closed.
 * @param {string} [data.description]       – Notes / description.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createRevenueAttribution(data = {}) {
  try {
    const uid = _requireAuth();

    const { partner_id, amount } = data;

    // --- validation ---------------------------------------------------------
    if (!partner_id) return _fail('partner_id is required');
    if (amount == null || typeof amount !== 'number') return _fail('amount is required and must be a number');

    const currency = data.currency || 'USD';
    if (!VALID_CURRENCIES.includes(currency)) {
      return _fail(`Invalid currency "${currency}". Must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partner_id);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partner_id}" not found`);

    // Verify deal exists if provided
    if (data.deal_id) {
      const dealRef = doc(db, DEALS_COLLECTION, data.deal_id);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) return _fail(`Deal "${data.deal_id}" not found`);
    }

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    const attributionPercent = data.attribution_percent ?? 100;
    const attributedAmount = Math.round(amount * (attributionPercent / 100) * 100) / 100;

    const secondaryCurrency = currency === 'USD' ? 'CAD' : 'USD';
    const converted = _convert(amount, currency, secondaryCurrency);
    const attributedConverted = _convert(attributedAmount, currency, secondaryCurrency);

    const record = {
      partner_id,
      deal_id: data.deal_id || null,
      amount,
      attributed_amount: attributedAmount,
      currency,
      amount_converted: converted.converted,
      attributed_amount_converted: attributedConverted.converted,
      currency_converted: secondaryCurrency,
      exchange_rate: converted.rate,
      attribution_type: data.attribution_type || 'sourced',
      attribution_percent: attributionPercent,
      product: data.product || '',
      customer_name: data.customer_name || '',
      close_date: data.close_date || null,
      description: data.description || '',
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, REVENUE_ATTRIBUTIONS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[economicsService.createRevenueAttribution]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getRevenueAttributions
// =============================================================================

/**
 * Fetch revenue attribution records for a partner.
 *
 * @param {string} partnerId                    – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.attribution_type]   – Filter by attribution type.
 * @param {number} [options.limit]              – Max records (default 50, max 500).
 * @param {string} [options.sort_dir='desc']    – Sort direction for created_at.
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getRevenueAttributions(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const constraints = [where('partner_id', '==', partnerId)];

    if (options.attribution_type) {
      constraints.push(where('attribution_type', '==', options.attribution_type));
    }

    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    let maxResults = options.limit || DEFAULT_QUERY_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, REVENUE_ATTRIBUTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const attributions = snapshot.docs.map((d) => {
      const rec = d.data();
      return {
        id: d.id,
        ...rec,
        created_at: _ts(rec.created_at),
        updated_at: _ts(rec.updated_at),
      };
    });

    return _ok(attributions);
  } catch (err) {
    console.error('[economicsService.getRevenueAttributions]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getForecast
// =============================================================================

/**
 * Generate a revenue / commission forecast for a partner.
 *
 * Aggregates active-stage deal values, historical commission data, and recent
 * revenue attributions to produce a simple forward-looking estimate.
 *
 * @param {string} partnerId               – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.currency='USD'] – Output currency for the forecast.
 * @param {number} [options.months=3]       – Forecast horizon in months (1–12).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function getForecast(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const targetCurrency = options.currency || 'USD';
    if (!VALID_CURRENCIES.includes(targetCurrency)) {
      return _fail(`Invalid currency "${targetCurrency}"`);
    }

    let months = options.months || 3;
    if (months < 1) months = 1;
    if (months > 12) months = 12;

    // --- gather active deals ------------------------------------------------
    const dealsQuery = query(
      collection(db, DEALS_COLLECTION),
      where('partner_id', '==', partnerId),
      where('stage', 'in', ['prospecting', 'qualification', 'proposal', 'negotiation']),
    );
    const dealsSnap = await getDocs(dealsQuery);

    const stageWeights = {
      prospecting: 0.10,
      qualification: 0.25,
      proposal: 0.50,
      negotiation: 0.75,
    };

    let weightedPipelineValue = 0;
    let totalPipelineValue = 0;
    const dealsByStage = {};

    dealsSnap.docs.forEach((d) => {
      const deal = d.data();
      const value = deal.value || 0;
      const currency = deal.currency || 'USD';
      const normalised = currency === targetCurrency
        ? value
        : _convert(value, currency, targetCurrency).converted;

      totalPipelineValue += normalised;
      weightedPipelineValue += normalised * (stageWeights[deal.stage] || 0);

      if (!dealsByStage[deal.stage]) {
        dealsByStage[deal.stage] = { count: 0, value: 0 };
      }
      dealsByStage[deal.stage].count += 1;
      dealsByStage[deal.stage].value += normalised;
    });

    // --- gather recent commissions (last 6 months) --------------------------
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const commQuery = query(
      collection(db, COMMISSIONS_COLLECTION),
      where('partner_id', '==', partnerId),
      where('status', '==', 'paid'),
      where('created_at', '>=', Timestamp.fromDate(sixMonthsAgo)),
      orderBy('created_at', 'desc'),
      limit(500),
    );
    const commSnap = await getDocs(commQuery);

    let totalPaidCommissions = 0;
    commSnap.docs.forEach((d) => {
      const c = d.data();
      const value = c.amount || 0;
      const currency = c.currency || 'USD';
      totalPaidCommissions += currency === targetCurrency
        ? value
        : _convert(value, currency, targetCurrency).converted;
    });

    const monthlyAvgCommission = commSnap.docs.length > 0
      ? totalPaidCommissions / 6
      : 0;

    // --- gather recent revenue attributions (last 6 months) -----------------
    const revQuery = query(
      collection(db, REVENUE_ATTRIBUTIONS_COLLECTION),
      where('partner_id', '==', partnerId),
      where('created_at', '>=', Timestamp.fromDate(sixMonthsAgo)),
      orderBy('created_at', 'desc'),
      limit(500),
    );
    const revSnap = await getDocs(revQuery);

    let totalAttributedRevenue = 0;
    revSnap.docs.forEach((d) => {
      const r = d.data();
      const value = r.attributed_amount || 0;
      const currency = r.currency || 'USD';
      totalAttributedRevenue += currency === targetCurrency
        ? value
        : _convert(value, currency, targetCurrency).converted;
    });

    const monthlyAvgRevenue = revSnap.docs.length > 0
      ? totalAttributedRevenue / 6
      : 0;

    // --- build forecast -----------------------------------------------------
    const forecastedRevenue = Math.round((monthlyAvgRevenue * months + weightedPipelineValue) * 100) / 100;
    const forecastedCommissions = Math.round(monthlyAvgCommission * months * 100) / 100;

    return _ok({
      partner_id: partnerId,
      currency: targetCurrency,
      forecast_months: months,
      pipeline: {
        total_value: Math.round(totalPipelineValue * 100) / 100,
        weighted_value: Math.round(weightedPipelineValue * 100) / 100,
        deal_count: dealsSnap.docs.length,
        by_stage: dealsByStage,
      },
      historical: {
        paid_commissions_6m: Math.round(totalPaidCommissions * 100) / 100,
        monthly_avg_commission: Math.round(monthlyAvgCommission * 100) / 100,
        attributed_revenue_6m: Math.round(totalAttributedRevenue * 100) / 100,
        monthly_avg_revenue: Math.round(monthlyAvgRevenue * 100) / 100,
      },
      forecast: {
        estimated_revenue: forecastedRevenue,
        estimated_commissions: forecastedCommissions,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[economicsService.getForecast]', err);
    return _fail(err.message);
  }
}

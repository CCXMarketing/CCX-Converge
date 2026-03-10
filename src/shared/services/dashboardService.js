/**
 * @fileoverview Dashboard Service – Module 2 (Radar)
 *
 * Firestore read operations for the partner dashboard:
 *   - getKPIs            – Active partners count, MRR total, onboarding count
 *   - getAlerts          – Stalled deals, expiring contracts
 *   - getRecentActivity  – Last N interactions across all partners
 *
 * Every public function returns { success, data, error }.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';

// =============================================================================
// Constants
// =============================================================================

const PARTNERS_COLLECTION = 'partners';
const DEALS_COLLECTION = 'deals';
const INTERACTIONS_COLLECTION = 'interactions';
const REVENUE_ATTRIBUTIONS_COLLECTION = 'revenue_attributions';

const ACTIVE_DEAL_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
];

/** Deals with no update in this many days are considered stalled. */
const STALLED_THRESHOLD_DAYS = 14;

/** Contracts closing within this many days trigger an alert. */
const EXPIRING_THRESHOLD_DAYS = 30;

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
// getKPIs
// =============================================================================

/**
 * Fetch high-level KPI metrics for the dashboard.
 *
 * Returns:
 *   - active_partners_count – Number of partners with status "active".
 *   - mrr_total             – Sum of attributed revenue amounts.
 *   - onboarding_count      – Number of partners with status "prospect".
 *
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function getKPIs() {
  try {
    _requireAuth();

    // --- Active partners count -----------------------------------------------
    const activePartnersQuery = query(
      collection(db, PARTNERS_COLLECTION),
      where('status', '==', 'active'),
    );
    const activePartnersSnap = await getDocs(activePartnersQuery);
    const activePartnersCount = activePartnersSnap.size;

    // --- Onboarding count (prospects) ----------------------------------------
    const onboardingQuery = query(
      collection(db, PARTNERS_COLLECTION),
      where('status', '==', 'prospect'),
    );
    const onboardingSnap = await getDocs(onboardingQuery);
    const onboardingCount = onboardingSnap.size;

    // --- MRR total (sum of revenue attributions) -----------------------------
    const revenueSnap = await getDocs(
      collection(db, REVENUE_ATTRIBUTIONS_COLLECTION),
    );

    let mrrTotal = 0;
    revenueSnap.docs.forEach((d) => {
      const data = d.data();
      mrrTotal += data.attributed_amount || 0;
    });

    return _ok({
      active_partners_count: activePartnersCount,
      mrr_total: mrrTotal,
      onboarding_count: onboardingCount,
    });
  } catch (err) {
    console.error('[dashboardService.getKPIs]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getAlerts
// =============================================================================

/**
 * Fetch dashboard alerts for deals that need attention.
 *
 * Returns:
 *   - stalled_deals      – Active deals not updated in the last 14 days.
 *   - expiring_contracts  – Deals with an expected close date within 30 days.
 *
 * @param {Object} [options]
 * @param {number} [options.stalled_days=14]  – Days without update to consider stalled.
 * @param {number} [options.expiring_days=30] – Days until close to flag as expiring.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function getAlerts(options = {}) {
  try {
    _requireAuth();

    const stalledDays = options.stalled_days || STALLED_THRESHOLD_DAYS;
    const expiringDays = options.expiring_days || EXPIRING_THRESHOLD_DAYS;

    // --- Stalled deals -------------------------------------------------------
    const stalledCutoff = Timestamp.fromDate(
      new Date(Date.now() - stalledDays * 24 * 60 * 60 * 1000),
    );

    const stalledQuery = query(
      collection(db, DEALS_COLLECTION),
      where('stage', 'in', ACTIVE_DEAL_STAGES),
      where('updated_at', '<', stalledCutoff),
    );
    const stalledSnap = await getDocs(stalledQuery);

    const stalledDeals = stalledSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        deal_name: data.deal_name,
        partner_id: data.partner_id,
        stage: data.stage,
        value: data.value || 0,
        updated_at: _ts(data.updated_at),
      };
    });

    // --- Expiring contracts --------------------------------------------------
    const now = new Date();
    const expiringCutoff = new Date(
      now.getTime() + expiringDays * 24 * 60 * 60 * 1000,
    );
    const todayISO = now.toISOString().split('T')[0];
    const cutoffISO = expiringCutoff.toISOString().split('T')[0];

    const expiringQuery = query(
      collection(db, DEALS_COLLECTION),
      where('expected_close_date', '>=', todayISO),
      where('expected_close_date', '<=', cutoffISO),
    );
    const expiringSnap = await getDocs(expiringQuery);

    const expiringContracts = expiringSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        deal_name: data.deal_name,
        partner_id: data.partner_id,
        stage: data.stage,
        expected_close_date: data.expected_close_date,
        value: data.value || 0,
      };
    });

    return _ok({
      stalled_deals: stalledDeals,
      expiring_contracts: expiringContracts,
    });
  } catch (err) {
    console.error('[dashboardService.getAlerts]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getRecentActivity
// =============================================================================

/**
 * Fetch the most recent interactions across all partners.
 *
 * @param {Object} [options]
 * @param {number} [options.limit=5] – Number of interactions to return (max 50).
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getRecentActivity(options = {}) {
  try {
    _requireAuth();

    let maxResults = options.limit || 5;
    if (maxResults > 50) maxResults = 50;

    const q = query(
      collection(db, INTERACTIONS_COLLECTION),
      orderBy('created_at', 'desc'),
      limit(maxResults),
    );
    const snapshot = await getDocs(q);

    const interactions = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        partner_id: data.partner_id,
        type: data.type,
        subject: data.subject || '',
        contact_name: data.contact_name || '',
        notes: data.notes || '',
        created_at: _ts(data.created_at),
        created_by: data.created_by,
      };
    });

    return _ok(interactions);
  } catch (err) {
    console.error('[dashboardService.getRecentActivity]', err);
    return _fail(err.message);
  }
}

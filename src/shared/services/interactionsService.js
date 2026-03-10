/**
 * @fileoverview Interactions Service – Module 2 (Radar)
 *
 * Firestore CRUD operations for partner interaction tracking:
 *   - logInteraction        – Record a new interaction with a partner
 *   - getPartnerTimeline    – Fetch interaction history for a partner
 *   - updateInteraction     – Update an existing interaction record
 *   - deleteInteraction     – Remove an interaction record
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

// =============================================================================
// Constants
// =============================================================================

const INTERACTIONS_COLLECTION = 'interactions';
const PARTNERS_COLLECTION = 'partners';
const DEFAULT_TIMELINE_LIMIT = 50;

const VALID_INTERACTION_TYPES = [
  'email',
  'call',
  'meeting',
  'note',
  'demo',
  'training',
  'support',
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
// logInteraction
// =============================================================================

/**
 * Record a new interaction with a partner.
 *
 * @param {Object} interactionData
 * @param {string} interactionData.partner_id      – ID of the associated partner (required).
 * @param {string} interactionData.type             – Interaction type (required). One of VALID_INTERACTION_TYPES.
 * @param {string} [interactionData.subject]        – Brief subject line.
 * @param {string} [interactionData.notes]          – Detailed notes / body.
 * @param {string} [interactionData.contact_name]   – Name of the contact involved.
 * @param {string} [interactionData.contact_email]  – Email of the contact involved.
 * @param {string} [interactionData.outcome]        – Outcome or result of the interaction.
 * @param {string} [interactionData.follow_up_date] – ISO date string for follow-up.
 * @param {Array}  [interactionData.attachments]    – Array of attachment references.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function logInteraction(interactionData = {}) {
  try {
    const uid = _requireAuth();

    const { partner_id, type } = interactionData;

    // --- validation ---------------------------------------------------------
    if (!partner_id) return _fail('partner_id is required');
    if (!type) return _fail('type is required');
    if (!VALID_INTERACTION_TYPES.includes(type)) {
      return _fail(`Invalid interaction type "${type}". Must be one of: ${VALID_INTERACTION_TYPES.join(', ')}`);
    }

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partner_id);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partner_id}" not found`);

    // --- build document -----------------------------------------------------
    const now = serverTimestamp();

    const record = {
      partner_id,
      type,
      subject: interactionData.subject || '',
      notes: interactionData.notes || '',
      contact_name: interactionData.contact_name || '',
      contact_email: interactionData.contact_email || '',
      outcome: interactionData.outcome || '',
      follow_up_date: interactionData.follow_up_date || null,
      attachments: interactionData.attachments || [],
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, INTERACTIONS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    // Update partner's last_interaction_date
    await setDoc(partnerRef, { last_interaction_date: now, updated_at: now }, { merge: true });

    return _ok({ id: docRef.id, ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[interactionsService.logInteraction]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getPartnerTimeline
// =============================================================================

/**
 * Fetch the interaction timeline for a specific partner.
 *
 * @param {string} partnerId                      – Partner document ID (required).
 * @param {Object} [options]
 * @param {string} [options.type]                 – Filter by interaction type.
 * @param {number} [options.limit]                – Max records to return (default 50, max 500).
 * @param {string} [options.sort_dir='desc']      – Sort direction for created_at ('asc' or 'desc').
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getPartnerTimeline(partnerId, options = {}) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');

    const constraints = [where('partner_id', '==', partnerId)];

    // Optional type filter
    if (options.type) {
      if (!VALID_INTERACTION_TYPES.includes(options.type)) {
        return _fail(`Invalid interaction type "${options.type}"`);
      }
      constraints.push(where('type', '==', options.type));
    }

    // Sort direction
    const sortDir = options.sort_dir === 'asc' ? 'asc' : 'desc';
    constraints.push(orderBy('created_at', sortDir));

    // Limit
    let maxResults = options.limit || DEFAULT_TIMELINE_LIMIT;
    if (maxResults > 500) maxResults = 500;
    constraints.push(limit(maxResults));

    const q = query(collection(db, INTERACTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const interactions = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(interactions);
  } catch (err) {
    console.error('[interactionsService.getPartnerTimeline]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// updateInteraction
// =============================================================================

/**
 * Update an existing interaction record.
 *
 * @param {string} interactionId – Document ID of the interaction (required).
 * @param {Object} updates       – Fields to update.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateInteraction(interactionId, updates = {}) {
  try {
    const uid = _requireAuth();

    if (!interactionId) return _fail('interactionId is required');
    if (!updates || Object.keys(updates).length === 0) return _fail('No updates provided');

    // Verify interaction exists
    const docRef = doc(db, INTERACTIONS_COLLECTION, interactionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Interaction "${interactionId}" not found`);

    // Validate type if being updated
    if (updates.type && !VALID_INTERACTION_TYPES.includes(updates.type)) {
      return _fail(`Invalid interaction type "${updates.type}"`);
    }

    // Strip system fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;
    delete safeUpdates.partner_id; // partner_id is immutable

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
    console.error('[interactionsService.updateInteraction]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// deleteInteraction
// =============================================================================

/**
 * Delete an interaction record.
 *
 * @param {string} interactionId – Document ID of the interaction (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function deleteInteraction(interactionId) {
  try {
    _requireAuth();

    if (!interactionId) return _fail('interactionId is required');

    const docRef = doc(db, INTERACTIONS_COLLECTION, interactionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return _fail(`Interaction "${interactionId}" not found`);

    await deleteDoc(docRef);

    return _ok({ id: interactionId, deleted: true });
  } catch (err) {
    console.error('[interactionsService.deleteInteraction]', err);
    return _fail(err.message);
  }
}

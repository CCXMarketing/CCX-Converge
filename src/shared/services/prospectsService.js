/**
 * @fileoverview Prospect List Service – Module 3
 *
 * Provides CRUD operations, stage-pipeline management, duplicate detection,
 * and prospect-to-partner promotion for the Converge prospect list feature.
 *
 * Every public function returns `{ success, data, error }`.
 *
 * Reference: PRD Section 4.3 / Section 7.2
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

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PROSPECTS_COLLECTION = 'prospects';
const PARTNERS_COLLECTION = 'partners';

/** Ordered prospect-pipeline stages. */
const VALID_STAGES = [
  'New',
  'Researching',
  'Outreach Sent',
  'Meeting Scheduled',
  'Evaluating Fit',
];

const DEFAULT_QUERY_LIMIT = 100;

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

/**
 * Ensures the caller is authenticated.
 * @returns {{ uid: string, email: string|null }}
 * @throws {Error} If no user is signed in.
 */
function _requireAuth() {
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('Authentication required. Please sign in to continue.');
  }
  return { uid: user.uid, email: user.email || null };
}

/**
 * Wraps a successful result.
 * @param {*} data
 * @returns {{ success: true, data: *, error: null }}
 */
function _ok(data = null) {
  return { success: true, data, error: null };
}

/**
 * Wraps a failed result.
 * @param {string} message
 * @returns {{ success: false, data: null, error: string }}
 */
function _fail(message) {
  return { success: false, data: null, error: message };
}

/**
 * Converts a Firestore Timestamp to an ISO-8601 string (or null).
 * @param {*} field
 * @returns {string|null}
 */
function _ts(field) {
  return field?.toDate?.() ? field.toDate().toISOString() : null;
}

/* ================================================================== */
/*  Public API                                                        */
/* ================================================================== */

/**
 * Create a new prospect record.
 *
 * @param {Object} prospectData – Prospect fields (company_name required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createProspect(prospectData) {
  try {
    const { uid } = _requireAuth();

    if (!prospectData?.company_name?.trim()) {
      return _fail('Company name is required.');
    }

    const now = serverTimestamp();

    const record = {
      company_name: (prospectData.company_name || '').trim(),
      website_url: (prospectData.website_url || '').trim(),
      industry: (prospectData.industry || '').trim(),
      company_size: (prospectData.company_size || '').trim(),
      region: (prospectData.region || '').trim(),
      territory: (prospectData.territory || '').trim(),
      contact_name: (prospectData.contact_name || '').trim(),
      contact_email: (prospectData.contact_email || '').trim(),
      contact_phone: (prospectData.contact_phone || '').trim(),
      contact_title: (prospectData.contact_title || '').trim(),
      source: (prospectData.source || '').trim(),
      stage: VALID_STAGES.includes(prospectData.stage) ? prospectData.stage : 'New',
      stage_history: [],
      notes: (prospectData.notes || '').trim(),
      tags: Array.isArray(prospectData.tags) ? prospectData.tags : [],
      priority: ['Low', 'Medium', 'High'].includes(prospectData.priority)
        ? prospectData.priority
        : 'Medium',
      next_action: (prospectData.next_action || '').trim(),
      next_action_date: prospectData.next_action_date || null,
      created_at: now,
      created_by: uid,
      updated_at: now,
      updated_by: uid,
    };

    const colRef = collection(db, PROSPECTS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({ id: docRef.id, ...record });
  } catch (err) {
    return _fail(err.message || 'Failed to create prospect.');
  }
}

/**
 * Fetch a single prospect by ID.
 *
 * @param {string} prospectId
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function getProspect(prospectId) {
  try {
    _requireAuth();

    if (!prospectId) {
      return _fail('Prospect ID is required.');
    }

    const docRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return _fail('Prospect not found.');
    }

    const data = snap.data();

    return _ok({
      id: snap.id,
      ...data,
      created_at: _ts(data.created_at),
      updated_at: _ts(data.updated_at),
      next_action_date: _ts(data.next_action_date),
      stage_history: (data.stage_history || []).map((entry) => ({
        ...entry,
        changed_at: _ts(entry.changed_at),
      })),
    });
  } catch (err) {
    return _fail(err.message || 'Failed to fetch prospect.');
  }
}

/**
 * Query prospects with optional filters.
 *
 * Supported filter keys: `stage`, `territory`, `priority`, `industry`,
 * `source`, `created_by`, `limit`.
 *
 * @param {Object} [filters={}]
 * @returns {Promise<{ success: boolean, data: Object[]|null, error: string|null }>}
 */
export async function getAllProspects(filters = {}) {
  try {
    _requireAuth();

    const colRef = collection(db, PROSPECTS_COLLECTION);
    const constraints = [];

    if (filters.stage) {
      constraints.push(where('stage', '==', filters.stage));
    }
    if (filters.territory) {
      constraints.push(where('territory', '==', filters.territory));
    }
    if (filters.priority) {
      constraints.push(where('priority', '==', filters.priority));
    }
    if (filters.industry) {
      constraints.push(where('industry', '==', filters.industry));
    }
    if (filters.source) {
      constraints.push(where('source', '==', filters.source));
    }
    if (filters.created_by) {
      constraints.push(where('created_by', '==', filters.created_by));
    }

    constraints.push(orderBy('created_at', 'desc'));
    constraints.push(limit(filters.limit || DEFAULT_QUERY_LIMIT));

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);

    const prospects = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
        next_action_date: _ts(data.next_action_date),
        stage_history: (data.stage_history || []).map((entry) => ({
          ...entry,
          changed_at: _ts(entry.changed_at),
        })),
      };
    });

    return _ok(prospects);
  } catch (err) {
    return _fail(err.message || 'Failed to fetch prospects.');
  }
}

/**
 * Partial update of prospect fields.
 *
 * System-managed fields (`created_at`, `created_by`, `id`) are stripped
 * from the update payload automatically.
 *
 * @param {string} prospectId
 * @param {Object} updates
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateProspect(prospectId, updates) {
  try {
    const { uid } = _requireAuth();

    if (!prospectId) {
      return _fail('Prospect ID is required.');
    }
    if (!updates || Object.keys(updates).length === 0) {
      return _fail('No updates provided.');
    }

    const docRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return _fail('Prospect not found.');
    }

    // Strip system-managed fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.created_at;
    delete safeUpdates.created_by;

    const merged = {
      ...snap.data(),
      ...safeUpdates,
      updated_at: serverTimestamp(),
      updated_by: uid,
    };

    await setDoc(docRef, merged);

    return _ok({ id: prospectId, ...merged });
  } catch (err) {
    return _fail(err.message || 'Failed to update prospect.');
  }
}

/**
 * Update a prospect's pipeline stage with history tracking.
 *
 * Appends a `{ from, to, changed_at, changed_by }` entry to the
 * `stage_history` array.
 *
 * @param {string} prospectId
 * @param {string} stage – Must be one of VALID_STAGES.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function updateProspectStage(prospectId, stage) {
  try {
    const { uid } = _requireAuth();

    if (!prospectId) {
      return _fail('Prospect ID is required.');
    }
    if (!VALID_STAGES.includes(stage)) {
      return _fail(
        `Invalid stage "${stage}". Must be one of: ${VALID_STAGES.join(', ')}.`
      );
    }

    const docRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return _fail('Prospect not found.');
    }

    const data = snap.data();
    const previousStage = data.stage;

    if (previousStage === stage) {
      return _fail(`Prospect is already in the "${stage}" stage.`);
    }

    const stageEntry = {
      from: previousStage,
      to: stage,
      changed_at: Timestamp.now(),
      changed_by: uid,
    };

    const updatedHistory = [...(data.stage_history || []), stageEntry];

    const merged = {
      ...data,
      stage,
      stage_history: updatedHistory,
      updated_at: serverTimestamp(),
      updated_by: uid,
    };

    await setDoc(docRef, merged);

    return _ok({ id: prospectId, ...merged });
  } catch (err) {
    return _fail(err.message || 'Failed to update prospect stage.');
  }
}

/**
 * Promote a prospect to the partners collection.
 *
 * Pattern: read prospect → write to `partners` → delete prospect.
 *
 * @param {string} prospectId
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function promoteToPartner(prospectId) {
  try {
    const { uid } = _requireAuth();

    if (!prospectId) {
      return _fail('Prospect ID is required.');
    }

    // 1. Read the prospect document
    const prospectRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    const snap = await getDoc(prospectRef);

    if (!snap.exists()) {
      return _fail('Prospect not found.');
    }

    const prospectData = snap.data();

    // 2. Build the partner record
    const now = serverTimestamp();
    const partnerRecord = {
      company_name: prospectData.company_name || '',
      website_url: prospectData.website_url || '',
      industry: prospectData.industry || '',
      company_size: prospectData.company_size || '',
      region: prospectData.region || '',
      territory: prospectData.territory || '',
      contact_name: prospectData.contact_name || '',
      contact_email: prospectData.contact_email || '',
      contact_phone: prospectData.contact_phone || '',
      contact_title: prospectData.contact_title || '',
      source: prospectData.source || '',
      notes: prospectData.notes || '',
      tags: prospectData.tags || [],
      status: 'Active',
      health_score: 0,
      promoted_from_prospect: true,
      original_prospect_id: prospectId,
      prospect_stage_history: prospectData.stage_history || [],
      created_at: now,
      created_by: uid,
      updated_at: now,
      updated_by: uid,
    };

    // 3. Write to partners collection
    const partnersColRef = collection(db, PARTNERS_COLLECTION);
    const partnerDocRef = await addDoc(partnersColRef, partnerRecord);

    // 4. Delete the prospect document
    await deleteDoc(prospectRef);

    return _ok({
      partnerId: partnerDocRef.id,
      originalProspectId: prospectId,
      ...partnerRecord,
    });
  } catch (err) {
    return _fail(err.message || 'Failed to promote prospect to partner.');
  }
}

/**
 * Check for duplicate prospects by company name (fuzzy) and/or website URL
 * (domain match).
 *
 * @param {string} companyName
 * @param {string} [websiteUrl]
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function checkDuplicate(companyName, websiteUrl) {
  try {
    _requireAuth();

    if (!companyName?.trim() && !websiteUrl?.trim()) {
      return _fail('At least company name or website URL is required.');
    }

    const colRef = collection(db, PROSPECTS_COLLECTION);
    const snapshot = await getDocs(query(colRef, limit(DEFAULT_QUERY_LIMIT)));

    const nameNorm = (companyName || '').trim().toLowerCase();

    // Extract domain from URL for matching
    let domain = '';
    if (websiteUrl?.trim()) {
      try {
        const urlObj = new URL(
          websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`
        );
        domain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        domain = websiteUrl.trim().toLowerCase();
      }
    }

    const matches = [];

    snapshot.docs.forEach((d) => {
      const data = d.data();
      let nameMatch = false;
      let domainMatch = false;

      // Fuzzy name match – case-insensitive includes
      if (nameNorm) {
        const existingName = (data.company_name || '').trim().toLowerCase();
        nameMatch =
          existingName.includes(nameNorm) || nameNorm.includes(existingName);
      }

      // Domain match
      if (domain && data.website_url) {
        try {
          const existingUrl = new URL(
            data.website_url.startsWith('http')
              ? data.website_url
              : `https://${data.website_url}`
          );
          const existingDomain = existingUrl.hostname
            .replace(/^www\./, '')
            .toLowerCase();
          domainMatch = existingDomain === domain;
        } catch {
          domainMatch = false;
        }
      }

      if (nameMatch || domainMatch) {
        matches.push({
          id: d.id,
          company_name: data.company_name,
          website_url: data.website_url,
          stage: data.stage,
          nameMatch,
          domainMatch,
        });
      }
    });

    return _ok({
      hasDuplicates: matches.length > 0,
      duplicates: matches,
    });
  } catch (err) {
    return _fail(err.message || 'Failed to check for duplicates.');
  }
}

/**
 * Delete a prospect record.
 *
 * @param {string} prospectId
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function deleteProspect(prospectId) {
  try {
    _requireAuth();

    if (!prospectId) {
      return _fail('Prospect ID is required.');
    }

    const docRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return _fail('Prospect not found.');
    }

    await deleteDoc(docRef);

    return _ok({ id: prospectId, deleted: true });
  } catch (err) {
    return _fail(err.message || 'Failed to delete prospect.');
  }
}

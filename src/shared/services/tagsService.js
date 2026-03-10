/**
 * @fileoverview Tags Service – Module 2 (Radar)
 *
 * Firestore CRUD operations for partner tagging / labelling:
 *   - createTag          – Create a new tag definition
 *   - getAllTags         – List all available tags
 *   - addTagToPartner   – Attach a tag to a partner
 *   - removeTagFromPartner – Detach a tag from a partner
 *   - deleteTag         – Remove a tag definition entirely
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
  getDocs,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase.js';

// =============================================================================
// Constants
// =============================================================================

const TAGS_COLLECTION = 'tags';
const PARTNERS_COLLECTION = 'partners';

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
// createTag
// =============================================================================

/**
 * Create a new tag definition.
 *
 * @param {Object} tagData
 * @param {string} tagData.name    – Display name of the tag (required, must be unique).
 * @param {string} [tagData.color] – Hex colour code (e.g. '#4A90D9').
 * @param {string} [tagData.description] – Optional description.
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function createTag(tagData = {}) {
  try {
    const uid = _requireAuth();

    const { name } = tagData;
    if (!name) return _fail('Tag name is required');

    // Check for duplicate name (case-insensitive)
    const dupQuery = query(
      collection(db, TAGS_COLLECTION),
      where('name_lower', '==', name.toLowerCase()),
    );
    const dupSnap = await getDocs(dupQuery);
    if (!dupSnap.empty) return _fail(`Tag "${name}" already exists`);

    const now = serverTimestamp();

    const record = {
      name,
      name_lower: name.toLowerCase(),
      color: tagData.color || '#4A90D9',
      description: tagData.description || '',
      usage_count: 0,
      created_at: now,
      updated_at: now,
      created_by: uid,
    };

    const colRef = collection(db, TAGS_COLLECTION);
    const docRef = await addDoc(colRef, record);

    return _ok({
      id: docRef.id,
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[tagsService.createTag]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// getAllTags
// =============================================================================

/**
 * List all available tag definitions, ordered by name.
 *
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getAllTags() {
  try {
    _requireAuth();

    const q = query(collection(db, TAGS_COLLECTION), orderBy('name_lower', 'asc'));
    const snapshot = await getDocs(q);

    const tags = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: _ts(data.created_at),
        updated_at: _ts(data.updated_at),
      };
    });

    return _ok(tags);
  } catch (err) {
    console.error('[tagsService.getAllTags]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// addTagToPartner
// =============================================================================

/**
 * Attach a tag to a partner. Increments the tag's usage_count.
 *
 * @param {string} partnerId – Partner document ID (required).
 * @param {string} tagId     – Tag document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function addTagToPartner(partnerId, tagId) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');
    if (!tagId) return _fail('tagId is required');

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partnerId}" not found`);

    // Verify tag exists
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    const tagSnap = await getDoc(tagRef);
    if (!tagSnap.exists()) return _fail(`Tag "${tagId}" not found`);

    // Check if already tagged
    const partnerData = partnerSnap.data();
    if (partnerData.tags && partnerData.tags.includes(tagId)) {
      return _fail('Tag is already applied to this partner');
    }

    const now = serverTimestamp();

    // Add tag ID to partner's tags array
    await setDoc(partnerRef, { tags: arrayUnion(tagId), updated_at: now }, { merge: true });

    // Increment usage count on tag
    await setDoc(tagRef, { usage_count: increment(1), updated_at: now }, { merge: true });

    return _ok({ partner_id: partnerId, tag_id: tagId, action: 'added' });
  } catch (err) {
    console.error('[tagsService.addTagToPartner]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// removeTagFromPartner
// =============================================================================

/**
 * Detach a tag from a partner. Decrements the tag's usage_count.
 *
 * @param {string} partnerId – Partner document ID (required).
 * @param {string} tagId     – Tag document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function removeTagFromPartner(partnerId, tagId) {
  try {
    _requireAuth();

    if (!partnerId) return _fail('partnerId is required');
    if (!tagId) return _fail('tagId is required');

    // Verify partner exists
    const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) return _fail(`Partner "${partnerId}" not found`);

    // Verify tag exists
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    const tagSnap = await getDoc(tagRef);
    if (!tagSnap.exists()) return _fail(`Tag "${tagId}" not found`);

    // Check if tag is actually applied
    const partnerData = partnerSnap.data();
    if (!partnerData.tags || !partnerData.tags.includes(tagId)) {
      return _fail('Tag is not applied to this partner');
    }

    const now = serverTimestamp();

    // Remove tag ID from partner's tags array
    await setDoc(partnerRef, { tags: arrayRemove(tagId), updated_at: now }, { merge: true });

    // Decrement usage count on tag
    await setDoc(tagRef, { usage_count: increment(-1), updated_at: now }, { merge: true });

    return _ok({ partner_id: partnerId, tag_id: tagId, action: 'removed' });
  } catch (err) {
    console.error('[tagsService.removeTagFromPartner]', err);
    return _fail(err.message);
  }
}

// =============================================================================
// deleteTag
// =============================================================================

/**
 * Remove a tag definition. Also strips the tag from any partners that have it.
 *
 * @param {string} tagId – Tag document ID (required).
 * @returns {Promise<{ success: boolean, data: Object|null, error: string|null }>}
 */
export async function deleteTag(tagId) {
  try {
    _requireAuth();

    if (!tagId) return _fail('tagId is required');

    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    const tagSnap = await getDoc(tagRef);
    if (!tagSnap.exists()) return _fail(`Tag "${tagId}" not found`);

    // Find all partners using this tag and remove it
    const partnersQuery = query(
      collection(db, PARTNERS_COLLECTION),
      where('tags', 'array-contains', tagId),
    );
    const partnersSnap = await getDocs(partnersQuery);

    const now = serverTimestamp();
    const removePromises = partnersSnap.docs.map((d) =>
      setDoc(doc(db, PARTNERS_COLLECTION, d.id), { tags: arrayRemove(tagId), updated_at: now }, { merge: true }),
    );
    await Promise.all(removePromises);

    // Delete the tag document
    await deleteDoc(tagRef);

    return _ok({ id: tagId, deleted: true, partners_updated: partnersSnap.size });
  } catch (err) {
    console.error('[tagsService.deleteTag]', err);
    return _fail(err.message);
  }
}

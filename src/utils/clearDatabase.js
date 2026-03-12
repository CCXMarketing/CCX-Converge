/**
 * clearDatabase.js — One-time database cleanup utility
 *
 * Deletes all documents from transactional collections while
 * preserving configuration collections (settings, tags, knowledge_base, webhooks).
 */

import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTIONS_TO_CLEAR = [
  'partners',
  'partners_archived',
  'prospects',
  'interactions',
  'deals',
  'commissions',
  'mdf',
  'payouts',
  'checklists',
];

/**
 * Delete all documents in a single Firestore collection using batched writes.
 * Returns the number of documents deleted.
 */
async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName);
  const snap = await getDocs(colRef);

  if (snap.empty) return 0;

  // Firestore batches are limited to 500 operations
  const batchSize = 500;
  let deleted = 0;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + batchSize);
    chunk.forEach((d) => batch.delete(doc(db, collectionName, d.id)));
    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

/**
 * Clear all transactional data from Firestore.
 * Returns a summary object with per-collection counts.
 */
export async function clearAllData() {
  const results = {};

  for (const name of COLLECTIONS_TO_CLEAR) {
    try {
      const count = await clearCollection(name);
      results[name] = { deleted: count, error: null };
    } catch (err) {
      results[name] = { deleted: 0, error: err.message };
    }
  }

  return results;
}

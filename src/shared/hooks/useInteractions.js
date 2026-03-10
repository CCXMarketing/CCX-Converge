// =============================================================================
// src/shared/hooks/useInteractions.js
// Module 2 – Radar: React hooks for interaction management
// =============================================================================

/**
 * @fileoverview React hooks wrapping interactionsService for interaction operations.
 *
 * Exports:
 *  - useInteractions(partnerId)    — fetch partner timeline, auto-fetches on mount
 *  - useInteractionActions()       — log, update, delete interaction actions
 *
 * @returns {Object} Hook state and action callbacks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPartnerTimeline,
  logInteraction,
  updateInteraction,
  deleteInteraction,
} from '../services/interactionsService';

// =============================================================================
// useInteractions — Partner timeline with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's interaction timeline.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {number} [options.limit] - Max interactions to return
 * @param {string} [options.type] - Filter by interaction type
 * @returns {{
 *   interactions: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useInteractions(partnerId, options = {}) {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchInteractions = useCallback(async () => {
    if (!partnerId) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getPartnerTimeline(partnerId, options);
    if (result.success) {
      setInteractions(result.data);
    } else {
      setError(result.error);
      setInteractions([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setInteractions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getPartnerTimeline(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setInteractions(result.data);
        } else {
          setError(result.error);
          setInteractions([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchInteractions();
  }, [fetchInteractions]);

  return { interactions, loading, error, refresh };
}

// =============================================================================
// useInteractionActions — Log, update, delete interactions
// =============================================================================

/**
 * Provides action callbacks for interaction CRUD operations.
 *
 * @returns {{
 *   log: Function,
 *   update: Function,
 *   remove: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useInteractionActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const log = useCallback(async (interactionData) => {
    setLoading(true);
    setError(null);
    const result = await logInteraction(interactionData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const update = useCallback(async (interactionId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updateInteraction(interactionId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const remove = useCallback(async (interactionId) => {
    setLoading(true);
    setError(null);
    const result = await deleteInteraction(interactionId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { log, update, remove, loading, error };
}

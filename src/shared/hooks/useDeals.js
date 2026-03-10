// =============================================================================
// src/shared/hooks/useDeals.js
// Module 2 – Radar: React hooks for deal management
// =============================================================================

/**
 * @fileoverview React hooks wrapping dealsService for deal operations.
 *
 * Exports:
 *  - useDeals(partnerId)    — fetch partner deals, auto-fetches on mount
 *  - useDealActions()       — register, updateStage, checkConflict, update deal actions
 *
 * @returns {Object} Hook state and action callbacks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPartnerDeals,
  registerDeal,
  updateDealStage,
  checkConflict,
  updateDeal,
} from '../services/dealsService';

// =============================================================================
// useDeals — Partner deals with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's deal list.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {string} [options.stage] - Filter by deal stage
 * @param {number} [options.limit] - Max deals to return
 * @returns {{
 *   deals: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useDeals(partnerId, options = {}) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchDeals = useCallback(async () => {
    if (!partnerId) {
      setDeals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getPartnerDeals(partnerId, options);
    if (result.success) {
      setDeals(result.data);
    } else {
      setError(result.error);
      setDeals([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setDeals([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getPartnerDeals(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setDeals(result.data);
        } else {
          setError(result.error);
          setDeals([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchDeals();
  }, [fetchDeals]);

  return { deals, loading, error, refresh };
}

// =============================================================================
// useDealActions — Register, update stage, check conflict, update deals
// =============================================================================

/**
 * Provides action callbacks for deal CRUD operations.
 *
 * @returns {{
 *   register: Function,
 *   updateStage: Function,
 *   checkConflict: Function,
 *   update: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useDealActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = useCallback(async (dealData) => {
    setLoading(true);
    setError(null);
    const result = await registerDeal(dealData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const updateStage = useCallback(async (dealId, newStage) => {
    setLoading(true);
    setError(null);
    const result = await updateDealStage(dealId, newStage);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const conflict = useCallback(async (partnerId, productName) => {
    setLoading(true);
    setError(null);
    const result = await checkConflict(partnerId, productName);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const update = useCallback(async (dealId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updateDeal(dealId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { register, updateStage, checkConflict: conflict, update, loading, error };
}

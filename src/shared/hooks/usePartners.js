// =============================================================================
// src/shared/hooks/usePartners.js
// Module 2 – Radar: React hooks for partner management
// =============================================================================

/**
 * @fileoverview React hooks wrapping partnersService for partner CRUD operations.
 *
 * Exports:
 *  - usePartners(filters)  — list partners with optional filters, auto-fetches on mount
 *  - usePartnerActions()   — create, update, archive, restore partner actions
 *
 * @returns {Object} Hook state and action callbacks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllPartners,
  createPartner,
  updatePartner,
  archivePartner,
  restorePartner,
} from '../services/partnersService';

// =============================================================================
// usePartners — List partners with optional filters
// =============================================================================

/**
 * Fetches and manages a list of partners with optional filtering.
 *
 * @param {Object} [filters={}] - Optional filter criteria
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.tier] - Filter by tier
 * @param {string} [filters.partner_type] - Filter by partner type
 * @param {string} [filters.region] - Filter by region
 * @param {string} [filters.sort_by] - Field to sort by
 * @param {string} [filters.sort_dir] - Sort direction ('asc' | 'desc')
 * @param {number} [filters.limit] - Max results to return
 * @returns {{
 *   partners: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function usePartners(filters = {}) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAllPartners(filters);
    if (result.success) {
      setPartners(result.data);
    } else {
      setError(result.error);
      setPartners([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await getAllPartners(filters);
      if (!cancelled) {
        if (result.success) {
          setPartners(result.data);
        } else {
          setError(result.error);
          setPartners([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const refresh = useCallback(() => {
    return fetchPartners();
  }, [fetchPartners]);

  return { partners, loading, error, refresh };
}

// =============================================================================
// usePartnerActions — Create, update, archive, restore partners
// =============================================================================

/**
 * Provides action callbacks for partner CRUD operations.
 *
 * @returns {{
 *   create: Function,
 *   update: Function,
 *   archive: Function,
 *   restore: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function usePartnerActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (partnerData) => {
    setLoading(true);
    setError(null);
    const result = await createPartner(partnerData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const update = useCallback(async (partnerId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updatePartner(partnerId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const archive = useCallback(async (partnerId) => {
    setLoading(true);
    setError(null);
    const result = await archivePartner(partnerId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const restore = useCallback(async (archivedId) => {
    setLoading(true);
    setError(null);
    const result = await restorePartner(archivedId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { create, update, archive, restore, loading, error };
}

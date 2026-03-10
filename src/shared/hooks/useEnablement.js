// =============================================================================
// src/shared/hooks/useEnablement.js
// Module 8 – Enablement: React hooks for enablement management
// =============================================================================

/**
 * @fileoverview React hooks wrapping enablementService for enablement operations.
 *
 * Exports:
 *  - useChecklists(partnerId, options)   — fetch partner checklists, auto-fetches on mount
 *  - useChecklist(checklistId)           — fetch single checklist, auto-fetches on mount
 *  - useTierCriteria(tier)              — fetch tier criteria, auto-fetches on mount
 *  - useAssetLinks(options)             — fetch asset links, auto-fetches on mount
 *  - useChecklistActions()              — create, update, remove checklist actions
 *  - useTierCriteriaActions()           — update tier criteria action
 *  - useAssetLinkActions()              — create, remove asset link actions
 *
 * @returns {Object} Hook state and action callbacks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getChecklists,
  getChecklistById,
  updateChecklist,
  createChecklist,
  deleteChecklist,
  getTierCriteria,
  updateTierCriteria,
  getAssetLinks,
  createAssetLink,
  deleteAssetLink,
} from '../services/enablementService';

// =============================================================================
// useChecklists — Partner checklists with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's checklist list.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {string} [options.status] - Filter by checklist status
 * @param {string} [options.tier] - Filter by partner tier
 * @param {number} [options.limit] - Max checklists to return
 * @param {string} [options.sort_dir] - Sort direction ('asc' or 'desc')
 * @returns {{
 *   checklists: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useChecklists(partnerId, options = {}) {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchChecklists = useCallback(async () => {
    if (!partnerId) {
      setChecklists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getChecklists(partnerId, options);
    if (result.success) {
      setChecklists(result.data);
    } else {
      setError(result.error);
      setChecklists([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setChecklists([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getChecklists(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setChecklists(result.data);
        } else {
          setError(result.error);
          setChecklists([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchChecklists();
  }, [fetchChecklists]);

  return { checklists, loading, error, refresh };
}

// =============================================================================
// useChecklist — Single checklist with auto-fetch
// =============================================================================

/**
 * Fetches and manages a single checklist by ID.
 *
 * @param {string} checklistId - The checklist document ID
 * @returns {{
 *   checklist: Object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useChecklist(checklistId) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChecklist = useCallback(async () => {
    if (!checklistId) {
      setChecklist(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getChecklistById(checklistId);
    if (result.success) {
      setChecklist(result.data);
    } else {
      setError(result.error);
      setChecklist(null);
    }
    setLoading(false);
  }, [checklistId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!checklistId) {
        setChecklist(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getChecklistById(checklistId);
      if (!cancelled) {
        if (result.success) {
          setChecklist(result.data);
        } else {
          setError(result.error);
          setChecklist(null);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [checklistId]);

  const refresh = useCallback(() => {
    return fetchChecklist();
  }, [fetchChecklist]);

  return { checklist, loading, error, refresh };
}

// =============================================================================
// useTierCriteria — Tier criteria with auto-fetch
// =============================================================================

/**
 * Fetches tier criteria. Pass a specific tier to fetch one, or omit to fetch all.
 *
 * @param {string} [tier] - Optional tier name ('bronze', 'silver', 'gold', 'platinum')
 * @returns {{
 *   criteria: Object|Array|null,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useTierCriteria(tier) {
  const [criteria, setCriteria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCriteria = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getTierCriteria(tier);
    if (result.success) {
      setCriteria(result.data);
    } else {
      setError(result.error);
      setCriteria(null);
    }
    setLoading(false);
  }, [tier]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await getTierCriteria(tier);
      if (!cancelled) {
        if (result.success) {
          setCriteria(result.data);
        } else {
          setError(result.error);
          setCriteria(null);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [tier]);

  const refresh = useCallback(() => {
    return fetchCriteria();
  }, [fetchCriteria]);

  return { criteria, loading, error, refresh };
}

// =============================================================================
// useAssetLinks — Asset links with auto-fetch
// =============================================================================

/**
 * Fetches and manages asset links with optional filters.
 *
 * @param {Object} [options={}] - Optional query options
 * @param {string} [options.partner_id] - Filter by partner ID
 * @param {string} [options.tier] - Filter by tier
 * @param {string} [options.asset_type] - Filter by asset type
 * @param {number} [options.limit] - Max asset links to return
 * @param {string} [options.sort_dir] - Sort direction ('asc' or 'desc')
 * @returns {{
 *   assetLinks: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useAssetLinks(options = {}) {
  const [assetLinks, setAssetLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchAssetLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAssetLinks(options);
    if (result.success) {
      setAssetLinks(result.data);
    } else {
      setError(result.error);
      setAssetLinks([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await getAssetLinks(options);
      if (!cancelled) {
        if (result.success) {
          setAssetLinks(result.data);
        } else {
          setError(result.error);
          setAssetLinks([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  const refresh = useCallback(() => {
    return fetchAssetLinks();
  }, [fetchAssetLinks]);

  return { assetLinks, loading, error, refresh };
}

// =============================================================================
// useChecklistActions — Create, update, remove checklists
// =============================================================================

/**
 * Provides action callbacks for checklist CRUD operations.
 *
 * @returns {{
 *   create: Function,
 *   update: Function,
 *   remove: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useChecklistActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (checklistData) => {
    setLoading(true);
    setError(null);
    const result = await createChecklist(checklistData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const update = useCallback(async (checklistId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updateChecklist(checklistId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const remove = useCallback(async (checklistId) => {
    setLoading(true);
    setError(null);
    const result = await deleteChecklist(checklistId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { create, update, remove, loading, error };
}

// =============================================================================
// useTierCriteriaActions — Update tier criteria
// =============================================================================

/**
 * Provides action callback for updating tier criteria.
 *
 * @returns {{
 *   update: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useTierCriteriaActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (tier, criteria) => {
    setLoading(true);
    setError(null);
    const result = await updateTierCriteria(tier, criteria);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { update, loading, error };
}

// =============================================================================
// useAssetLinkActions — Create, remove asset links
// =============================================================================

/**
 * Provides action callbacks for asset link operations.
 *
 * @returns {{
 *   create: Function,
 *   remove: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useAssetLinkActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (assetData) => {
    setLoading(true);
    setError(null);
    const result = await createAssetLink(assetData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const remove = useCallback(async (assetLinkId) => {
    setLoading(true);
    setError(null);
    const result = await deleteAssetLink(assetLinkId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { create, remove, loading, error };
}
// =============================================================================
// Main Hook - Simplified for current implementation
// =============================================================================

/**
 * Main hook for enablement module
 */
export function useEnablement() {
  const checklistActions = useChecklistActions();
  const tierActions = useTierCriteriaActions();
  const assetLinkActions = useAssetLinkActions();

  return {
    // Checklist actions
    createChecklist: checklistActions.create,
    updateChecklist: checklistActions.update,
    deleteChecklist: checklistActions.remove,

    // Tier criteria actions
    updateTierCriteria: tierActions.update,
    
    // Asset link actions
    createAssetLink: assetLinkActions.create,
    deleteAssetLink: assetLinkActions.remove,
    
    // Loading states
    loading: checklistActions.loading || tierActions.loading || assetLinkActions.loading,
    error: checklistActions.error || tierActions.error || assetLinkActions.error
  };
}
/**
 * @fileoverview React hooks for the Prospect List feature – Module 3
 *
 * Provides `useProspects(filters)` for listing/filtering and
 * `useProspectActions()` for CRUD, stage management, duplicate
 * checking, and promotion to partner.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllProspects,
  createProspect,
  updateProspect,
  updateProspectStage,
  promoteToPartner,
  checkDuplicate,
  deleteProspect,
} from '../services/prospectsService';

/**
 * Hook – subscribe to a filtered list of prospects.
 *
 * @param {Object} [filters={}] – Optional filter object passed to
 *   `getAllProspects` (stage, territory, priority, industry, source, etc.).
 * @returns {{ prospects: Object[], loading: boolean, error: string|null, refresh: Function }}
 */
export function useProspects(filters = {}) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAllProspects(filters);
    if (result.success) {
      setProspects(result.data);
    } else {
      setError(result.error);
      setProspects([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await getAllProspects(filters);
      if (!cancelled) {
        if (result.success) {
          setProspects(result.data);
        } else {
          setError(result.error);
          setProspects([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const refresh = useCallback(() => {
    return fetchProspects();
  }, [fetchProspects]);

  return { prospects, loading, error, refresh };
}

/**
 * Hook – prospect CRUD & stage-management actions.
 *
 * @returns {{
 *   create: Function,
 *   update: Function,
 *   updateStage: Function,
 *   promote: Function,
 *   checkDuplicate: Function,
 *   remove: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useProspectActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (prospectData) => {
    setLoading(true);
    setError(null);
    const result = await createProspect(prospectData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const update = useCallback(async (prospectId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updateProspect(prospectId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const updateStage = useCallback(async (prospectId, stage) => {
    setLoading(true);
    setError(null);
    const result = await updateProspectStage(prospectId, stage);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const promote = useCallback(async (prospectId) => {
    setLoading(true);
    setError(null);
    const result = await promoteToPartner(prospectId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const checkDup = useCallback(async (companyName, websiteUrl) => {
    setLoading(true);
    setError(null);
    const result = await checkDuplicate(companyName, websiteUrl);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const remove = useCallback(async (prospectId) => {
    setLoading(true);
    setError(null);
    const result = await deleteProspect(prospectId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return {
    create,
    update,
    updateStage,
    promote,
    checkDuplicate: checkDup,
    remove,
    loading,
    error,
  };
}

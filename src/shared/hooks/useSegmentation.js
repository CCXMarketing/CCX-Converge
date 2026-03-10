// =============================================================================
// src/shared/hooks/useSegmentation.js
// Module 2 – Radar: React hooks for segmentation view management
// =============================================================================

/**
 * @fileoverview React hooks wrapping segmentationService for saved view operations.
 *
 * Exports:
 *  - useSegmentationViews()     — fetch all saved views, auto-fetches on mount
 *  - useSegmentationActions()   — save, delete, apply segmentation view actions
 *
 * @returns {Object} Hook state and action callbacks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllViews,
  saveView,
  deleteView,
  applyView,
} from '../services/segmentationService';

// =============================================================================
// useSegmentationViews — List all saved views with auto-fetch
// =============================================================================

/**
 * Fetches and manages the list of all segmentation views.
 *
 * @returns {{
 *   views: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useSegmentationViews() {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchViews = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAllViews();
    if (result.success) {
      setViews(result.data);
    } else {
      setError(result.error);
      setViews([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await getAllViews();
      if (!cancelled) {
        if (result.success) {
          setViews(result.data);
        } else {
          setError(result.error);
          setViews([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(() => {
    return fetchViews();
  }, [fetchViews]);

  return { views, loading, error, refresh };
}

// =============================================================================
// useSegmentationActions — Save, delete, apply segmentation views
// =============================================================================

/**
 * Provides action callbacks for segmentation view operations.
 *
 * @returns {{
 *   save: Function,
 *   remove: Function,
 *   apply: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useSegmentationActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const save = useCallback(async (viewData) => {
    setLoading(true);
    setError(null);
    const result = await saveView(viewData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const remove = useCallback(async (viewId) => {
    setLoading(true);
    setError(null);
    const result = await deleteView(viewId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const apply = useCallback(async (viewId) => {
    setLoading(true);
    setError(null);
    const result = await applyView(viewId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { save, remove, apply, loading, error };
}

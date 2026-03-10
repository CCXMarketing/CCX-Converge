// =============================================================================
// src/shared/hooks/useTags.js
// Module 2 – Radar: React hooks for tag management
// =============================================================================

/**
 * @fileoverview React hooks wrapping tagsService for tag operations.
 *
 * Exports:
 *  - useTags()          — fetch all tags, auto-fetches on mount
 *  - useTagActions()    — create, addToPartner, removeFromPartner, delete tag actions
 *
 * @returns {Object} Hook state and action callbacks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getAllTags,
  createTag,
  addTagToPartner,
  removeTagFromPartner,
  deleteTag,
} from '../services/tagsService';

// =============================================================================
// useTags — List all tags with auto-fetch
// =============================================================================

/**
 * Fetches and manages the list of all tags.
 *
 * @returns {{
 *   tags: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAllTags();
    if (result.success) {
      setTags(result.data);
    } else {
      setError(result.error);
      setTags([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await getAllTags();
      if (!cancelled) {
        if (result.success) {
          setTags(result.data);
        } else {
          setError(result.error);
          setTags([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(() => {
    return fetchTags();
  }, [fetchTags]);

  return { tags, loading, error, refresh };
}

// =============================================================================
// useTagActions — Create, add/remove from partner, delete tags
// =============================================================================

/**
 * Provides action callbacks for tag CRUD operations.
 *
 * @returns {{
 *   create: Function,
 *   addToPartner: Function,
 *   removeFromPartner: Function,
 *   remove: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useTagActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (tagData) => {
    setLoading(true);
    setError(null);
    const result = await createTag(tagData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const addToPartner = useCallback(async (partnerId, tagId) => {
    setLoading(true);
    setError(null);
    const result = await addTagToPartner(partnerId, tagId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const removeFromPartner = useCallback(async (partnerId, tagId) => {
    setLoading(true);
    setError(null);
    const result = await removeTagFromPartner(partnerId, tagId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const remove = useCallback(async (tagId) => {
    setLoading(true);
    setError(null);
    const result = await deleteTag(tagId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return { create, addToPartner, removeFromPartner, remove, loading, error };
}

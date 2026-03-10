/**
 * @fileoverview React custom hooks for the Converge Integrations Module.
 * Provides stateful wrappers around integrationsService functions with
 * loading states, error handling, and automatic data fetching.
 *
 * @module useIntegrations
 *
 * Hooks:
 *   - useApiKeys()          — Manage encrypted API keys
 *   - useFieldMappings()    — Manage integration field mappings
 *   - useActivityLog()      — Query and create activity log entries
 *   - useSystemHealth()     — Monitor integration health status
 */

import { useState, useEffect, useCallback } from 'react';
import {
  saveApiKey,
  getApiKey,
  saveFieldMapping,
  getFieldMappings,
  logActivity,
  getActivityLog,
  getSystemHealth,
} from '../services/integrationsService.js';

// =============================================================================
// useApiKeys
// =============================================================================

/**
 * Hook for managing encrypted API keys stored in Firestore.
 *
 * Provides functions to save and retrieve individual API keys.
 * The `apiKeys` state holds a local cache of retrieved keys keyed by
 * integration name, allowing components to display multiple keys without
 * redundant Firestore reads within the same session.
 *
 * @returns {{
 *   apiKeys: Object.<string, { value: string, label: string, createdAt: any, updatedAt: any, createdBy: string }>,
 *   saveKey: (keyName: string, keyValue: string) => Promise<{ success: boolean, data?: any, error?: string }>,
 *   getKey: (keyName: string) => Promise<{ success: boolean, data?: any, error?: string }>,
 *   loading: boolean,
 *   error: string|null
 * }}
 *
 * @example
 * const { apiKeys, saveKey, getKey, loading, error } = useApiKeys();
 *
 * // Save a new key
 * const result = await saveKey('pointClickCare', 'sk-abc123...');
 *
 * // Retrieve a key (also populates apiKeys cache)
 * const result = await getKey('pointClickCare');
 * console.log(apiKeys.pointClickCare?.value); // decrypted value
 */
export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Saves an encrypted API key to Firestore and updates the local cache.
   *
   * @param {string} keyName - Integration identifier (e.g., "pointClickCare")
   * @param {string} keyValue - Plaintext API key value to encrypt and store
   * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
   */
  const saveKey = useCallback(async (keyName, keyValue) => {
    setLoading(true);
    setError(null);

    try {
      const result = await saveApiKey(keyName, keyValue);

      if (result.success) {
        // Update local cache with the saved key metadata
        setApiKeys((prev) => ({
          ...prev,
          [keyName]: {
            ...prev[keyName],
            ...result.data,
          },
        }));
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const message = `Failed to save API key "${keyName}": ${err.message}`;
      setError(message);
      return { success: false, data: null, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Retrieves and decrypts an API key from Firestore, updating the local cache.
   *
   * @param {string} keyName - Integration identifier to retrieve
   * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
   */
  const getKey = useCallback(async (keyName) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getApiKey(keyName);

      if (result.success) {
        // Update local cache with the retrieved key data
        setApiKeys((prev) => ({
          ...prev,
          [keyName]: result.data,
        }));
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const message = `Failed to retrieve API key "${keyName}": ${err.message}`;
      setError(message);
      return { success: false, data: null, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiKeys, saveKey, getKey, loading, error };
}

// =============================================================================
// useFieldMappings
// =============================================================================

/**
 * Hook for managing integration field mappings.
 *
 * When an `integration` name is provided, the hook automatically fetches
 * the current mappings on mount and whenever the integration name changes.
 * Provides a `saveMappings` function to persist updated mapping arrays.
 *
 * @param {string|null} [integration=null] - Integration name to auto-fetch
 *   mappings for. Pass `null` or omit to skip automatic fetching.
 *
 * @returns {{
 *   mappings: Array<{ sourceField: string, targetField: string, dataType: string, required: boolean, transform: string|null }>,
 *   saveMappings: (integration: string, mappingsArray: Array) => Promise<{ success: boolean, data?: any, error?: string }>,
 *   loading: boolean,
 *   error: string|null
 * }}
 *
 * @example
 * const { mappings, saveMappings, loading, error } = useFieldMappings('pointClickCare');
 *
 * // mappings auto-loaded on mount
 * console.log(mappings);
 *
 * // Save updated mappings
 * await saveMappings('pointClickCare', [
 *   { sourceField: 'resident_id', targetField: 'residentId', dataType: 'string', required: true }
 * ]);
 */
export function useFieldMappings(integration = null) {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches field mappings for the given integration from Firestore.
   * Called automatically when `integration` prop changes.
   */
  useEffect(() => {
    if (!integration) {
      setMappings([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchMappings = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getFieldMappings(integration);

        if (cancelled) return;

        if (result.success) {
          setMappings(result.data?.mappings || []);
        } else {
          setError(result.error);
          setMappings([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Failed to load field mappings for "${integration}": ${err.message}`);
          setMappings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMappings();

    // Cleanup function to prevent state updates after unmount or re-render
    return () => {
      cancelled = true;
    };
  }, [integration]);

  /**
   * Saves a field mapping array for a specific integration to Firestore.
   *
   * @param {string} integrationName - Integration identifier
   * @param {Array<Object>} mappingsArray - Array of mapping objects
   * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
   */
  const saveMappings = useCallback(async (integrationName, mappingsArray) => {
    setLoading(true);
    setError(null);

    try {
      const result = await saveFieldMapping(integrationName, mappingsArray);

      if (result.success) {
        // If saving for the currently-watched integration, update local state
        if (integrationName === integration) {
          setMappings(mappingsArray);
        }
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const message = `Failed to save field mappings for "${integrationName}": ${err.message}`;
      setError(message);
      return { success: false, data: null, error: message };
    } finally {
      setLoading(false);
    }
  }, [integration]);

  return { mappings, saveMappings, loading, error };
}

// =============================================================================
// useActivityLog
// =============================================================================

/**
 * Hook for querying and creating activity log entries.
 *
 * Automatically fetches log entries on mount and whenever the `filters`
 * object changes. Provides a `refresh` callback to manually re-fetch and
 * a `log` helper to create new entries (which also triggers a refresh).
 *
 * @param {Object} [filters={}] - Optional query filters
 * @param {string} [filters.integration] - Filter by integration name
 * @param {string} [filters.eventType] - Filter by event type
 * @param {string} [filters.status] - Filter by status ("success"|"error"|"warning")
 * @param {number} [filters.limit=50] - Maximum entries to return (max 200)
 *
 * @returns {{
 *   logs: Array<Object>,
 *   log: (integration: string, eventType: string, details: string, options?: Object) => Promise<{ success: boolean, data?: any, error?: string }>,
 *   refresh: () => Promise<void>,
 *   loading: boolean,
 *   error: string|null
 * }}
 *
 * @example
 * const { logs, log, refresh, loading, error } = useActivityLog({
 *   integration: 'pointClickCare',
 *   limit: 25
 * });
 *
 * // logs auto-loaded on mount
 * console.log(logs);
 *
 * // Create a new log entry
 * await log('pointClickCare', 'api_key_updated', 'API key rotated by admin');
 *
 * // Manually refresh
 * await refresh();
 */
export function useActivityLog(filters = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Serialise filters to a stable string for useEffect dependency tracking.
  // This prevents infinite re-render loops when a new object reference is
  // passed on each render while the actual filter values haven't changed.
  const filtersKey = JSON.stringify(filters);

  /**
   * Fetches activity log entries from Firestore using current filters.
   */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getActivityLog(filters);

      if (result.success) {
        setLogs(result.data?.entries || []);
      } else {
        setError(result.error);
        setLogs([]);
      }
    } catch (err) {
      setError(`Failed to load activity log: ${err.message}`);
      setLogs([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  /**
   * Auto-fetch logs on mount and when filters change.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getActivityLog(filters);

        if (cancelled) return;

        if (result.success) {
          setLogs(result.data?.entries || []);
        } else {
          setError(result.error);
          setLogs([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Failed to load activity log: ${err.message}`);
          setLogs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  /**
   * Manually refreshes the activity log by re-fetching with current filters.
   * @returns {Promise<void>}
   */
  const refresh = useCallback(async () => {
    await fetchLogs();
  }, [fetchLogs]);

  /**
   * Creates a new activity log entry and refreshes the log list.
   *
   * @param {string} integration - Integration name
   * @param {string} eventType - Event type identifier
   * @param {string} details - Human-readable event description
   * @param {Object} [options] - Optional additional fields
   * @param {string} [options.status="success"] - Event status
   * @param {Object} [options.metadata] - Additional context
   * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
   */
  const log = useCallback(async (integration, eventType, details, options = {}) => {
    setError(null);

    try {
      const result = await logActivity(integration, eventType, details, options);

      if (result.success) {
        // Refresh the log list to include the new entry
        await fetchLogs();
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const message = `Failed to create activity log entry: ${err.message}`;
      setError(message);
      return { success: false, data: null, error: message };
    }
  }, [fetchLogs]);

  return { logs, log, refresh, loading, error };
}

// =============================================================================
// useSystemHealth
// =============================================================================

/**
 * Hook for monitoring integration system health.
 *
 * Automatically fetches the current health status on mount. Provides a
 * `refresh` callback to manually poll for updated status. The `health`
 * object contains per-integration status and the global health indicator.
 *
 * @returns {{
 *   health: {
 *     integrations: Object.<string, {
 *       connected: boolean,
 *       lastSyncAt: any,
 *       lastSyncStatus: string,
 *       lastError: string|null,
 *       lastErrorAt: any|null,
 *       endpoint: string,
 *       version: string,
 *       healthCheckAt: any
 *     }>,
 *     globalHealth: string,
 *     updatedAt: any
 *   } | null,
 *   refresh: () => Promise<void>,
 *   loading: boolean,
 *   error: string|null
 * }}
 *
 * @example
 * const { health, refresh, loading, error } = useSystemHealth();
 *
 * // health auto-loaded on mount
 * if (health) {
 *   console.log(health.globalHealth); // "healthy" | "degraded" | "down"
 *   console.log(health.integrations.pointClickCare?.connected);
 * }
 *
 * // Manually refresh health status
 * await refresh();
 */
export function useSystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches the current system health status from Firestore.
   */
  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSystemHealth();

      if (result.success) {
        setHealth(result.data);
      } else {
        setError(result.error);
        setHealth(null);
      }
    } catch (err) {
      setError(`Failed to load system health: ${err.message}`);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Auto-fetch health status on mount.
   */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getSystemHealth();

        if (cancelled) return;

        if (result.success) {
          setHealth(result.data);
        } else {
          setError(result.error);
          setHealth(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Failed to load system health: ${err.message}`);
          setHealth(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Manually refreshes the system health status.
   * @returns {Promise<void>}
   */
  const refresh = useCallback(async () => {
    await fetchHealth();
  }, [fetchHealth]);

  return { health, refresh, loading, error };
}

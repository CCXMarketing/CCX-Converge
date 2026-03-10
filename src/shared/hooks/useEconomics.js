// =============================================================================
// src/shared/hooks/useEconomics.js
// Module 9 – Economics: React hooks for economics management
// =============================================================================

/**
 * @fileoverview React hooks wrapping economicsService for economics operations.
 *
 * Exports:
 *  - useCommissions(partnerId, options)        — fetch partner commissions, auto-fetches on mount
 *  - useMDFs(partnerId, options)               — fetch partner MDFs, auto-fetches on mount
 *  - usePayouts(partnerId, options)            — fetch partner payouts, auto-fetches on mount
 *  - useRevenueAttributions(partnerId, options)— fetch partner revenue attributions, auto-fetches on mount
 *  - useForecast(partnerId, options)           — fetch partner forecast, auto-fetches on mount
 *  - useEconomicsActions()                     — create/update commissions, MDFs, payouts, attributions, convert currency
 *
 * @returns {Object} Hook state and action callbacks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  convertCurrency,
  createCommission,
  getCommissions,
  updateCommission,
  createMDF,
  getMDFs,
  updateMDF,
  createPayout,
  getPayouts,
  updatePayout,
  createRevenueAttribution,
  getRevenueAttributions,
  getForecast,
} from '../services/economicsService';

// =============================================================================
// useCommissions — Partner commissions with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's commission list.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {string} [options.status] - Filter by commission status
 * @param {number} [options.limit] - Max commissions to return
 * @param {string} [options.sort_dir] - Sort direction for created_at
 * @returns {{
 *   commissions: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useCommissions(partnerId, options = {}) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchCommissions = useCallback(async () => {
    if (!partnerId) {
      setCommissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getCommissions(partnerId, options);
    if (result.success) {
      setCommissions(result.data);
    } else {
      setError(result.error);
      setCommissions([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setCommissions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getCommissions(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setCommissions(result.data);
        } else {
          setError(result.error);
          setCommissions([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchCommissions();
  }, [fetchCommissions]);

  return { commissions, loading, error, refresh };
}

// =============================================================================
// useMDFs — Partner MDFs with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's MDF (Market Development Fund) list.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {string} [options.status] - Filter by MDF status
 * @param {number} [options.limit] - Max MDFs to return
 * @param {string} [options.sort_dir] - Sort direction for created_at
 * @returns {{
 *   mdfs: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useMDFs(partnerId, options = {}) {
  const [mdfs, setMdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchMDFs = useCallback(async () => {
    if (!partnerId) {
      setMdfs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getMDFs(partnerId, options);
    if (result.success) {
      setMdfs(result.data);
    } else {
      setError(result.error);
      setMdfs([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setMdfs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getMDFs(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setMdfs(result.data);
        } else {
          setError(result.error);
          setMdfs([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchMDFs();
  }, [fetchMDFs]);

  return { mdfs, loading, error, refresh };
}

// =============================================================================
// usePayouts — Partner payouts with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's payout list.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {string} [options.status] - Filter by payout status
 * @param {number} [options.limit] - Max payouts to return
 * @param {string} [options.sort_dir] - Sort direction for created_at
 * @returns {{
 *   payouts: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function usePayouts(partnerId, options = {}) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchPayouts = useCallback(async () => {
    if (!partnerId) {
      setPayouts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getPayouts(partnerId, options);
    if (result.success) {
      setPayouts(result.data);
    } else {
      setError(result.error);
      setPayouts([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setPayouts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getPayouts(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setPayouts(result.data);
        } else {
          setError(result.error);
          setPayouts([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchPayouts();
  }, [fetchPayouts]);

  return { payouts, loading, error, refresh };
}

// =============================================================================
// useRevenueAttributions — Partner revenue attributions with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's revenue attribution list.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {number} [options.limit] - Max attributions to return
 * @param {string} [options.sort_dir] - Sort direction for created_at
 * @returns {{
 *   attributions: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useRevenueAttributions(partnerId, options = {}) {
  const [attributions, setAttributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchAttributions = useCallback(async () => {
    if (!partnerId) {
      setAttributions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getRevenueAttributions(partnerId, options);
    if (result.success) {
      setAttributions(result.data);
    } else {
      setError(result.error);
      setAttributions([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setAttributions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getRevenueAttributions(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setAttributions(result.data);
        } else {
          setError(result.error);
          setAttributions([]);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchAttributions();
  }, [fetchAttributions]);

  return { attributions, loading, error, refresh };
}

// =============================================================================
// useForecast — Partner revenue forecast with auto-fetch
// =============================================================================

/**
 * Fetches and manages a partner's revenue forecast.
 *
 * @param {string} partnerId - The partner document ID
 * @param {Object} [options={}] - Optional query options
 * @param {string} [options.currency] - Target currency for forecast values
 * @param {number} [options.exchange_rate] - Custom exchange rate override
 * @returns {{
 *   forecast: Object|null,
 *   loading: boolean,
 *   error: string|null,
 *   refresh: Function
 * }}
 */
export function useForecast(partnerId, options = {}) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const optionsKey = JSON.stringify(options);

  const fetchForecast = useCallback(async () => {
    if (!partnerId) {
      setForecast(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const result = await getForecast(partnerId, options);
    if (result.success) {
      setForecast(result.data);
    } else {
      setError(result.error);
      setForecast(null);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setForecast(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const result = await getForecast(partnerId, options);
      if (!cancelled) {
        if (result.success) {
          setForecast(result.data);
        } else {
          setError(result.error);
          setForecast(null);
        }
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, optionsKey]);

  const refresh = useCallback(() => {
    return fetchForecast();
  }, [fetchForecast]);

  return { forecast, loading, error, refresh };
}

// =============================================================================
// useEconomicsActions — Create/update commissions, MDFs, payouts, attributions, convert currency
// =============================================================================

/**
 * Provides action callbacks for economics CRUD operations.
 *
 * @returns {{
 *   createCommission: Function,
 *   updateCommission: Function,
 *   createMDF: Function,
 *   updateMDF: Function,
 *   createPayout: Function,
 *   updatePayout: Function,
 *   createRevenueAttribution: Function,
 *   convertCurrency: Function,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useEconomicsActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Commissions -----------------------------------------------------------

  const createCommissionAction = useCallback(async (commissionData) => {
    setLoading(true);
    setError(null);
    const result = await createCommission(commissionData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const updateCommissionAction = useCallback(async (commissionId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updateCommission(commissionId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  // --- MDFs ------------------------------------------------------------------

  const createMDFAction = useCallback(async (mdfData) => {
    setLoading(true);
    setError(null);
    const result = await createMDF(mdfData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const updateMDFAction = useCallback(async (mdfId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updateMDF(mdfId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  // --- Payouts ---------------------------------------------------------------

  const createPayoutAction = useCallback(async (payoutData) => {
    setLoading(true);
    setError(null);
    const result = await createPayout(payoutData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  const updatePayoutAction = useCallback(async (payoutId, updates) => {
    setLoading(true);
    setError(null);
    const result = await updatePayout(payoutId, updates);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  // --- Revenue Attributions --------------------------------------------------

  const createRevenueAttributionAction = useCallback(async (attributionData) => {
    setLoading(true);
    setError(null);
    const result = await createRevenueAttribution(attributionData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  // --- Currency Conversion ---------------------------------------------------

  const convertCurrencyAction = useCallback(async (amount, fromCurrency, toCurrency, rate) => {
    setLoading(true);
    setError(null);
    const result = await convertCurrency(amount, fromCurrency, toCurrency, rate);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  }, []);

  return {
    createCommission: createCommissionAction,
    updateCommission: updateCommissionAction,
    createMDF: createMDFAction,
    updateMDF: updateMDFAction,
    createPayout: createPayoutAction,
    updatePayout: updatePayoutAction,
    createRevenueAttribution: createRevenueAttributionAction,
    convertCurrency: convertCurrencyAction,
    loading,
    error,
  };
}
// =============================================================================
// Main Hook - Simplified
// =============================================================================

/**
 * Main hook for economics module
 */
export function useEconomics() {
  // Return empty object for now - components will use placeholder data
  return {
    loading: false,
    error: null
  };
}
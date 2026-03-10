// =============================================================================
// src/shared/hooks/usePartnerHealth.js
// Module 2 – Radar: React hooks for partner health scoring
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  calculateHealthScore,
  calculateDataCompleteness,
} from '../services/partnersService';

export function usePartnerHealth(partnerId) {
  const [healthScore, setHealthScore] = useState(null);
  const [dataCompleteness, setDataCompleteness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    if (!partnerId) {
      setHealthScore(null);
      setDataCompleteness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [scoreResult, completenessResult] = await Promise.all([
      calculateHealthScore(partnerId),
      calculateDataCompleteness(partnerId),
    ]);

    if (scoreResult.success) {
      setHealthScore(scoreResult.data?.health_score ?? null);
    } else {
      setError(scoreResult.error);
      setHealthScore(null);
    }

    if (completenessResult.success) {
      setDataCompleteness(completenessResult.data?.data_completeness ?? null);
    } else {
      if (!scoreResult.success) {
        setError(scoreResult.error);
      } else {
        setError(completenessResult.error);
      }
      setDataCompleteness(null);
    }

    setLoading(false);
  }, [partnerId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!partnerId) {
        setHealthScore(null);
        setDataCompleteness(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const [scoreResult, completenessResult] = await Promise.all([
        calculateHealthScore(partnerId),
        calculateDataCompleteness(partnerId),
      ]);

      if (!cancelled) {
        if (scoreResult.success) {
          setHealthScore(scoreResult.data?.health_score ?? null);
        } else {
          setError(scoreResult.error);
          setHealthScore(null);
        }

        if (completenessResult.success) {
          setDataCompleteness(completenessResult.data?.data_completeness ?? null);
        } else {
          if (!scoreResult.success) {
            setError(scoreResult.error);
          } else {
            setError(completenessResult.error);
          }
          setDataCompleteness(null);
        }

        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [partnerId]);

  const refresh = useCallback(() => {
    return fetchHealth();
  }, [fetchHealth]);

  return { healthScore, dataCompleteness, loading, error, refresh };
}
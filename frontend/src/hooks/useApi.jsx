/**
 * Generic API Hook - CommunityPulse
 * Reusable hook for API calls with loading/error states
 */

import { useState, useCallback } from 'react';

export function useApi(apiFunction, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      setError(err.message);
      if (options.onError) {
        options.onError(err);
      }
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options.onError]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

// Pre-configured API hooks
export const useFeedbackApi = () => useApi(feedbackApi.list);
export const useSubmitFeedback = () => useApi(feedbackApi.submit);
export const useAdminStats = () => useApi(adminApi.getStats);
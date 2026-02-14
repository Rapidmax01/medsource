import { useState, useCallback } from 'react';

/**
 * Generic hook for API requests with loading/error state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(productApi.search);
 *   execute({ q: 'aspirin' });
 */
export default function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err?.error || err?.message || 'Something went wrong';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, execute };
}

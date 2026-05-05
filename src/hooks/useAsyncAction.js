"use client";

import { useCallback, useState } from "react";

export function useAsyncAction(action) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError("");

      try {
        const result = await action(...args);
        setLoading(false);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setLoading(false);
        throw err;
      }
    },
    [action],
  );

  return { run, loading, error, setError };
}


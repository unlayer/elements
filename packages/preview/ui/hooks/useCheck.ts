import { useCallback, useEffect, useRef, useState } from "react";

export interface CheckState<T> {
  /**
   * The report for the current key; while the check runs again for a new key
   * of the same group (the same template, rendered again), the last one.
   */
  report?: T;
  /** Whether `report` is from an earlier render, while the check runs again. */
  stale: boolean;
  loading: boolean;
  error?: string;
  /** Run the check now (or reuse the result for the current key), resolving with its report. */
  run(force?: boolean): Promise<T | undefined>;
}

interface Stored<T> {
  report?: T;
  error?: string;
  key?: string;
  group?: string;
}

/**
 * A check of a render (compatibility, links): for the current `key` (a
 * template and its render) when `active`, or when `run` is called. `group`
 * (the template) decides which earlier report stays shown while it runs again.
 */
export function useCheck<T>(fetcher: () => Promise<T>, key: string | undefined, group: string | undefined, active: boolean): CheckState<T> {
  const [state, setState] = useState<Stored<T>>({});
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const latest = useRef(state);
  latest.current = state;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(
    async (force = false): Promise<T | undefined> => {
      if (!key) return undefined;
      if (!force && latest.current.key === key && latest.current.report !== undefined) return latest.current.report;
      const mine = ++seq.current;
      setLoading(true);
      try {
        const report = await fetcherRef.current();
        if (mine === seq.current) setState({ report, key, group });
        return report;
      } catch (error) {
        if (mine === seq.current) setState({ error: (error as Error).message, key, group });
        return undefined;
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    },
    [key, group]
  );

  useEffect(() => {
    if (active && key && latest.current.key !== key) void run();
  }, [active, key, run]);

  const current = state.key === key;
  const sameGroup = !current && group !== undefined && state.group === group;
  return {
    report: current || sameGroup ? state.report : undefined,
    stale: sameGroup && state.report !== undefined,
    loading,
    error: current ? state.error : undefined,
    run,
  };
}

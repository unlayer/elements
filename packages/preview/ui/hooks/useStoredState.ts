import { useCallback, useState } from "react";

/** State kept across reloads for this browser (view, width, dark mode), when storage is available. */
export function useStoredState<T>(key: string, initial: T, valid?: (value: unknown) => boolean): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(`elements-preview:${key}`);
      if (stored === null) return initial;
      const parsed = JSON.parse(stored) as unknown;
      return valid && !valid(parsed) ? initial : (parsed as T);
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(`elements-preview:${key}`, JSON.stringify(next));
      } catch {
        // Storage blocked: the setting lasts until the page reloads.
      }
    },
    [key]
  );
  return [value, set];
}

/** A validator for useStoredState: one of `options`. */
export function oneOf<T>(options: readonly T[]): (value: unknown) => boolean {
  return (value) => options.includes(value as T);
}

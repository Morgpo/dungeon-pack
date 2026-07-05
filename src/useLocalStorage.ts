import { useEffect, useState } from 'react';

/**
 * State that persists to localStorage. `initial` may be a value or a lazy
 * factory (evaluated only when nothing is stored yet).
 */
export function useLocalStorage<T>(
  key: string,
  initial: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      // fall through to the initial value on parse/storage errors
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage may be unavailable (private mode, quota) — ignore
    }
  }, [key, value]);

  return [value, setValue];
}

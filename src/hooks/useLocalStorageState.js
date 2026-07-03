import { useState } from 'react';

// Drop-in replacement for useState that persists the value to localStorage,
// so view preferences (calendar mode, filter toggles, etc.) survive a reload.
export default function useLocalStorageState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  function setPersisted(next) {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // ignore write errors (e.g. private browsing storage limits)
      }
      return resolved;
    });
  }

  return [value, setPersisted];
}

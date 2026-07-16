import { useMemo } from 'react';
import useLocalStorageState from './useLocalStorageState';

// Sets don't survive JSON.stringify/parse — persist as an array and rehydrate a Set.
// A persisted id that no longer exists (e.g. a deleted group) is harmless — it just
// matches nothing. Mirrors useLocalStorageState's updater API.
export default function useLocalStorageSet(key, defaultValue = []) {
  const [arr, setArr] = useLocalStorageState(key, defaultValue);
  // Stable object identity across renders where the array hasn't changed, so
  // consumers' useMemo deps on the returned Set behave as expected.
  const set = useMemo(() => new Set(arr), [arr]);

  function setSet(next) {
    setArr((prevArr) => {
      const resolved = typeof next === 'function' ? next(new Set(prevArr)) : next;
      return [...resolved];
    });
  }

  return [set, setSet];
}

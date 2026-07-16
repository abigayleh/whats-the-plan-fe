import { useMemo } from 'react';
import useLocalStorageState from './useLocalStorageState';

// Date objects don't survive JSON.stringify/parse — persist the timestamp instead
// and rehydrate a Date on read/write. Mirrors useLocalStorageState's updater API.
export default function useLocalStorageDate(key, defaultDate) {
  const [time, setTime] = useLocalStorageState(key, defaultDate.getTime());
  // Stable object identity across renders where the timestamp hasn't changed,
  // so consumers' useMemo/useEffect deps on the returned Date behave as expected.
  const date = useMemo(() => new Date(time), [time]);

  function setDate(next) {
    setTime((prevTime) => {
      const resolved = typeof next === 'function' ? next(new Date(prevTime)) : next;
      return resolved.getTime();
    });
  }

  return [date, setDate];
}

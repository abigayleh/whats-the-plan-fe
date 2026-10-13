import { useEffect, useRef } from 'react';
import { isSameDay } from '../utils/date';

// Calls back when the tab is returned to on a different day than it was left — a tab left
// open overnight would otherwise keep treating yesterday as "now". Same-day returns stay quiet.
export default function useDayChange(onDayChange) {
  const fnRef = useRef(onDayChange);
  useEffect(() => { fnRef.current = onDayChange; });

  useEffect(() => {
    // When the current absence began. Hidden and blurred count as one absence: a background
    // window can flicker hidden/visible on a screen lock without anyone having come back.
    let leftAt = null;
    let blurred = false;
    const sync = () => {
      const now = new Date();
      if (blurred || document.visibilityState !== 'visible') {
        leftAt ??= now;
        return;
      }
      if (leftAt && !isSameDay(leftAt, now)) fnRef.current(now);
      leftAt = null;
    };
    const onFocus = () => { blurred = false; sync(); };
    const onBlur = () => { blurred = true; sync(); };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);
}

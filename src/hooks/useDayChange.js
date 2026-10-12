import { useEffect, useRef } from 'react';
import { isSameDay } from '../utils/date';

// Calls back when the tab is returned to on a different day than it was left — a tab left
// open overnight would otherwise keep treating yesterday as "now". Same-day returns stay quiet.
export default function useDayChange(onDayChange) {
  const fnRef = useRef(onDayChange);
  useEffect(() => { fnRef.current = onDayChange; });

  useEffect(() => {
    let lastSeen = new Date();
    const leave = () => { lastSeen = new Date(); };
    const comeBack = () => {
      const now = new Date();
      if (!isSameDay(lastSeen, now)) fnRef.current(now);
      lastSeen = now;
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? comeBack() : leave());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', comeBack);
    window.addEventListener('blur', leave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', comeBack);
      window.removeEventListener('blur', leave);
    };
  }, []);
}

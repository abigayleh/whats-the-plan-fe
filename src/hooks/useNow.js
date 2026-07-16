import { useState, useEffect } from 'react';

// Ticks a shared `Date` once a minute — used for the calendar's now-line and past-event fade.
export default function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  return now;
}

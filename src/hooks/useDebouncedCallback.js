import { useRef, useEffect, useCallback } from 'react';

// Debounces a callback; `flush` runs any pending call immediately (used on blur/unmount).
export default function useDebouncedCallback(fn, delay) {
  const timer = useRef(null);
  const pending = useRef(null);
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });

  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (pending.current) {
      const args = pending.current;
      pending.current = null;
      fnRef.current(...args);
    }
  }, []);

  const debounced = useCallback((...args) => {
    pending.current = args;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, delay);
  }, [delay, flush]);

  useEffect(() => flush, [flush]); // flush a pending save when the component unmounts

  return [debounced, flush];
}

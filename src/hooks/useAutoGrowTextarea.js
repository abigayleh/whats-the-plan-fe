import { useLayoutEffect, useRef } from 'react';

// Grows a textarea to fit its content so long text shows without manual dragging.
export default function useAutoGrowTextarea(value) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}

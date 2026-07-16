import { useCallback, useRef } from 'react';
import useLocalStorageState from './useLocalStorageState';

const MIN_WIDTH = 260;
const MAX_WIDTH = 640;

// Drag-to-resize for a two-pane split where the right pane has a fixed px width and the
// left pane flexes to fill the rest. `containerRef` must be attached to the split's grid
// wrapper so width can be measured from its right edge. Persists the chosen width.
export default function useResizableSplit(key, defaultWidth) {
  const [width, setWidth] = useLocalStorageState(key, defaultWidth);
  const containerRef = useRef(null);

  const startResize = useCallback((e) => {
    e.preventDefault();
    function onMove(moveEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, rect.right - moveEvent.clientX));
      setWidth(next);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [setWidth]);

  return { containerRef, width, startResize };
}

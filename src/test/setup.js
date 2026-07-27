import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom does no layout, so it ships no Range measurement — which ProseMirror calls
// whenever it maps a document position back to screen coordinates.
const emptyRect = () => ({
  x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}),
});
Range.prototype.getClientRects = () => [];
Range.prototype.getBoundingClientRect = emptyRect;

// Unmount and clear the DOM between tests so they stay isolated.
afterEach(() => {
  cleanup();
});
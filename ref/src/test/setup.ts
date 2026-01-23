/**
 * Test Setup
 * Global configuration for Vitest tests
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers with jest-dom
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Three.js canvas context
// @ts-ignore - Mocking for tests
HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ 
    data: new Uint8ClampedArray(0),
    width: 0,
    height: 0,
    colorSpace: 'srgb'
  }),
  putImageData: () => {},
  createImageData: () => ({
    data: new Uint8ClampedArray(0),
    width: 0,
    height: 0,
    colorSpace: 'srgb'
  }),
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ 
    width: 0,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 0,
    fontBoundingBoxAscent: 0,
    fontBoundingBoxDescent: 0,
    alphabeticBaseline: 0,
    hangingBaseline: 0,
    ideographicBaseline: 0,
    emHeightAscent: 0,
    emHeightDescent: 0
  }),
  transform: () => {},
  rect: () => {},
  clip: () => {}
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
});

// Suppress console errors in tests (optional)
globalThis.console = {
  ...console,
  error: (...args: any[]) => {
    // Filter out expected React Three Fiber warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement'))
    ) {
      return;
    }
    console.error(...args);
  }
};

// Suppress ParticleBackground side effects in tests
// Native jsdom in Jest 30 provides fetch; individual tests mock it explicitly.
// Removed legacy node-fetch polyfill for leaner dependency surface.

// Stub HTMLMediaElement methods (audio) for jsdom which lacks media implementation
if (typeof HTMLMediaElement !== 'undefined') {
  const proto = HTMLMediaElement.prototype;
  if (!proto.play) proto.play = () => Promise.resolve();
  if (!proto.pause) proto.pause = () => {};
  if (!proto.load) proto.load = () => {};
}

// Provide a minimal fetch stub if not already defined (tests override as needed)
if (typeof global.fetch === 'undefined') {
  global.fetch = function () { return Promise.resolve({ ok: true, status: 200, json: async () => ({}), text: async () => '', blob: async () => new Blob(), headers: new Headers() }); };
}

// Mock canvas.getContext for React components using <canvas>
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
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
      measureText: () => ({ width: 0 }),
      setLineDash: () => {},
      getLineDash: () => [],
      font: '',
      strokeStyle: '',
      fillStyle: '',
      globalAlpha: 1,
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      shadowBlur: 0,
      shadowColor: '',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textAlign: 'start',
      textBaseline: 'alphabetic',
    };
  };
}
// Polyfill TextDecoder for jsPDF and other libraries
if (typeof global.TextDecoder === 'undefined') {
  const { TextDecoder } = require('util');
  global.TextDecoder = TextDecoder;
}

// Mock Vite's import.meta.env for Jest
globalThis.importMeta = { env: { VITE_API_URL: 'http://localhost:8000' } };
Object.defineProperty(globalThis, 'import', {
  value: { meta: globalThis.importMeta },
  writable: true,
});

// Polyfill TextEncoder for jsPDF and other libraries
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}

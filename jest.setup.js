require('@testing-library/jest-dom');

const { Request, Response } = require('undici');

// Polyfill global Request and Response for tests
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = Request as any;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = Response as any;
}

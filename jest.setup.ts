const { TextEncoder, TextDecoder } = require('util');
// Polyfill ReadableStream for undici
require('web-streams-polyfill');

// Polyfill TextEncoder and TextDecoder
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill MessagePort (basic mock)
if (typeof globalThis.MessagePort === 'undefined') {
  globalThis.MessagePort = class MessagePort {};
}

require('@testing-library/jest-dom');

const { Request, Response } = require('undici');

// Polyfill global Request and Response for tests
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = Request as any;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = Response as any;
}

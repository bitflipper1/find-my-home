const test = require('node:test');
const assert = require('node:assert/strict');
const { configuredCorsOrigins, isLoopbackAddress } = require('../src/privacy');

test('loopback check accepts local addresses and rejects remote addresses', () => {
  assert.equal(isLoopbackAddress('127.0.0.1'), true);
  assert.equal(isLoopbackAddress('::1'), true);
  assert.equal(isLoopbackAddress('::ffff:127.0.0.1'), true);
  assert.equal(isLoopbackAddress('192.168.1.20'), false);
});

test('CORS defaults are limited to local Vite origins', () => {
  const previous = process.env.CORS_ORIGINS;
  delete process.env.CORS_ORIGINS;
  assert.deepEqual(configuredCorsOrigins(), [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);
  if (previous === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = previous;
});

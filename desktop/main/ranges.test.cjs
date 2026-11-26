// @ts-check
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { parseRange, upstreamRequest } = require('./ranges.cjs');

describe('parseRange', () => {
  it('serves the whole file (capped) without a Range header', () => {
    assert.deepEqual(parseRange(null, 1000, 300), { start: 0, end: 299 });
    assert.deepEqual(parseRange(null, 100, 300), { start: 0, end: 99 });
  });

  it('handles open, closed and suffix ranges', () => {
    assert.deepEqual(parseRange('bytes=500-', 1000, 300), { start: 500, end: 799 });
    assert.deepEqual(parseRange('bytes=10-19', 1000, 300), { start: 10, end: 19 });
    assert.deepEqual(parseRange('bytes=900-5000', 1000, 300), { start: 900, end: 999 });
    assert.deepEqual(parseRange('bytes=-100', 1000, 300), { start: 900, end: 999 });
  });

  it('rejects ranges outside the file', () => {
    assert.equal(parseRange('bytes=1000-', 1000), null);
    assert.equal(parseRange('bytes=20-10', 1000), null);
  });
});

describe('upstreamRequest', () => {
  it('uses the Range header or the range query parameter', () => {
    assert.deepEqual(upstreamRequest('https://x/v?a=1', { start: 1, end: 9 }, 'header'), {
      url: 'https://x/v?a=1',
      headers: { Range: 'bytes=1-9' },
    });
    assert.deepEqual(upstreamRequest('https://x/v?a=1', { start: 1, end: 9 }, 'query'), {
      url: 'https://x/v?a=1&range=1-9',
      headers: {},
    });
  });
});

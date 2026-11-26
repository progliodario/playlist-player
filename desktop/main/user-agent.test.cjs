// @ts-check
const assert = require('node:assert/strict');
const { it } = require('node:test');
const { chromeUserAgent } = require('./user-agent.cjs');

it('builds a plain Chrome User-Agent with the major version only', () => {
  assert.equal(
    chromeUserAgent('156.0.8078.109'),
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
  );
});

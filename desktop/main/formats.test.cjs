// @ts-check
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { isVideoId, pickStreams, rangeStyleFor } = require('./formats.cjs');

const NOW = Date.UTC(2026, 10, 26);
const expire = Math.floor(NOW / 1000) + 6 * 3600;
/** @param {string} client @param {number} [clen] */
const url = (client, clen = 3000) =>
  `https://rr1.googlevideo.com/videoplayback?expire=${expire}&c=${client}&clen=${clen}&itag=1`;

describe('pickStreams', () => {
  it('takes the best audio-only https stream and the HLS manifest', () => {
    const result = pickStreams(
      {
        title: 'Song',
        duration: 181,
        http_headers: { 'User-Agent': 'Mozilla/5.0 Test' },
        formats: [
          {
            format_id: '139',
            protocol: 'https',
            vcodec: 'none',
            acodec: 'mp4a',
            abr: 48,
            ext: 'm4a',
            url: url('VISIONOS'),
          },
          {
            format_id: '251',
            protocol: 'https',
            vcodec: 'none',
            acodec: 'opus',
            abr: 160,
            ext: 'webm',
            url: url('VISIONOS', 5000),
            filesize: 4999,
          },
          {
            format_id: '18',
            protocol: 'https',
            vcodec: 'avc1',
            acodec: 'mp4a',
            abr: 96,
            ext: 'mp4',
            url: url('VISIONOS'),
          },
          {
            format_id: '233',
            protocol: 'm3u8_native',
            vcodec: 'none',
            acodec: 'mp4a',
            manifest_url: 'https://manifest.googlevideo.com/x.m3u8',
          },
        ],
      },
      NOW,
    );
    assert.ok(result);
    assert.equal(result.audio.mime, 'audio/webm');
    assert.equal(result.audio.size, 4999);
    assert.equal(result.audio.rangeStyle, 'header');
    assert.equal(result.hlsUrl, 'https://manifest.googlevideo.com/x.m3u8');
    assert.equal(result.durationSeconds, 181);
    assert.equal(result.userAgent, 'Mozilla/5.0 Test');
    assert.equal(result.expiresAt, expire * 1000 - 30 * 60 * 1000);
  });

  it('uses the clen parameter when the size is missing', () => {
    const result = pickStreams(
      {
        formats: [
          {
            protocol: 'https',
            vcodec: 'none',
            acodec: 'mp4a',
            ext: 'm4a',
            url: url('TVHTML5', 1234),
          },
        ],
      },
      NOW,
    );
    assert.equal(result?.audio.size, 1234);
    assert.equal(result?.audio.mime, 'audio/mp4');
    assert.equal(result?.audio.rangeStyle, 'query');
    assert.equal(result?.hlsUrl, null);
  });

  it('returns null without audio', () => {
    assert.equal(
      pickStreams({ formats: [{ protocol: 'm3u8_native', vcodec: 'avc1', acodec: 'none' }] }, NOW),
      null,
    );
    assert.equal(pickStreams({}, NOW), null);
  });
});

describe('rangeStyleFor', () => {
  it('uses the query parameter only for TV clients', () => {
    assert.equal(rangeStyleFor('TVHTML5'), 'query');
    assert.equal(rangeStyleFor('VISIONOS'), 'header');
    assert.equal(rangeStyleFor(''), 'header');
  });
});

describe('isVideoId', () => {
  it('accepts only 11-character YouTube ids', () => {
    assert.equal(isVideoId('dQw4w9WgXcQ'), true);
    assert.equal(isVideoId('a-b_c'), false);
    assert.equal(isVideoId('../../etc/x'), false);
    assert.equal(isVideoId(42), false);
  });
});

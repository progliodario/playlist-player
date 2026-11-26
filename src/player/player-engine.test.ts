import { describe, expect, it } from 'vitest';
import { choosePlaybackTarget } from './player-engine.ts';

describe('choosePlaybackTarget', () => {
  it('always uses the YouTube player in a browser', () => {
    expect(choosePlaybackTarget('web', 'ad-free')).toBe('youtube');
    expect(choosePlaybackTarget('web', 'youtube')).toBe('youtube');
  });

  it('uses the native players inside the apps unless the user picks YouTube', () => {
    expect(choosePlaybackTarget('android', 'ad-free')).toBe('android');
    expect(choosePlaybackTarget('desktop', 'ad-free')).toBe('stream');
    expect(choosePlaybackTarget('android', 'youtube')).toBe('youtube');
    expect(choosePlaybackTarget('desktop', 'youtube')).toBe('youtube');
  });
});

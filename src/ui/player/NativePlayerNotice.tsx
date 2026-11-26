import { useStrings } from '../../i18n/index.ts';
import { openAndroidPlayer } from '../../platform/android-player.ts';
import { Icon } from '../icons.tsx';

/**
 * Shown instead of the web player controls inside the Android app, where the native
 * player (no ads, screen off) does the playing. See src/player/player-engine.ts.
 */
export function NativePlayerNotice() {
  const t = useStrings();
  return (
    <div className="native-player-notice">
      <p className="native-player-notice__hint">{t.player.nativeHint}</p>
      <button type="button" className="button button--primary" onClick={openAndroidPlayer}>
        <Icon name="headphones" size={18} /> {t.player.openNativePlayer}
      </button>
    </div>
  );
}

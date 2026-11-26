import { useEffect, useRef, useState, type FormEvent } from 'react';
import { addPlaylistFromLink } from '../../app/actions.ts';
import { navigate } from '../../app/router.ts';
import { useStrings } from '../../i18n/index.ts';
import { showToast } from '../../state/toast-store.ts';

/** Modal to add a playlist by link (source "manual"). */
export function AddPlaylistDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useStrings();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setValue('');
      setError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await addPlaylistFromLink(value);
    setBusy(false);
    if (!result.ok) {
      setError(result.reason === 'invalid' ? t.addPlaylist.invalidLink : t.addPlaylist.notFound);
      return;
    }
    showToast(t.addPlaylist.added(result.title), 'success');
    onClose();
    navigate({ name: 'playlist', key: result.key });
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onClose={onClose}
      aria-labelledby="add-playlist-title"
      aria-describedby="add-playlist-description"
    >
      <form onSubmit={onSubmit} className="dialog__body" noValidate>
        <h2 id="add-playlist-title">{t.addPlaylist.title}</h2>
        <p id="add-playlist-description" className="muted">
          {t.addPlaylist.description}
        </p>
        <label htmlFor="add-playlist-link" className="field-label">
          {t.addPlaylist.fieldLabel}
        </label>
        <input
          id="add-playlist-link"
          className="text-input"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          required
          value={value}
          placeholder={t.addPlaylist.placeholder}
          aria-describedby={
            error ? 'add-playlist-description add-playlist-error' : 'add-playlist-description'
          }
          aria-invalid={error ? true : undefined}
          onChange={(event) => setValue(event.target.value)}
        />
        {error && (
          <p id="add-playlist-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            {t.common.cancel}
          </button>
          <button type="submit" className="button button--primary" disabled={busy || !value.trim()}>
            {busy ? t.addPlaylist.checking : t.addPlaylist.submit}
          </button>
        </div>
      </form>
    </dialog>
  );
}

import { useId } from 'react';
import { useStrings } from '../../i18n/index.ts';
import { Icon } from '../icons.tsx';

/** Search box with a visible magnifier and an accessible "clear" button. */
export function SearchField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Used both as accessible name and as placeholder. */
  label: string;
}) {
  const t = useStrings();
  const id = useId();
  return (
    <div className="search-field" role="search">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Icon name="search" size={18} />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={label}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className="icon-button icon-button--small"
          aria-label={t.common.clearSearch}
          onClick={() => onChange('')}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

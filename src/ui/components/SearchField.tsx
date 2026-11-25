import { Icon } from '../icons.tsx';

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-field">
      <Icon name="search" size={18} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className="icon-button icon-button--small"
          onClick={() => onChange('')}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </label>
  );
}

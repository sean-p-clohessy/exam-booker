import type { Field } from '../config/fields';
export function FieldInput({
  field,
  id,
  value,
  onChange,
  error,
}: {
  field: Field;
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const common = {
    id,
    name: id,
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    'aria-invalid': !!error,
    'aria-required': field.required || undefined,
    'aria-describedby': error ? `${id}-error` : field.hint ? `${id}-hint` : undefined,
    autoComplete: 'off',
  };
  return (
    <div className={`field ${field.type === 'textarea' ? 'full-width' : ''}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="required"> *</span>}
      </label>
      {field.type === 'textarea' ? (
        <textarea {...common} rows={2} />
      ) : field.type === 'select' ? (
        <select {...common}>
          <option value="">Select…</option>
          {field.options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input {...common} type={field.type ?? 'text'} />
      )}
      {field.hint && <small id={`${id}-hint`}>{field.hint}</small>}
      {error && (
        <small className="error-text" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}

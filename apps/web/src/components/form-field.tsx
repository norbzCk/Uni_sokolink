import { useId, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, error, hint, id, ...inputProps }: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? fieldId + '-hint' : undefined;
  const errorId = error ? fieldId + '-error' : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <input
        {...inputProps}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </label>
  );
}

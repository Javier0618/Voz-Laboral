import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
}

function describedBy(hintId: string, errorId: string, hint?: ReactNode, error?: string) {
  return [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
}

function Label({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {label}
      {optional && <span className="font-normal text-muted"> (opcional)</span>}
    </label>
  );
}

export function TextField({ label, hint, error, optional, id, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div>
      <Label htmlFor={fid} label={label} optional={optional} />
      <input
        id={fid}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(`${fid}-hint`, `${fid}-error`, hint, error)}
        {...props}
      />
      {hint && <p id={`${fid}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${fid}-error`} className="field-error">{error}</p>}
    </div>
  );
}

export function TextArea({ label, hint, error, optional, id, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div>
      <Label htmlFor={fid} label={label} optional={optional} />
      <textarea
        id={fid}
        className="input min-h-40 font-serif text-lg leading-relaxed"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(`${fid}-hint`, `${fid}-error`, hint, error)}
        {...props}
      />
      {hint && <div id={`${fid}-hint`} className="field-hint">{hint}</div>}
      {error && <p id={`${fid}-error`} className="field-error">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  id,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div>
      <Label htmlFor={fid} label={label} optional={optional} />
      <select
        id={fid}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(`${fid}-hint`, `${fid}-error`, hint, error)}
        {...props}
      >
        {children}
      </select>
      {hint && <p id={`${fid}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${fid}-error`} className="field-error">{error}</p>}
    </div>
  );
}

export function Checkbox({
  label,
  hint,
  error,
  id,
  ...props
}: Omit<BaseProps, 'optional'> & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={fid}
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-action"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(`${fid}-hint`, `${fid}-error`, hint, error)}
          {...props}
        />
        <label htmlFor={fid} className="text-ink">
          {label}
        </label>
      </div>
      {hint && <p id={`${fid}-hint`} className="field-hint ml-8">{hint}</p>}
      {error && <p id={`${fid}-error`} className="field-error ml-8">{error}</p>}
    </div>
  );
}

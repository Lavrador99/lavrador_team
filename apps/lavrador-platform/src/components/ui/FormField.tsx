import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { INPUT_CLS, TEXTAREA_CLS, SELECT_CLS } from '../../lib/constants/styles';

interface FieldWrapProps {
  label: string;
  children: ReactNode;
  error?: string;
}

export function FieldWrap({ label, children, error }: FieldWrapProps) {
  return (
    <div>
      <label className="label-category block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-error font-label font-bold mt-1">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: ReactNode };
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string };

export function InputField({ label, error, className, ...rest }: InputProps) {
  return (
    <FieldWrap label={label} error={error}>
      <input className={`${INPUT_CLS} ${className ?? ''}`} {...rest} />
    </FieldWrap>
  );
}

export function SelectField({ label, error, children, className, ...rest }: SelectProps) {
  return (
    <FieldWrap label={label} error={error}>
      <select className={`${INPUT_CLS} ${className ?? ''}`} {...rest}>{children}</select>
    </FieldWrap>
  );
}

export function TextareaField({ label, error, className, rows = 3, ...rest }: TextareaProps) {
  return (
    <FieldWrap label={label} error={error}>
      <textarea className={`${TEXTAREA_CLS} ${className ?? ''}`} rows={rows} {...rest} />
    </FieldWrap>
  );
}

export { INPUT_CLS, SELECT_CLS };

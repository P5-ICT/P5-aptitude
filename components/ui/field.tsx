import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ label, error, id, className = "", ...props }: FieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="text-sm font-medium text-p5-ink">{label}</span>
      <input
        id={fieldId}
        className={`focus-ring mt-1.5 w-full rounded border border-p5-border bg-p5-surface px-4 py-2.5 text-p5-ink placeholder:text-p5-muted transition-colors focus:border-p5-teal ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}

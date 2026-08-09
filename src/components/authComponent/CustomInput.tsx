import type { InputHTMLAttributes, ReactNode } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
  rightSlot?: ReactNode;
}

export function CustomInput({
  label,
  icon,
  error,
  rightSlot,
  id,
  ...inputProps
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`border-border bg-surface text-ink placeholder:text-ink-muted focus:border-accent w-full rounded-md border py-2.5 text-sm focus:outline-none disabled:opacity-60 ${
            icon ? "pl-9" : "pl-3"
          } ${rightSlot ? "pr-10" : "pr-3"} ${error ? "border-warn-fg" : ""}`}
          {...inputProps}
        />
        {rightSlot && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2">
            {rightSlot}
          </span>
        )}
      </div>
      {error && <p className="text-warn-fg text-xs">{error}</p>}
    </div>
  );
}

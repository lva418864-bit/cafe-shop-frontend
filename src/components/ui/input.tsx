import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * label/error/hint are optional so this can be used bare inside a custom
 * layout too - but pass `label` + `error` and React Hook Form's
 * `formState.errors[field]?.message` slots straight in for the common case.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            'border-border bg-surface text-foreground h-10 w-full rounded-md border px-3 text-sm',
            'placeholder:text-foreground/40',
            'focus-visible:ring-roast-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-brick-500 focus-visible:ring-brick-500',
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-brick-600 text-xs">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-foreground/50 text-xs">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };

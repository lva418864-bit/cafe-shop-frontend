import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && <Label htmlFor={textareaId}>{label}</Label>}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            'border-border bg-surface text-foreground min-h-24 w-full rounded-md border px-3 py-2 text-base md:text-sm',
            'placeholder:text-foreground/40',
            'focus-visible:ring-roast-500 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-brick-500 focus-visible:ring-brick-500',
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="text-brick-600 text-xs">
            {error}
          </p>
        ) : hint ? (
          <p id={`${textareaId}-hint`} className="text-foreground/50 text-xs">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };

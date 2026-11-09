import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SpinnerProps {
  className?: string;
  label?: string;
}

/**
 * Inline loading indicator - for full-section loading states, wrap this in
 * a container with padding rather than styling the spinner itself bigger.
 */
export function Spinner({ className, label = 'Loading' }: SpinnerProps) {
  return (
    <div className="text-foreground/50 flex items-center justify-center gap-2 py-8" role="status">
      <Loader2 className={cn('h-5 w-5 animate-spin', className)} aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

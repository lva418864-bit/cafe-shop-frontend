import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * `description` should be the message extracted by the axios response
 * interceptor (Step 5) - either the backend's ApiResponse.message for
 * custom errors, or a summarized 422 validation message.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12 text-center', className)}>
      <AlertTriangle className="text-brick-500 h-10 w-10" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-foreground font-medium">{title}</p>
        <p className="text-foreground/60 text-sm">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

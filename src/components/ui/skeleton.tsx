import { cn } from '@/lib/utils';

/**
 * Use this for table rows / cards while data is loading, instead of a
 * centered Spinner, whenever the final layout shape is already known -
 * it reduces perceived load time and layout shift.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-roast-100 dark:bg-roast-900/40 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };

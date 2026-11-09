import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Not in the original spec's component list, but needed as soon as any
 * table renders order status, payment status, or user role - added here
 * rather than reinvented per-feature.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'bg-roast-100 text-roast-800 dark:bg-roast-900/50 dark:text-roast-200',
        success: 'bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        destructive: 'bg-brick-100 text-brick-700 dark:bg-brick-900/30 dark:text-brick-300',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

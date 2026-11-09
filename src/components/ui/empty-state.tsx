import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-12 text-center', className)}>
      <Icon className="text-foreground/30 h-10 w-10" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-foreground font-medium">{title}</p>
        {description && <p className="text-foreground/60 text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

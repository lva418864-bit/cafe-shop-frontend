import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-foreground/60 text-sm">{label}</p>
          <p
            className={cn(
              'text-foreground mt-1 font-mono text-2xl',
              !value && 'text-foreground/30',
            )}
          >
            {value || '—'}
          </p>
        </div>
        {Icon && (
          <span className="bg-roast-100 text-roast-700 dark:bg-roast-900/50 dark:text-roast-200 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}

import type { ReactNode } from 'react';

import { Breadcrumb, type BreadcrumbItem } from '@/components/layout/breadcrumb';

export interface PageHeaderProps {
  title: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
}

/**
 * Every list/detail page in Step 7 starts with this - keeps title +
 * breadcrumb + primary action button placement consistent everywhere.
 */
export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <h1 className="font-display text-foreground text-2xl">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

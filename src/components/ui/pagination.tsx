'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { PageMeta } from '@/types/api';

export interface PaginationProps extends PageMeta {
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Extends PageMeta directly - { page, page_size, total_items, total_pages }
 * - so callers can spread the backend's meta straight in:
 * <Pagination {...meta} onPageChange={setPage} />
 */
export function Pagination({
  page,
  total_pages,
  total_items,
  page_size,
  onPageChange,
  className,
}: PaginationProps) {
  if (total_pages <= 1) return null;

  const firstItem = (page - 1) * page_size + 1;
  const lastItem = Math.min(page * page_size, total_items);

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <p className="text-foreground/60 text-sm">
        Showing <span className="font-mono">{firstItem}</span>-
        <span className="font-mono">{lastItem}</span> of{' '}
        <span className="font-mono">{total_items}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-foreground/70 text-sm">
          Page <span className="font-mono">{page}</span> of{' '}
          <span className="font-mono">{total_pages}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

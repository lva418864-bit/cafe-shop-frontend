'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { useUiStore } from '@/store/uiStore';
import type { Role } from '@/types/enums';

export interface SidebarProps {
  /** Filters nav items by allowedRoles. Undefined = show only public items. */
  role?: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const closeSidebar = useUiStore((s) => s.closeSidebar);

  const items = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || hasAnyRole(role, item.allowedRoles),
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'border-border bg-surface fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-border flex h-16 items-center justify-between border-b px-4">
          <span className="font-display text-foreground text-lg">Coffee Shop</span>
          <button
            onClick={closeSidebar}
            className="text-foreground/60 hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-roast-600 text-white'
                    : 'text-foreground/70 hover:bg-roast-50 hover:text-foreground dark:hover:bg-roast-900/40',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

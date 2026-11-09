'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, LogOut, Menu, Moon, Search, ShoppingCart, Sun, User as UserIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CartDialog } from '@/features/cart/components/cart-dialog';
import { NAV_ITEMS, ROUTES } from '@/constants/routes';
import { hasAnyRole } from '@/constants/roles';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useUiStore } from '@/store/uiStore';
import type { Role } from '@/types/enums';
import { buildLoginUrl } from '@/utils/safeNextPath';

export interface NavbarProps {
  userName?: string;
  userRole?: string;
  profileHref?: string;
  ordersHref?: string;
  onLogout?: () => void;
  navRole?: Role;
}

export function Navbar({
  userName,
  userRole,
  profileHref,
  ordersHref,
  onLogout,
  navRole,
}: NavbarProps) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const pathname = usePathname();
  const router = useRouter();

  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const [cartOpen, setCartOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      setSearchQuery(sp.get('q') || '');
    }
  }, [pathname]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(ROUTES.PRODUCTS);
    }
  };

  const isStaff = hasAnyRole(navRole, ['admin', 'staff']);
  const isCustomerOrGuest = !isStaff;
  const isAuthenticated = Boolean(userName);

  const navItems = isCustomerOrGuest
    ? NAV_ITEMS.filter(
        (item) =>
          (!item.allowedRoles || (navRole && hasAnyRole(navRole, item.allowedRoles))) &&
          item.customerVisible !== false,
      )
    : [];

  return (
    <header className="border-border bg-surface border-b">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {isCustomerOrGuest ? (
          <Link href={ROUTES.PRODUCTS} className="font-display text-foreground shrink-0 text-lg">
            <span className="sm:hidden">Coffee</span>
            <span className="hidden sm:inline">Coffee Shop</span>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {isCustomerOrGuest ? (
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-roast-600 text-white'
                      : 'text-foreground/70 hover:bg-roast-50 hover:text-foreground dark:hover:bg-roast-900/40',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="hidden flex-1 md:block" />
        )}

        <div className="mr-2 ml-auto max-w-sm flex-1">
          <form onSubmit={handleSearch} className="relative">
            <Search className="text-foreground/50 absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search products..."
              className="bg-background h-9 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isCustomerOrGuest && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="bg-brick-500 absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-medium text-white">
                  {cartCount}
                </span>
              )}
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <span className="bg-roast-100 text-roast-700 dark:bg-roast-900/50 dark:text-roast-200 flex h-7 w-7 items-center justify-center rounded-full">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <span className="hidden text-sm sm:inline">{userName ?? 'Account'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {userRole ? `Signed in as ${userRole}` : 'Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profileHref && (
                  <DropdownMenuItem asChild>
                    <Link href={profileHref}>My Profile</Link>
                  </DropdownMenuItem>
                )}
                {ordersHref && (
                  <DropdownMenuItem asChild>
                    <Link href={ordersHref}>My Orders</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={buildLoginUrl(pathname)}>
                <LogIn className="h-4 w-4" />
                <span>Log in to order</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isCustomerOrGuest && <CartDialog open={cartOpen} onOpenChange={setCartOpen} />}
    </header>
  );
}

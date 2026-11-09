import { Coffee, LayoutDashboard, ShoppingCart, Users, type LucideIcon } from 'lucide-react';

import type { Role } from '@/types/enums';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CATEGORIES: '/categories',
  PRODUCTS: '/products',
  PRODUCT_NEW: '/products/new',
  productDetail: (id: number | string) => `/products/${id}`,
  productEdit: (id: number | string) => `/products/${id}/edit`,
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_NEW: '/orders/new',
  orderDetail: (id: number | string) => `/orders/${id}`,
  USERS: '/users',
  USER_NEW: '/users/new',
  userDetail: (id: number | string) => `/users/${id}`,
  REPORTS: '/reports',
} as const;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Omit to show to every authenticated role. */
  allowedRoles?: Role[];
  /**
   * Set to false to hide from the customer's top navbar specifically, while
   * staying visible in the staff/admin Sidebar.
   */
  customerVisible?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'staff'],
  },
  { label: 'Products', href: ROUTES.PRODUCTS, icon: Coffee, customerVisible: true },
  { label: 'Categories', href: ROUTES.CATEGORIES, icon: Coffee, allowedRoles: ['admin', 'staff'] },
  { label: 'Orders', href: ROUTES.ORDERS, icon: ShoppingCart, customerVisible: false },
  { label: 'Users', href: ROUTES.USERS, icon: Users, allowedRoles: ['admin', 'staff'] },
];

/**
 * Hierarchical query key factories - one per backend module. Each exposes
 * .list(params)/.detail(id) for actual useQuery keys, and .lists()/.details()
 * as *prefixes* for cache invalidation - so "invalidate every product list
 * regardless of its page/filter params" doesn't require enumerating every
 * params combination that might be cached.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (params?: object) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },
  products: {
    all: () => ['products'] as const,
    lists: () => [...queryKeys.products.all(), 'list'] as const,
    list: (params?: object) => [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all(), 'detail'] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
  },
  orders: {
    all: () => ['orders'] as const,
    lists: () => [...queryKeys.orders.all(), 'list'] as const,
    list: (params?: object) => [...queryKeys.orders.lists(), params] as const,
    details: () => [...queryKeys.orders.all(), 'detail'] as const,
    detail: (id: number) => [...queryKeys.orders.details(), id] as const,
    payment: (orderId: number) => [...queryKeys.orders.detail(orderId), 'payment'] as const,
  },
  reports: {
    salesSummary: (params?: object) => ['reports', 'sales-summary', params] as const,
    dailySales: (params?: object) => ['reports', 'daily-sales', params] as const,
    topProducts: (params?: object) => ['reports', 'top-products', params] as const,
    lowStock: (params?: object) => ['reports', 'low-stock', params] as const,
    usersSummary: (params?: object) => ['reports', 'users-summary', params] as const,
  },
} as const;

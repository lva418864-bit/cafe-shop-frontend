import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore storage quota or private-mode restrictions
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(name);
    } catch {
      // Ignore storage errors
    }
  },
};

export interface CartItemCustomization {
  groupId: number;
  groupName: string;
  optionId: number;
  optionName: string;
  extraPrice: string;
}

export interface CartItem {
  cartItemId: string; // Unique ID for this specific combination
  productId: number;
  productName: string;
  unitPrice: string; // Base price + customization extra prices
  quantity: number;
  maxStock: number;
  imageUrl?: string | null;
  imageAlt?: string | null;
  customizations: CartItemCustomization[];
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartItemId' | 'quantity'>, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          // Generate a unique ID based on product ID and sorted customizations
          const sortedCustomizations = [...item.customizations].sort(
            (a, b) => a.optionId - b.optionId,
          );
          const customizationsHash = sortedCustomizations.map((c) => c.optionId).join('-');
          const cartItemId = `${item.productId}-${customizationsHash}`;

          const existing = state.items.find((i) => i.cartItemId === cartItemId);
          if (existing) {
            const nextQuantity = Math.min(existing.quantity + quantity, existing.maxStock);
            return {
              items: state.items.map((i) =>
                i.cartItemId === cartItemId ? { ...i, quantity: nextQuantity } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, cartItemId, quantity: Math.min(quantity, item.maxStock) },
            ],
          };
        }),

      removeItem: (cartItemId) =>
        set((state) => ({ items: state.items.filter((i) => i.cartItemId !== cartItemId) })),

      setQuantity: (cartItemId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.cartItemId !== cartItemId)
              : state.items.map((i) =>
                  i.cartItemId === cartItemId
                    ? { ...i, quantity: Math.min(quantity, i.maxStock) }
                    : i,
                ),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'coffee-shop-cart',
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

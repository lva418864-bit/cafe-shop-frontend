import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerAddToCart } from '../components/customer-add-to-cart';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import type { ProductResponse } from '../types';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const sampleProduct: ProductResponse = {
  id: 12,
  name: 'Iced Americano',
  description: 'Double shot espresso over ice',
  price: '0.50',
  stock_quantity: 10,
  is_active: true,
  category_id: 1,
  category: { id: 1, name: 'Coffee', description: 'Coffee drinks' },
  customization_groups: [],
  image_url: null,
  image_alt: null,
  images: [],
};

describe('Guest Order & Add-to-Cart Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    try {
      window.localStorage?.removeItem?.('coffee_shop_access_token');
    } catch {
      // Ignore in test environments without full Storage API
    }
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    useCartStore.setState({ items: [] });
  });

  it('does not render the guest banner text on the product view for a guest', () => {
    render(<CustomerAddToCart product={sampleProduct} />);

    expect(
      screen.queryByText(/browsing as guest/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/your cart is saved when you log in/i),
    ).not.toBeInTheDocument();
  });

  it('allows a guest to add an item to cart and redirects to login with next when pressing checkout', () => {
    render(<CustomerAddToCart product={sampleProduct} />);

    const addBtn = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addBtn);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.productId).toBe(12);

    const checkoutBtn = screen.getByRole('button', { name: /checkout \(log in to order\)/i });
    fireEvent.click(checkoutBtn);
    expect(pushMock).toHaveBeenCalledWith('/login?next=%2Fcheckout');
  });
});

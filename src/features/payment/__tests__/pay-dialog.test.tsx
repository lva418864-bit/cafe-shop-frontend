import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PayDialog } from '../components/pay-dialog';
import * as paymentHooks from '../hooks';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('PayDialog Component', () => {
  const defaultPayment = {
    id: 1,
    order_id: 10,
    amount: '1.00',
    currency: 'USD',
    method: 'khqr',
    status: 'pending',
    qr_string: '00020101021229220018coffee_shop@bakong52045814530384054041.005802KH5911Coffee Shop6010Phnom Penh62140110ORD-10-A16304ABCD',
    qr_md5: '7b8b2e1f48394a1d8f7e2c6b5a4d3e2f',
    deeplink_url: 'https://bakong.nbc.gov.kh/deeplink/sample',
    expires_at: new Date(Date.now() + 600 * 1000).toISOString(), // 10 minutes in future
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    defaultPayment.expires_at = new Date(Date.now() + 600 * 1000).toISOString();
    vi.spyOn(paymentHooks, 'usePayForOrder').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof paymentHooks.usePayForOrder>);
    vi.spyOn(paymentHooks, 'useVerifyPayment').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof paymentHooks.useVerifyPayment>);
    vi.spyOn(paymentHooks, 'useRegenerateKhqr').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof paymentHooks.useRegenerateKhqr>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders countdown timer and updates every second', () => {
    vi.spyOn(paymentHooks, 'usePayment').mockReturnValue({
      data: defaultPayment,
    } as unknown as ReturnType<typeof paymentHooks.usePayment>);

    render(
      <PayDialog orderId={10} totalAmount="1.00" open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByText(/Expires in 10:00/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/Expires in 09:58/i)).toBeInTheDocument();
  });

  it('renders real KHQR SVG, deeplink, and manual check button without any mock/simulate controls', () => {
    vi.spyOn(paymentHooks, 'usePayment').mockReturnValue({
      data: defaultPayment,
    } as unknown as ReturnType<typeof paymentHooks.usePayment>);

    render(
      <PayDialog orderId={10} totalAmount="1.00" open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByLabelText(/Bakong KHQR Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Open in Bakong/i)).toBeInTheDocument();
    expect(screen.getByText(/I Have Paid/i)).toBeInTheDocument();
    expect(screen.queryByText(/Simulate/i)).not.toBeInTheDocument();
  });

  it('parses timezone-naive UTC expires_at string as UTC without falsely expiring', () => {
    const naiveUtcFuture = new Date(Date.now() + 300 * 1000).toISOString().replace(/Z$/, '');
    vi.spyOn(paymentHooks, 'usePayment').mockReturnValue({
      data: { ...defaultPayment, expires_at: naiveUtcFuture },
    } as unknown as ReturnType<typeof paymentHooks.usePayment>);

    render(
      <PayDialog orderId={10} totalAmount="1.00" open={true} onOpenChange={vi.fn()} />,
    );

    expect(screen.getByText(/Expires in 05:00/i)).toBeInTheDocument();
    expect(screen.queryByText(/QR Expired/i)).not.toBeInTheDocument();
  });

  it('stops timer and cleans up interval on unmount without leaks', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    vi.spyOn(paymentHooks, 'usePayment').mockReturnValue({
      data: defaultPayment,
    } as unknown as ReturnType<typeof paymentHooks.usePayment>);

    const { unmount } = render(
      <PayDialog orderId={10} totalAmount="1.00" open={true} onOpenChange={vi.fn()} />,
    );

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});

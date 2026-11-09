import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareLink } from '../share-link';

const mockToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('ShareLink Single Share Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('renders only a single Share button with no helper text or external social links', () => {
    const productUrl = 'http://localhost:3000/products/42';
    const productTitle = 'Iced Caramel Latte & Croissant';

    const { container } = render(
      <ShareLink productUrl={productUrl} productTitle={productTitle} />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName('Share');
    expect(buttons[0]).toHaveTextContent('Share');

    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(
      screen.queryByText(/send this to a friend so they can order/i),
    ).not.toBeInTheDocument();
  });

  it('uses navigator.share with URL only in url field and not duplicated inside text', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    });

    const productUrl = 'http://localhost:3000/products/7';
    render(
      <ShareLink
        productUrl={`${productUrl}?token=secret#frag`}
        productTitle="Matcha Latte"
        productDescription={`Ceremonial grade matcha ${productUrl}`}
      />,
    );

    const shareBtn = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledTimes(1);
      expect(shareMock).toHaveBeenCalledWith({
        title: 'Matcha Latte',
        text: 'Ceremonial grade matcha',
        url: productUrl,
      });
    });
  });

  it('falls back to clipboard copy and shows Link copied when navigator.share is unavailable', async () => {
    const productUrl = 'http://localhost:3000/products/10';
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<ShareLink productUrl={productUrl} productTitle="Cold Brew" />);

    const shareBtn = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(productUrl);
      expect(screen.getByText('Link copied')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Link copied',
          variant: 'success',
        }),
      );
    });
  });

  it('ignores AbortError without copying or showing an error when user closes native share sheet', async () => {
    const abortError = new Error('Share canceled');
    abortError.name = 'AbortError';
    const shareMock = vi.fn().mockRejectedValue(abortError);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(
      <ShareLink
        productUrl="http://localhost:3000/products/15"
        productTitle="Flat White"
      />,
    );

    const shareBtn = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledTimes(1);
    });

    expect(writeTextMock).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
    expect(screen.queryByText(/could not copy link/i)).not.toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('shows a short error message when both navigator.share and clipboard copying fail', async () => {
    const shareMock = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard blocked'));

    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(
      <ShareLink
        productUrl="http://localhost:3000/products/99"
        productTitle="Espresso"
      />,
    );

    const shareBtn = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Could not copy link');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Could not copy link',
          variant: 'destructive',
        }),
      );
    });
  });
});

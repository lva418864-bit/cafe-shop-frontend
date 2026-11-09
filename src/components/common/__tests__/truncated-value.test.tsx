import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TruncatedValue, formatMiddleEllipsis } from '../truncated-value';

describe('TruncatedValue Component', () => {
  const fullHash = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shortens long hashes with a middle ellipsis and exposes full value in title and aria-label', () => {
    render(<TruncatedValue value={fullHash} label="reference" />);

    const expectedShort = formatMiddleEllipsis(fullHash, 8, 6);
    expect(expectedShort).toBe('9f86d081…f00a08');

    const textEl = screen.getByTestId('truncated-value-text');
    expect(textEl).toHaveTextContent('9f86d081…f00a08');
    expect(textEl).toHaveAttribute('title', fullHash);
    expect(textEl).toHaveAttribute('aria-label', fullHash);
  });

  it('copies the full untruncated value when Copy button is clicked and shows Copied confirmation', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<TruncatedValue value={fullHash} label="reference" />);

    const copyBtn = screen.getByRole('button', { name: /copy reference/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(fullHash);
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('applies min-w-0, font-mono, break-all, and overflow-wrap classes so long values never break card layout', () => {
    const { container } = render(<TruncatedValue value={fullHash} label="reference" />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('min-w-0');
    expect(wrapper.className).toContain('max-w-full');

    const textEl = screen.getByTestId('truncated-value-text');
    expect(textEl.className).toContain('min-w-0');
    expect(textEl.className).toContain('font-mono');
    expect(textEl.className).toContain('break-all');
    expect(textEl.className).toContain('[overflow-wrap:anywhere]');
  });
});

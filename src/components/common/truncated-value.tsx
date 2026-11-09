'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface TruncatedValueProps {
  value: string | null | undefined;
  headLength?: number;
  tailLength?: number;
  minTruncateLength?: number;
  copyable?: boolean;
  label?: string;
  className?: string;
}

export function formatMiddleEllipsis(
  value: string,
  headLength = 8,
  tailLength = 6,
  minTruncateLength = 18,
): string {
  const trimmed = value.trim();
  if (trimmed.length < minTruncateLength || trimmed.length <= headLength + tailLength + 3) {
    return trimmed;
  }
  return `${trimmed.slice(0, headLength)}…${trimmed.slice(-tailLength)}`;
}

/**
 * Reusable component for displaying long identifiers (such as 64-char Bakong
 * transaction hashes or masked account strings) inside narrow cards without
 * overflowing. Renders a middle-ellipsis shortened string in monospace font,
 * exposes the full value via `title` and `aria-label`, and provides an
 * accessible, keyboard-focusable Copy button with inline "Copied" feedback.
 */
export function TruncatedValue({
  value,
  headLength = 8,
  tailLength = 6,
  minTruncateLength = 18,
  copyable = true,
  label = 'value',
  className,
}: TruncatedValueProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!value) {
    return <span className="text-foreground/40 font-mono text-xs">—</span>;
  }

  const displayValue = formatMiddleEllipsis(value, headLength, tailLength, minTruncateLength);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, 2000);
    } catch {
      // Ignore clipboard permission errors silently
    }
  };

  return (
    <span
      className={cn(
        'inline-flex max-w-full min-w-0 flex-wrap items-center justify-end gap-1.5',
        className,
      )}
    >
      <span
        data-testid="truncated-value-text"
        title={value}
        aria-label={value}
        className="text-foreground min-w-0 font-mono text-xs break-all [overflow-wrap:anywhere]"
      >
        {displayValue}
      </span>

      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
          className="border-border bg-background text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 font-sans text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          {copied ? (
            <>
              <Check className="text-sage-600 h-3 w-3" aria-hidden="true" />
              <span className="text-sage-600" role="status" aria-live="polite">
                Copied
              </span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      )}
    </span>
  );
}

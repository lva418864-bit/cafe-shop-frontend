'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { buildCanonicalProductUrl } from '@/lib/site';

export interface ShareLinkProps {
  productId?: number | string;
  productUrl?: string;
  productTitle: string;
  productDescription?: string;
  className?: string;
}

export { buildCanonicalProductUrl };

/**
 * Builds short share text that never contains the URL so chat apps do not
 * duplicate the URL alongside the rich link preview card.
 */
export function buildShareText(productTitle: string, productDescription?: string): string {
  const baseText =
    productDescription && productDescription.trim()
      ? productDescription.trim()
      : `Order ${productTitle} at Coffee Shop`;
  return baseText.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();
}

/**
 * Single Share button component.
 * - Uses native Web Share API (`navigator.share`) when available with URL only in `url`.
 * - Falls back to copying the canonical URL to the clipboard and showing "Link copied".
 * - Silently ignores `AbortError` when the user closes the native share sheet.
 * - Shows a short error confirmation if both Web Share and clipboard copying fail.
 */
export function ShareLink({
  productId,
  productUrl,
  productTitle,
  productDescription,
  className,
}: ShareLinkProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [resolvedUrl, setResolvedUrl] = useState(() =>
    buildCanonicalProductUrl(productId, productUrl),
  );

  useEffect(() => {
    setResolvedUrl(buildCanonicalProductUrl(productId, productUrl));
  }, [productId, productUrl]);

  const copyToClipboard = async (urlToCopy: string) => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(urlToCopy);
      } else if (
        typeof document !== 'undefined' &&
        typeof document.execCommand === 'function'
      ) {
        const textarea = document.createElement('textarea');
        textarea.value = urlToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!ok) {
          throw new Error('execCommand copy failed');
        }
      } else {
        throw new Error('Clipboard API unavailable');
      }

      setStatus('copied');
      toast({
        title: 'Link copied',
        description: 'Product link copied to clipboard.',
        variant: 'success',
      });
      window.setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      toast({
        title: 'Could not copy link',
        description: 'Please copy the URL from the address bar.',
        variant: 'destructive',
      });
      window.setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleShare = async () => {
    const shareUrl = buildCanonicalProductUrl(productId, productUrl || resolvedUrl);
    const shareText = buildShareText(productTitle, productDescription);

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: productTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        // Browser rejected navigator.share; fall back to clipboard copy
      }
    }

    await copyToClipboard(shareUrl);
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleShare}
        aria-label="Share"
        className="focus-visible:ring-ring h-9 gap-2 px-3.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {status === 'copied' ? (
          <>
            <Check className="text-sage-600 h-4 w-4" aria-hidden="true" />
            <span className="text-sage-600 font-medium" role="status" aria-live="polite">
              Link copied
            </span>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="text-brick-600 h-4 w-4" aria-hidden="true" />
            <span className="text-brick-600 font-medium" role="alert">
              Could not copy link
            </span>
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>Share</span>
          </>
        )}
      </Button>
    </div>
  );
}

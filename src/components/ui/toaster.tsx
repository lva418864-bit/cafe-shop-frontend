'use client';

import {
  ToastProvider,
  ToastViewport,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast';
import { useToastStore, type ToastVariant } from '@/store/toastStore';

function mapVariant(variant: ToastVariant): 'default' | 'success' | 'destructive' {
  return variant;
}

/**
 * Mounted once in the root layout. Every feature triggers a toast via the
 * useToast() hook (which writes to toastStore) - this component is the only
 * thing that reads that store and actually renders them.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <ToastRoot
          key={t.id}
          variant={mapVariant(t.variant)}
          duration={t.durationMs}
          onOpenChange={(open) => {
            if (!open) dismissToast(t.id);
          }}
        >
          <div className="flex-1">
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </ToastRoot>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

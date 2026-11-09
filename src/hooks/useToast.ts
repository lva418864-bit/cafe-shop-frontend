import { useToastStore } from '@/store/toastStore';

/**
 * The one function every feature should call to surface feedback -
 * "Product created", "Payment failed: insufficient stock", etc. Wraps the
 * store so callers never touch Zustand directly.
 *
 * Usage: const { toast } = useToast(); toast({ title: "Saved" });
 */
export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  const dismissToast = useToastStore((s) => s.dismissToast);

  return {
    toast: addToast,
    dismiss: dismissToast,
  };
}

import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'destructive';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
}

export type ToastInput = Omit<ToastItem, 'id' | 'variant' | 'durationMs'> &
  Partial<Pick<ToastItem, 'variant' | 'durationMs'>>;

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATION_MS = 5000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          title: toast.title,
          description: toast.description,
          variant: toast.variant ?? 'default',
          durationMs: toast.durationMs ?? DEFAULT_DURATION_MS,
        },
      ],
    }));
    return id;
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes, letting later classes win over earlier
 * conflicting ones (e.g. a `className` prop overriding a component's
 * default). Used by every component in components/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

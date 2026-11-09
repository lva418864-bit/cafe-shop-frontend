import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const THEME_STORAGE_KEY = 'coffee-shop-ui-theme';

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/**
 * Reads the theme directly off the <html> element instead of localStorage,
 * because the blocking inline script in the root layout (see layout.tsx)
 * already applied the right class before React ever mounts - this avoids
 * a flash of the wrong theme and keeps this store as the single source of
 * truth for anything that needs to *react* to theme changes afterward.
 */
function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: getInitialTheme(),
  sidebarOpen: false,

  setTheme: (theme) => {
    applyThemeClass(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));

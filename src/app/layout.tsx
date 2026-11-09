import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import '@/styles/globals.css';

import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/app/providers';

// Display face, used sparingly for page titles - carries the "craft" side
// of a coffee business.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

// Body/UI face - carries the "operations console" side: clean and legible
// at small sizes across dense tables.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});

// Utility face for numbers - prices, ids, timestamps, quantities - so data
// always reads as data, distinct from prose.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Coffee Shop Console',
  description: 'Operations console for the Coffee Shop microservices platform.',
};

// Runs before React hydrates, so the correct theme class is already on
// <html> at first paint - avoids a flash of the wrong theme. uiStore then
// reads this same class as its initial state (see store/uiStore.ts).
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('coffee-shop-ui-theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

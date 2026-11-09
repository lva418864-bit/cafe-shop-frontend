'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { getQueryClient } from '@/config/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  // useState so this only resolves getQueryClient() once per component
  // instance/mount, not on every render.
  const [client] = useState(getQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

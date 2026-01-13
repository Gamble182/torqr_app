'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';
import { ReactQueryProvider } from '@/lib/react-query';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        {children}
        <Toaster position="top-right" richColors />
      </ReactQueryProvider>
    </SessionProvider>
  );
}

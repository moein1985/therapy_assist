import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@backend/main';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: process.env.NEXT_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc',
        headers() {
          if (typeof window === 'undefined') return {};
          const token = localStorage.getItem('token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

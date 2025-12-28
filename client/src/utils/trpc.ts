import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

// Use `any` for AppRouter here to avoid type mismatches between server and client tRPC package versions.
// For full type-safety, align @trpc/* package versions across backend and frontend and import `AppRouter`.
// Using `any` to avoid complex type mismatches between different @trpc versions used in backend and frontend.
export const trpc: any = createTRPCReact<any>() as any;

export function createTRPCClient(): any {
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

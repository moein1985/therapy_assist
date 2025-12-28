'use client';

import React from 'react';
import { trpc } from '@/utils/trpc';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const mutation = trpc.login.useMutation({
    onSuccess: (data: { token: string }) => {
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    },
  });

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">ورود</h1>

        <label className="block mb-2 text-sm">ایمیل</label>
        <input
          className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@example.com"
        />

        <label className="block mb-2 text-sm">رمز عبور</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button
          onClick={() => mutation.mutate({ email, password })}
          className={clsx(
            'w-full py-2 rounded text-white',
            mutation.isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          )}
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? 'درحال ورود...' : 'ورود'}
        </button>

        {mutation.isError && (
          <div className="mt-3 text-red-600 text-sm">خطا: {(mutation.error as any).message}</div>
        )}
      </div>
    </div>
  );
}

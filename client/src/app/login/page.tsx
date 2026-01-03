'use client';

import React from 'react';
import { trpc } from '@/utils/trpc';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

const loginSchema = z.object({
  email: z.string().email({ message: 'لطفاً یک ایمیل معتبر وارد کنید.' }),
  password: z.string().min(1, { message: 'رمز عبور مورد نیاز است.' }),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [rawError, setRawError] = React.useState<string | null>(null);

  const mutation = trpc.login.useMutation({
    onSuccess: (data: { token: string }) => {
      localStorage.setItem('token', data.token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error('Login mutation error:', error);
      try {
        setRawError(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch (e) {
        setRawError(String(error));
      }
    },
  });

  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    setRawError(null);
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">ورود</h1>

        <label className="block mb-2 text-sm">ایمیل</label>
        <input
          {...register('email')}
          className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring"
          placeholder="test@example.com"
        />
        {formState.errors.email && (
          <div className="text-red-600 text-sm mb-2">{formState.errors.email.message}</div>
        )}

        <label className="block mb-2 text-sm">رمز عبور</label>
        <input
          {...register('password')}
          type="password"
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring"
          placeholder="••••••••"
        />
        {formState.errors.password && (
          <div className="text-red-600 text-sm mb-2">{formState.errors.password.message}</div>
        )}

        <button
          onClick={handleSubmit(onSubmit)}
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

        {rawError && (
          <pre className="mt-3 bg-gray-100 p-3 text-xs rounded overflow-auto">{rawError}</pre>
        )}
      </div>
    </div>
  );
}
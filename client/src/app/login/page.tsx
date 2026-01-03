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

  const { register, handleSubmit, formState, setValue } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    setRawError(null);
    mutation.mutate(data);
  };

  const translateError = (msg?: string) => {
    if (!msg) return 'خطا در ورود';
    if (msg.includes('Invalid email or password')) return 'ایمیل یا رمز عبور نامعتبر است';
    return msg;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-2">ورود</h1>
        <p className="text-sm text-gray-500 mb-3">برای ورود سریع از حساب دموی زیر استفاده کنید: <strong>test@example.com / password123</strong></p>
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => {
              setValue('email', 'test@example.com');
              setValue('password', 'password123');
              handleSubmit(onSubmit)();
            }}
            className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ورود دمو
          </button>
        </div>

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
          <div className="mt-3 text-red-600 text-sm">خطا: {translateError((mutation.error as any)?.message)}</div>
        )}

        {/* Remove verbose raw error dump for readability */}

      </div>
    </div>
  );
}
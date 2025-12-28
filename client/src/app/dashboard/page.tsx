'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import type { MoodLog } from '@backend/domain/entities/MoodLog';

export default function DashboardPage() {
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  const { data, isLoading } = trpc.getMoodHistory.useQuery(undefined, {
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">سوابق حال روحی</h1>
        {isLoading ? (
          <div>در حال بارگذاری...</div>
        ) : (
          <ul className="space-y-3">
            {data && data.length > 0 ? (
              data.map((m: MoodLog) => (
                <li key={m.id} className="bg-white p-4 rounded shadow">
                  <div className="text-lg font-medium">{m.mood}</div>
                  <div className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
                </li>
              ))
            ) : (
              <div className="text-gray-600">هنوز هیچ حالتی ثبت نشده است.</div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

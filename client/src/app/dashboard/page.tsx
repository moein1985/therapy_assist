'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import type { MoodLog } from '@backend/domain/entities/MoodLog';

'use client';
import React from 'react';
import { trpc } from '@/utils/trpc';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = trpc.me.useQuery();
  const { data: moods } = trpc.getMoodHistory.useQuery();

  React.useEffect(() => {
    // Basic Client-side auth check
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  if (userLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-gray-700 pb-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-400">Therapy Assist</h1>
        <div className="text-gray-300">Welcome, <span className="font-semibold text-white">{user?.name || user?.email}</span></div>
      </header>

      <main className="max-w-4xl mx-auto space-y-10">
        {/* Main Action Card */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-800 p-10 rounded-3xl shadow-2xl text-center border border-gray-700 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-3xl font-bold mb-4 relative z-10">How are you feeling today?</h2>
          <p className="text-gray-400 mb-8 text-lg relative z-10">Your AI Therapist is ready to listen and support you.</p>
          <Link href="/chat">
            <button className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full text-xl font-bold transition-all shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95">
              Start Chat Session
            </button>
          </Link>
        </div>

        {/* Mood History Section */}
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
          <h3 className="text-xl font-semibold mb-6 text-purple-400 flex items-center gap-2">
            <span>Recent Moods</span>
          </h3>
          <ul className="space-y-4">
            {moods?.map((m) => (
              <li key={m.id} className="flex justify-between items-center bg-gray-700/30 p-4 rounded-xl hover:bg-gray-700/50 transition-colors">
                <span className="font-medium text-lg text-gray-200">{m.mood}</span>
                <span className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
              </li>
            )) ?? <p className="text-gray-500 text-center py-4">No moods logged yet.</p>}
          </ul>
        </div>
      </main>
    </div>
  );
}

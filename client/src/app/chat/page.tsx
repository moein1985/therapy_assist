import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">AI Therapist — Coming Soon</h2>
        <p className="text-gray-600">ما در حال آماده‌سازی تجربه گفتگو با مدل هوش مصنوعی هستیم. به زودی فعال می‌شود.</p>
      </div>
    </div>
  );
}

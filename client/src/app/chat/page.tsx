'use client';

import React from 'react';
import { trpc } from '@/utils/trpc';
import { MessageSquare } from 'lucide-react';

type ChatMessage = {
  id: string;
  userId: string;
  text: string;
  sender: 'USER' | 'AI';
  createdAt: string | Date;
};

export default function ChatPage() {
  const utils = trpc.useContext();
  const { data: history, isLoading } = trpc.chat.getHistory.useQuery(undefined, { refetchOnWindowFocus: false });
  const sendMutation = trpc.chat.sendMessage.useMutation();

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (history) {
      setMessages(history as ChatMessage[]);
    }
  }, [history]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');

    const tempMessage: ChatMessage = {
      id: 'tmp-' + Date.now(),
      userId: 'me',
      text,
      sender: 'USER',
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((m) => [...m, tempMessage]);
    setIsTyping(true);

    sendMutation.mutate(
      { message: text },
      {
        onSuccess: (aiResponse: ChatMessage) => {
          setIsTyping(false);
          // replace optimistic or just append AI response
          setMessages((m) => [...m, aiResponse]);
          utils.chat.getHistory.invalidate();
        },
        onError: (err) => {
          setIsTyping(false);
          // remove optimistic message on error
          setMessages((m) => m.filter((msg) => msg.id !== tempMessage.id));
          console.error('Failed to send message', err);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="px-4 py-3 bg-white shadow flex items-center gap-3">
        <div className="p-2 rounded bg-blue-50">
          <MessageSquare className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-lg font-semibold">AI Therapist</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading && <div className="text-center text-gray-500">بارگذاری...</div>}
          {messages.map((m) => (
            <div key={m.id} className={m.sender === 'USER' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg shadow ${
                  m.sender === 'USER' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className="text-xs text-gray-400 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow animate-pulse">Typing...</div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </main>

      <div className="bg-white p-4 border-t">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a message..."
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
          />
          <button
            onClick={send}
            disabled={sendMutation.isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

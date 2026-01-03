'use client';

import React from 'react';
import { trpc } from '@/utils/trpc';
import { MessageSquare } from 'lucide-react';

type TokenUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  [k: string]: any;
};

type ChatMessage = {
  id: string;
  conversationId?: string;
  userId?: string | null;
  text: string;
  sender: string; // will be 'USER' | 'AI' | 'SYSTEM' (Backend SenderType)
  tokenUsage?: TokenUsage | null;
  createdAt: string | Date;
};

function formatTokenUsage(tokenUsage?: TokenUsage) {
  if (!tokenUsage) return null;
  const p = (tokenUsage.prompt_tokens ?? (tokenUsage.promptTokens as any) ?? 0) as number;
  const c = (tokenUsage.completion_tokens ?? (tokenUsage.completionTokens as any) ?? 0) as number;
  const total = p + c;
  return { total, prompt: p, completion: c };
}

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
      // safe cast from backend
      setMessages((history as any) as ChatMessage[]);
    }
  }, [history]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    const tempMessage: ChatMessage = {
      id: 'tmp-' + Date.now(),
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
          // append AI response
          setMessages((m) => [...m, aiResponse]);
          utils.chat.getHistory.invalidate();
        },
        onError: (err: any) => {
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
      {/* Header: session active with green dot */}
      <header className="px-4 py-3 bg-white/80 backdrop-blur-sm border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-teal-50">
            <MessageSquare className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Session Active</span>
              <span className="h-3 w-3 rounded-full bg-green-500 inline-block" aria-hidden />
            </div>
            <div className="text-sm text-gray-500">Therapy session — your AI assistant is ready</div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading && <div className="text-center text-gray-500">بارگذاری...</div>}

          {messages.map((m) => {
            const isUser = (m.sender as string) === 'USER';
            const isAI = (m.sender as string) === 'AI';
            const tokenInfo = formatTokenUsage(m.tokenUsage ?? undefined);

            return (
              <div key={m.id} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[72%] px-4 py-3 rounded-lg shadow ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-teal-50 text-teal-900 rounded-bl-none border border-teal-100'
                  }`}
                >
                  {/* Persona for AI */}
                  {!isUser && (
                    <div className="text-xs text-teal-700 font-medium mb-1">Therapist • AI</div>
                  )}

                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</div>

                  {/* token usage footer for AI messages */}
                  {isAI && tokenInfo && (
                    <div className="mt-2 text-xs text-gray-500 opacity-80 text-left">
                      ⚡ {tokenInfo.total} tokens (Prompt: {tokenInfo.prompt}, Completion: {tokenInfo.completion})
                    </div>
                  )}

                  <div className={`text-xs mt-2 ${isUser ? 'text-gray-200 text-right' : 'text-gray-500 text-left'}`}>
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-teal-100 text-teal-700 px-4 py-2 rounded-lg shadow animate-pulse">Therapist is typing...</div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </main>

      <div className="bg-white p-4 border-t">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring resize-none h-12"
            aria-label="Message input"
          />
          <button
            onClick={send}
            disabled={sendMutation.isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            aria-label="send message"
          >
            ارسال
          </button>
        </div>
      </div>
    </div>
  );
}

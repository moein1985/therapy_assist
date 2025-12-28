# Frontend setup (Next.js + tRPC) — دستورالعمل گام‌به‌گام 🚀

این فایل راهنمای کامل برای ساخت یک اپ Next.js (App Router) در پوشه `client` و اتصال آن به بک‌اند tRPC شما است.

---

## 1) ایجاد پروژه Next.js

در ریشه مخزن اجرا کنید:

```bash
# ایجاد پروژه در پوشه `client` (تعامل‌پذیر: TypeScript, Tailwind, ESLint, App Router را انتخاب کنید)
npx create-next-app@latest client
```

پاسخ‌ها (مشخص):
- Use TypeScript → yes
- Use ESLint → yes
- Use Tailwind CSS → yes
- Use App Router → yes

ورود به دایرکتوری:
```bash
cd client
```

---

## 2) نصب وابستگی‌ها داخل `client`

```bash
npm install @trpc/client @trpc/react-query @trpc/server @tanstack/react-query lucide-react
```

> توضیح: `@trpc/server` فقط برای تایپ‌ها در کلاینت اضافه می‌شود (type-only import).

---

## 3) ساختار پیشنهادی فایل‌ها

- `client/src/utils/trpc.ts`  — مقداردهی اولیه tRPC client
- `client/src/components/Provider.tsx` — Provider برای trpc + react-query
- صفحات:
  - `client/app/login/page.tsx`
  - `client/app/dashboard/page.tsx`
  - `client/app/chat/page.tsx`

---

## 4) پیکربندی tRPC client

فایل: `client/src/utils/trpc.ts`

```ts
// client/src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@backend/main'; // توضیح در بخش "Type Integration"

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
```

---

## 5) Provider کامپوننت

فایل: `client/src/components/Provider.tsx`

```tsx
'use client';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from '../utils/trpc';

export function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

سپس در `app/layout.tsx` اپ را با آن بپیچید:

```tsx
// client/app/layout.tsx
import './globals.css';
import { Provider } from '../src/components/Provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

---

## 6) Type Integration — چگونه `AppRouter` را از بک‌اند وارد کنیم (برای end-to-end types)

دو روش:

**A) مسیرهای TypeScript (ساده)**
1. در `client/tsconfig.json` یک alias اضافه کنید:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@backend/*": ["../src/*"]
    }
  }
}
```
2. سپس در فایل‌های کلاینت برای تایپ فقط از `import type { AppRouter } from '@backend/main';` استفاده کنید.

> نکته: حتماً از `import type` استفاده کنید تا bundler تلاش به import runtime نکند.

**B) روش حرفه‌ای‌تر (مناسب برای پروژه‌های بزرگ)**
- ایجاد یک پکیج مشترک `packages/shared-types` و اضافه کردن آن به workspace (monorepo). این روش پایدارتر و امن‌تر است.

---

## 7) صفحات نمونه

### Login (`client/app/login/page.tsx`)

```tsx
'use client';
import React from 'react';
import { trpc } from '../../src/utils/trpc';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const login = trpc.login.useMutation({
    onSuccess(data) {
      localStorage.setItem('token', data.token);
      // پیشنهاد: ذخیره userId یا fetch از /me
      router.push('/dashboard');
    },
    onError(e) {
      alert('Login failed: ' + e.message);
    }
  });

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl mb-4">Login</h1>
      <input className="w-full p-2 border mb-2" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email" />
      <input className="w-full p-2 border mb-2" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" type="password" />
      <button className="px-4 py-2 bg-blue-600 text-white" onClick={() => login.mutate({ email, password })}>
        {login.isLoading ? 'Logging...' : 'Login'}
      </button>
    </div>
  );
}
```

### Dashboard (`client/app/dashboard/page.tsx`)

```tsx
'use client';
import React from 'react';
import { trpc } from '../../src/utils/trpc';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  const { data, isLoading } = trpc.getMoodHistory.useQuery(undefined, {
    enabled: !!(typeof window !== 'undefined' && localStorage.getItem('token')),
  });

  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Mood history</h1>
      <ul>
        {data?.map((m) => (
          <li key={m.id} className="mb-2 border p-2 rounded">
            <div><strong>{m.mood}</strong></div>
            <div className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
          </li>
        )) ?? <li>No moods yet</li>}
      </ul>
    </div>
  );
}
```

### Chat (`client/app/chat/page.tsx`)

```tsx
'use client';
import React from 'react';
import { trpc } from '../../src/utils/trpc';

export default function ChatPage() {
  const mutation = trpc.chat.sendMessage.useMutation();
  const [message, setMessage] = React.useState('');
  const [history, setHistory] = React.useState<any[]>([]);

  const send = async () => {
    if (!message) return;
    // بهتر است userId را از endpoint /me بگیرید یا پس از login ذخیره کنید
    const userId = localStorage.getItem('userId') || '';

    try {
      const res = await mutation.mutateAsync({ userId, message });
      setHistory((h) => [...h, { from: 'AI', text: res.text }]);
      setMessage('');
    } catch (e) {
      alert('Chat failed: ' + (e as Error).message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Chat with AI</h1>
      <div className="mb-4 space-y-2">
        {history.map((m, i) => <div key={i} className="p-2 border rounded">{m.from}: {m.text}</div>)}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 p-2 border" value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Say something..." />
        <button className="px-4 py-2 bg-green-600 text-white" onClick={send}>Send</button>
      </div>
    </div>
  );
}
```

> نکته مهم: برای chat لازم است `userId` واقعی ارسال شود؛ بهترین راه اضافه کردن یک endpoint `me` در سرور یا برگشت دادن `userId` در پاسخ `login` است.

---

## 8) تنظیمات CORS و .env

- در بک‌اند مطمئن شوید CORS اجازه origin `http://localhost:3000` را دارد (یا `*` برای dev):

```ts
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
```

- در `client/.env.local` مقدار `NEXT_PUBLIC_TRPC_URL` را ست کنید (اختیاری):

```
NEXT_PUBLIC_TRPC_URL=http://localhost:4000/trpc
```

---

## 9) اجرای اپ

```bash
# در پوشه client
cd client
npm run dev
# اپ در http://localhost:3000 اجرا می‌شود
```

---

## 10) پیشنهادات عملی و نکات دیباگ

- اگر می‌خواهید تایپ‌ها واقعاً جدای runtime باشند، از `import type { AppRouter } ...` استفاده کنید تا bundle تداخل نداشته باشد.
- برای گرفتن userId: یا login را طوری تغییر دهید که شناسه کاربر را هم برگرداند یا یک `me` protected route اضافه کنید که اطلاعات کاربر را می‌دهد.
- برای production، از متغیر‌های محیطی (NEXT_PUBLIC_TRPC_URL) استفاده کنید تا URL ترافیک قابل تنظیم باشد.

---

## در پایان
اگر می‌خواهید من این ساختار را برای شما scaffold کنم و فایل‌ها را در `client/` ایجاد و commit کنم، یا بخواهم endpoint `me` را در سرور اضافه کنم تا کار chat آسان‌تر شود، بگویید تا انجام دهم.
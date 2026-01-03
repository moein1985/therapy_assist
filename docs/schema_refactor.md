عالی — پیشنهادم برای بازسازی `prisma/schema.prisma` (مقیاس‌پذیر و آماده نقش‌ها، مکالمات و گزارش‌گیری توکنی) در ادامه آمده است. این اسکیمای کامل را جایگزین `prisma/schema.prisma` کنید و سپس مایگریشن را با دستور پیشنهادی اجرا کنید.

---

## تغییرات کلیدی (خلاصه)

- اضافه شدن enumهای جدید: `Role`, `SenderType`, `ConversationStatus`.
- مدل `User`: فیلدهای `role`, `metadata` (Json?), و رابطهٔ خود ارجاعی Therapist ←→ Patients.
- مدل جدید `Conversation` برای گروه‌بندی پیام‌ها و نگهداری summary و وضعیت.
- `ChatMessage`: به `conversationId` وصل شده، `sender` از نوع `SenderType` شده، و `tokenUsage` (Json?) اضافه شده.
- مدل جدید `TokenLog` برای ثبت مصرف توکن‌ها و گزارش‌گیری.

---

## prisma/schema.prisma (پیشنهادی — کامل)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  THERAPIST
  PATIENT
}

enum SenderType {
  USER
  AI
  SYSTEM
}

enum ConversationStatus {
  ACTIVE
  ARCHIVED
}

model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  password      String
  role          Role        @default(PATIENT)
  metadata      Json?
  // Self-relation: a User may have a therapist (another User)
  therapistId   String?
  therapist     User?       @relation("TherapistPatients", fields: [therapistId], references: [id])
  patients      User[]      @relation("TherapistPatients")
  // Relations
  moodLogs      MoodLog[]
  journalEntries JournalEntry[]
  chatMessages  ChatMessage[]      // messages authored by this user (sender = USER)
  conversations Conversation[] @relation("UserConversations")
  tokenLogs     TokenLog[]

  @@map("users")
}

model Conversation {
  id           String             @id @default(cuid())
  userId       String
  user         User               @relation(fields: [userId], references: [id])
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  summary      String?            @db.Text
  status       ConversationStatus @default(ACTIVE)
  messages     ChatMessage[]
  tokenLogs    TokenLog[]

  @@index([userId])
  @@map("conversations")
}

model ChatMessage {
  id             String      @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  // optional user reference (system/AI messages may have no user)
  userId         String?
  user           User?       @relation(fields: [userId], references: [id])
  text           String      @db.Text
  sender         SenderType
  tokenUsage     Json?
  createdAt      DateTime    @default(now())

  @@index([conversationId])
  @@map("chat_messages")
}

model TokenLog {
  id             String     @id @default(cuid())
  userId         String
  user           User       @relation(fields: [userId], references: [id])
  conversationId String?
  conversation   Conversation? @relation(fields: [conversationId], references: [id])
  promptTokens   Int?
  completionTokens Int?
  modelName      String
  createdAt      DateTime   @default(now())

  @@index([userId])
  @@index([conversationId])
  @@map("token_logs")
}

model MoodLog {
  id        String   @id @default(cuid())
  mood      String
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}

model JournalEntry {
  id        String   @id @default(cuid())
  title     String
  content   String
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## دستور ایجاد مایگریشن

برای ایجاد و اعمال مایگریشن محلی:

```bash
npx prisma migrate dev --name init_roles_and_sessions
```

(این دستور: 1) فایل migration می‌سازد، 2) Prisma Client را regenerate می‌کند، و 3) دیتابیس محلی شما را به‌روز می‌کند.)

---

اگر موافق باشید، گام‌های بعدی که پیشنهاد می‌کنم:

1. بررسی و اجرای مایگریشن در محیط توسعه (اجرا کنید: دستور بالا).
2. اضافه کردن migration tests یا یک اسکریپت seed کوچک برای ایجاد یک نقش Therapist، یک Patient متصل و یک Conversation نمونه تا داده‌های جدید را آزمون کنیم.
3. به‌روزرسانی کد لایهٔ اپلیکیشن (Use-cases / Repositories) تا از Conversation و TokenLog استفاده کنند (ذخیره پیام‌ها در Conversation، ثبت توکن‌ها در TokenLog پس از فراخوانی AI).

می‌خواهید که من برایتان:
- همین مایگریشن را بسازم و اجرا کنم و client را regenerate کنم، یا
- اول برایتان یک اسکریپت seed و تست ساده ایجاد کنم تا پیش از اعمال مایگریشن مطمئن شویم؟

کدام کار را شروع کنم؟
# All project code — therapy_assist

This file contains the main configuration and all TypeScript source files in the repository, collected for a specialist review.

---

## package.json

```json
{
  "name": "therapy_assist",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "ts-node src/main.ts",
    "start:prod": "node dist/main.js",
    "build:ts": "tsc",
    "test:flow": "ts-node src/scripts/test-flow.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@google/generative-ai": "^0.1.3",
    "@prisma/client": "^5.10.2",
    "@trpc/server": "^10.45.1",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "uuid": "^9.0.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^20.11.24",
    "@types/uuid": "^9.0.8",
    "jsonwebtoken": "^9.0.3",
    "prisma": "^5.10.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

---

## tsconfig.json

```jsonc
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## .env (template)

```dotenv
# Environment variables template

# Database connection string
# Example for PostgreSQL: DATABASE_URL="postgresql://user:password@host:port/database"
# Example for MySQL: DATABASE_URL="mysql://user:password@host:port/database"
# Example for SQLite: DATABASE_URL="file:./dev.db"
# For local dev (docker-compose) the default used in this repo is:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Server port
PORT=4000

# JWT secret for auth (set a strong random value)
JWT_SECRET="your-jwt-secret"

# Gemini API Key (set to enable AI chat in smoke tests)
GEMINI_API_KEY=""
```

---

## .dockerignore

```text
node_modules
dist
.git
*.log
.env
```

---

## Dockerfile

```dockerfile
# Multi-stage Dockerfile for therapy_assist

# --- Builder stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy prisma schema and generate client early
COPY prisma ./prisma
RUN npx prisma generate

# Copy all source code and build TypeScript
COPY . .
RUN npm run build:ts

# --- Runner stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy necessary prisma runtime artifacts & cli from builder so migrations can run at container start
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled app and prisma schema
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 4000

# At container start: run migrations, then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

---

## docker-compose.yml

```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres"
      GEMINI_API_KEY: "${GEMINI_API_KEY:-}"
      JWT_SECRET: "${JWT_SECRET:-changeme}"
    command: sh -c "npx prisma migrate deploy && npm run start:prod"

volumes:
  db_data:
```
---

## prisma/schema.prisma

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  password String
  moodLogs MoodLog[]
  journalEntries JournalEntry[]
  chatMessages ChatMessage[]
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

model ChatMessage {
  id        String   @id @default(cuid())
  text      String
  sender    String // "USER" or "AI"
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
```

---

# Source files

Below are the TypeScript source files collected from `src/`.

---

## src/main.ts

```typescript
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router, publicProcedure, protectedProcedure, createContext } from './interface-adapters/trpc/trpc';
import dotenv from 'dotenv';
import { z } from 'zod';
import { CreateUser } from './application/use-cases/CreateUser';
import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository';
import { PrismaMoodLogRepository } from './infrastructure/repositories/PrismaMoodLogRepository';
import { LogMood } from './application/use-cases/LogMood';
import { GetMoodHistory } from './application/use-cases/GetMoodHistory';
import { Login } from './application/use-cases/Login';
import { PrismaJournalEntryRepository } from './infrastructure/repositories/PrismaJournalEntryRepository';
import { CreateJournalEntry } from './application/use-cases/CreateJournalEntry';
import { GetJournalEntries } from './application/use-cases/GetJournalEntries';
import { DeleteJournalEntry } from './application/use-cases/DeleteJournalEntry';
import { UpdateJournalEntry } from './application/use-cases/UpdateJournalEntry';
import { chatRouter } from './interface-adapters/trpc/chatRouter'; // Import chatRouter

dotenv.config();

const userRepository = new PrismaUserRepository();
const createUser = new CreateUser(userRepository);
const login = new Login(userRepository);

const moodLogRepository = new PrismaMoodLogRepository();
const logMood = new LogMood(moodLogRepository);
const getMoodHistory = new GetMoodHistory(moodLogRepository);

const journalEntryRepository = new PrismaJournalEntryRepository();
const createJournalEntry = new CreateJournalEntry(journalEntryRepository);
const getJournalEntries = new GetJournalEntries(journalEntryRepository);
const deleteJournalEntry = new DeleteJournalEntry(journalEntryRepository);
const updateJournalEntry = new UpdateJournalEntry(journalEntryRepository);

const appRouter = router({
  hello: publicProcedure.query(() => {
    return 'Hello, world!';
  }),
  // Merge chatRouter
  chat: chatRouter,
  createUser: publicProcedure
    .input(z.object({ email: z.string().email(), name: z.string().optional(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      return await createUser.execute(input);
    }),
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      return await login.execute(input);
    }),
  logMood: protectedProcedure
    .input(z.object({ mood: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await logMood.execute({ ...input, userId: ctx.user.id });
    }),
  getMoodHistory: protectedProcedure
    .query(async ({ ctx }) => {
      return await getMoodHistory.execute({ userId: ctx.user.id });
    }),
  createJournalEntry: protectedProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await createJournalEntry.execute({ ...input, userId: ctx.user.id });
    }),
  getJournalEntries: protectedProcedure
    .query(async ({ ctx }) => {
      return await getJournalEntries.execute({ userId: ctx.user.id });
    }),
  deleteJournalEntry: protectedProcedure
    .input(z.object({ journalEntryId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await deleteJournalEntry.execute({ ...input, userId: ctx.user.id });
    }),
  updateJournalEntry: protectedProcedure
    .input(z.object({ journalEntryId: z.string(), title: z.string().optional(), content: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return await updateJournalEntry.execute({ ...input, userId: ctx.user.id });
    }),
  // Return current authenticated user
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});

export type AppRouter = typeof appRouter;

const app = express();
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

const port = process.env.PORT || 4000;

// Only start the HTTP server if this file is run directly (prevents double-listen during tests where
// this module is imported)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
```

---

## src/interface-adapters/trpc/trpc.ts

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';

export const createContext = ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const getUserFromHeader = () => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
        return { id: decoded.id };
      } catch (err) {
        return null;
      }
    }
    return null;
  };

  const user = getUserFromHeader();

  return {
    req,
    res,
    user,
  };
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<typeof createContext>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      // infers that `user` is non-nullable to downstream procedures
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```

---

## src/interface-adapters/trpc/chatRouter.ts

```typescript
// src/interface-adapters/trpc/chatRouter.ts

import { z } from 'zod';
import { publicProcedure, router } from './trpc';
import { ChatWithAI } from '../../application/use-cases/ChatWithAI';
import { PrismaChatMessageRepository } from '../../infrastructure/repositories/PrismaChatMessageRepository';
import prisma from '../../infrastructure/database/prisma';

// Initialize repository and use case
const chatMessageRepository = new PrismaChatMessageRepository(prisma);
const chatWithAI = new ChatWithAI(chatMessageRepository);

export const chatRouter = router({
  // Get chat history for authenticated user
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    return await chatMessageRepository.findByUserId(userId);
  }),

  // Send a message as authenticated user
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const aiResponse = await chatWithAI.execute(userId, input.message);
      return aiResponse;
    }),
});
```

---

## src/infrastructure/database/prisma.ts

```typescript
import { PrismaClient } from '@prisma/client';

// Ensures a single instance of PrismaClient is used.
const prisma = new PrismaClient();

export default prisma;
```

---

## src/infrastructure/gemini.ts

```typescript
// src/infrastructure/gemini.ts

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Do not throw during import; check for API key at call time so tests can skip AI if key is not set.
export async function generateText(prompt: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in the .env file');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text from Gemini AI:', error);
    throw new Error('Failed to generate text from AI.');
  }
}
```

---

## src/infrastructure/repositories/PrismaUserRepository.ts

```typescript
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import prisma from '../database/prisma';

export class PrismaUserRepository implements UserRepository {
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    return prisma.user.create({
      data: user,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }
}
```

---

## src/infrastructure/repositories/PrismaMoodLogRepository.ts

```typescript
import { MoodLogRepository } from '../../domain/repositories/MoodLogRepository';
import { MoodLog } from '../../domain/entities/MoodLog';
import prisma from '../database/prisma';

export class PrismaMoodLogRepository implements MoodLogRepository {
  async logMood(moodLog: Omit<MoodLog, 'id' | 'createdAt'>): Promise<MoodLog> {
    return prisma.moodLog.create({
      data: moodLog,
    });
  }

  async getMoodsByUserId(userId: string): Promise<MoodLog[]> {
    return prisma.moodLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
```

---

## src/infrastructure/repositories/PrismaJournalEntryRepository.ts

```typescript
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import prisma from '../database/prisma';

export class PrismaJournalEntryRepository implements JournalEntryRepository {
  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry> {
    return prisma.journalEntry.create({
      data: entry,
    });
  }

  async getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]> {
    return prisma.journalEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteJournalEntry(journalEntryId: string, userId: string): Promise<void> {
    await prisma.journalEntry.deleteMany({
      where: {
        id: journalEntryId,
        userId,
      },
    });
  }

  async updateJournalEntry(journalEntryId: string, userId: string, data: { title?: string; content?: string }): Promise<JournalEntry> {
    return prisma.journalEntry.update({
      where: {
        id: journalEntryId,
        userId,
      },
      data,
    });
  }
}
```

---

## src/infrastructure/repositories/PrismaChatMessageRepository.ts

```typescript
// src/infrastructure/repositories/PrismaChatMessageRepository.ts

import { PrismaClient } from '@prisma/client';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatMessageRepository } from '../../domain/repositories/ChatMessageRepository';

export class PrismaChatMessageRepository implements ChatMessageRepository {
  constructor(private prisma: PrismaClient) {}

  async save(chatMessage: ChatMessage): Promise<ChatMessage> {
    const createdChatMessage = await this.prisma.chatMessage.create({
      data: {
        id: chatMessage.id,
        userId: chatMessage.userId,
        text: chatMessage.text,
        sender: chatMessage.sender,
        createdAt: chatMessage.createdAt,
      },
    });
    // map to domain ChatMessage with proper sender union type
    return {
      id: createdChatMessage.id,
      userId: createdChatMessage.userId,
      text: createdChatMessage.text,
      sender: createdChatMessage.sender as 'USER' | 'AI',
      createdAt: createdChatMessage.createdAt,
    };
  }

  async findByUserId(userId: string): Promise<ChatMessage[]> {
    const chatMessages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return chatMessages.map((m) => ({
      id: m.id,
      userId: m.userId,
      text: m.text,
      sender: m.sender as 'USER' | 'AI',
      createdAt: m.createdAt,
    }));
  }
}
```

---

## src/domain/entities/User.ts

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
}
```

---

## src/domain/entities/MoodLog.ts

```typescript
export interface MoodLog {
  id: string;
  userId: string;
  mood: string;
  createdAt: Date;
}
```

---

## src/domain/entities/JournalEntry.ts

```typescript
export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}
```

---

## src/domain/entities/ChatMessage.ts

```typescript
// src/domain/entities/ChatMessage.ts

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  sender: 'USER' | 'AI';
  createdAt: Date;
}
```

---

## src/application/use-cases/CreateUser.ts

```typescript
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import bcrypt from 'bcrypt';

export class CreateUser {
  constructor(private userRepository: UserRepository) {}

  async execute(input: { email: string; name?: string, password?: string }): Promise<Omit<User, 'password'>> {
    const { email, name, password } = input;

    if (!password) {
      throw new Error('Password is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user: Omit<User, 'id'> = {
      email,
      name: name || null,
      password: hashedPassword,
    };
    
    const createdUser = await this.userRepository.createUser(user);

    const { password: _, ...userWithoutPassword } = createdUser;

    return userWithoutPassword;
  }
}
```

---

## src/application/use-cases/Login.ts

```typescript
import { UserRepository } from '../../domain/repositories/UserRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class Login {
  constructor(private userRepository: UserRepository) {}

  async execute(input: { email: string; password?: string }): Promise<{ token: string }> {
    const { email, password } = input;

    if (!password) {
      throw new Error('Password is required');
    }

    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '1d',
    });

    return { token };
  }
}
```

---

## src/application/use-cases/LogMood.ts

```typescript
import { MoodLog } from '../../domain/entities/MoodLog';
import { MoodLogRepository } from '../../domain/repositories/MoodLogRepository';

export class LogMood {
  constructor(private moodLogRepository: MoodLogRepository) {}

  async execute(input: { userId: string; mood: string }): Promise<MoodLog> {
    const { userId, mood } = input;
    const moodLog: Omit<MoodLog, 'id' | 'createdAt'> = {
      userId,
      mood,
    };
    return this.moodLogRepository.logMood(moodLog);
  }
}
```

---

## src/application/use-cases/GetMoodHistory.ts

```typescript
import { MoodLog } from '../../domain/entities/MoodLog';
import { MoodLogRepository } from '../../domain/repositories/MoodLogRepository';

export class GetMoodHistory {
  constructor(private moodLogRepository: MoodLogRepository) {}

  async execute(input: { userId: string }): Promise<MoodLog[]> {
    return this.moodLogRepository.getMoodsByUserId(input.userId);
  }
}
```

---

## src/application/use-cases/CreateJournalEntry.ts

```typescript
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class CreateJournalEntry {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { userId: string; title: string; content: string }): Promise<JournalEntry> {
    const { userId, title, content } = input;
    const entry: Omit<JournalEntry, 'id' | 'createdAt'> = {
      userId,
      title,
      content,
    };
    return this.journalEntryRepository.createJournalEntry(entry);
  }
}
```

---

## src/application/use-cases/GetJournalEntries.ts

```typescript
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class GetJournalEntries {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { userId: string }): Promise<JournalEntry[]> {
    return this.journalEntryRepository.getJournalEntriesByUserId(input.userId);
  }
}
```

---

## src/application/use-cases/DeleteJournalEntry.ts

```typescript
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class DeleteJournalEntry {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { journalEntryId: string; userId: string }): Promise<void> {
    return this.journalEntryRepository.deleteJournalEntry(input.journalEntryId, input.userId);
  }
}
```

---

## src/application/use-cases/UpdateJournalEntry.ts

```typescript
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class UpdateJournalEntry {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { journalEntryId: string; userId: string; title?: string; content?: string }): Promise<JournalEntry> {
    const { journalEntryId, userId, title, content } = input;
    return this.journalEntryRepository.updateJournalEntry(journalEntryId, userId, { title, content });
  }
}
```

---

## src/application/use-cases/ChatWithAI.ts

```typescript
// src/application/use-cases/ChatWithAI.ts

import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatMessageRepository } from '../../domain/repositories/ChatMessageRepository';
import { generateText } from '../../infrastructure/gemini';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid if not already installed.

export class ChatWithAI {
  constructor(private chatMessageRepository: ChatMessageRepository) {}

  async execute(userId: string, message: string): Promise<ChatMessage> {
    // Save user message
    const userChatMessage: ChatMessage = {
      id: uuidv4(),
      userId,
      text: message,
      sender: 'USER',
      createdAt: new Date(),
    };
    await this.chatMessageRepository.save(userChatMessage);

    // Get chat history for context (optional, but good for conversational AI)
    const chatHistory = await this.chatMessageRepository.findByUserId(userId);
    const context = chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const prompt = `${context}\nUSER: ${message}\nAI:`

    // Get AI response
    const aiResponseText = await generateText(prompt);

    // Save AI response
    const aiChatMessage: ChatMessage = {
      id: uuidv4(),
      userId,
      text: aiResponseText,
      sender: 'AI',
      createdAt: new Date(),
    };
    await this.chatMessageRepository.save(aiChatMessage);

    return aiChatMessage;
  }
}
```

---

## src/scripts/test-flow.ts

```typescript
import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import { appRouter } from '../main';
import prisma from '../infrastructure/database/prisma';

async function run() {
  try {
    console.log('Starting smoke test...');

    // Clean up any previous test user
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });

    // 1) Unauthenticated context
    const unauthCtx = { req: {} as any, res: {} as any, user: null };
    const caller = appRouter.createCaller(unauthCtx as any);

    // 2) Register
    console.log('Registering user...');
    const createdUser = await caller.createUser({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    console.log('Created user:', createdUser.email);

    // 3) Login
    console.log('Logging in...');
    const loginResult = await caller.login({ email: 'test@example.com', password: 'password123' });
    console.log('Received token');

    const token = loginResult.token;

    // 4) Build authenticated context
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    const authCtx = { req: {} as any, res: {} as any, user: { id: decoded.id } };
    const authCaller = appRouter.createCaller(authCtx as any);

    // 5) Log Mood
    console.log('Logging mood...');
    const mood = await authCaller.logMood({ mood: 'Anxious' });
    console.log('Logged mood id:', mood.id);

    // 6) AI Chat (only if GEMINI_API_KEY is set)
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set, skipping AI chat step.');
    } else {
      console.log('Sending chat message to AI...');
      const aiResponse = await authCaller.chat.sendMessage({ message: 'I feel anxious about my job' });
      console.log('AI Response:', aiResponse);
    }

    console.log('Smoke test completed successfully.');
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exitCode = 1;
  } finally {
    // Optional cleanup could go here
    await prisma.$disconnect();
  }
}

run();
```

---

## Smoke test result

- The smoke test was executed locally using `npm run test:flow`.
- Result: user was registered, login succeeded, mood logged. The AI step was skipped because `GEMINI_API_KEY` was not set.

# End of file

If you'd like, I can also add a short README with quick reproduction steps (install, set .env, run prisma migrate, start server) or provide a compressed export of these files. Let me know which you prefer.

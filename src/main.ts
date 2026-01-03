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

export const appRouter = router({
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
  // Return current authenticated user (id from token)
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});

export type AppRouter = typeof appRouter;

const app = express();
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

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

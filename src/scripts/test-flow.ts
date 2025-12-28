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
      const aiResponse = await authCaller.chat.sendMessage({ userId: decoded.id, message: 'I feel anxious about my job' });
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

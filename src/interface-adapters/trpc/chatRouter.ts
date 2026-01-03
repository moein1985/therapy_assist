// src/interface-adapters/trpc/chatRouter.ts

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './trpc';
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

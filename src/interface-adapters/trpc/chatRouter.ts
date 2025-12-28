// src/interface-adapters/trpc/chatRouter.ts

import { z } from 'zod';
import { publicProcedure, router } from './trpc';
import { ChatWithAI } from '../../application/use-cases/ChatWithAI';
import { PrismaChatMessageRepository } from '../../infrastructure/repositories/PrismaChatMessageRepository';
import { prisma } from '../../infrastructure/database/prisma';

// Initialize repository and use case
const chatMessageRepository = new PrismaChatMessageRepository(prisma);
const chatWithAI = new ChatWithAI(chatMessageRepository);

export const chatRouter = router({
  sendMessage: publicProcedure
    .input(z.object({
      userId: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const aiResponse = await chatWithAI.execute(input.userId, input.message);
      return aiResponse;
    }),
});

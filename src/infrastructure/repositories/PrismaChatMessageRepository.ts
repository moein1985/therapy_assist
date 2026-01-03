// src/infrastructure/repositories/PrismaChatMessageRepository.ts

import { PrismaClient, SenderType, Conversation, ChatMessage } from '@prisma/client';

export class PrismaChatMessageRepository {
  constructor(private prisma: PrismaClient) {}

export class PrismaChatMessageRepository {
  constructor(private prisma: PrismaClient) {}

  // Find or Create Active Conversation
  async findOrCreateActiveConversation(userId: string): Promise<Conversation> {
    let conversation = await this.prisma.conversation.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' }
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { userId, status: 'ACTIVE' }
      });
    }
    return conversation;
  }

  async save(data: { conversationId: string; text: string; sender: SenderType; tokenUsage?: any }) {
    return this.prisma.chatMessage.create({ data });
  }

  // Find messages for the current active conversation context
  async findByUserId(userId: string): Promise<ChatMessage[]> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    return conversation?.messages || [];
  }
}

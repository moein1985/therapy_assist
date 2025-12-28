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
    return createdChatMessage;
  }

  async findByUserId(userId: string): Promise<ChatMessage[]> {
    const chatMessages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return chatMessages;
  }
}

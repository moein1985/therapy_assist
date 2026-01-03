// src/application/use-cases/ChatWithAI.ts

import { PrismaChatMessageRepository } from '../../infrastructure/repositories/PrismaChatMessageRepository';
import { generateText, AIMessage } from '../../infrastructure/gemini';
import prisma from '../../infrastructure/database/prisma';

const SYSTEM_INSTRUCTION = "شما یک روانشناس دلسوز و حرفه‌ای با رویکرد درمان شناختی-رفتاری (CBT) هستید. پاسخ‌های شما باید کوتاه، همدلانه، بدون قضاوت و به زبان فارسی صمیمی باشد. لطفا راهکارهای عملی کوچک پیشنهاد دهید.";

export class ChatWithAI {
  constructor(private repo: PrismaChatMessageRepository) {}

  async execute(userId: string, userMessage: string) {
    // 1. Get/Create Session
    const conversation = await this.repo.findOrCreateActiveConversation(userId);

    // 2. Save User Message
    await this.repo.save({
      conversationId: conversation.id,
      text: userMessage,
      sender: 'USER'
    });

    // 3. Prepare Context (Last 20 messages for context window)
    const history = await this.repo.findByUserId(userId);
    
    const apiMessages: AIMessage[] = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...history.slice(-20).map(msg => ({
        role: msg.sender === 'USER' ? 'user' : 'assistant', // Map Enums to API roles
        content: msg.text
      } as AIMessage))
    ];

    // 4. Call AI
    const response = await generateText(apiMessages);

    // 5. Save AI Message
    const savedAiMsg = await this.repo.save({
      conversationId: conversation.id,
      text: response.content,
      sender: 'AI',
      tokenUsage: response.usage ?? {}
    });

    // 6. Log Tokens (Billing/Usage Tracking)
    if (response.usage) {
      await prisma.tokenLog.create({
        data: {
          userId,
          conversationId: conversation.id,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          modelName: process.env.AI_MODEL_NAME || 'gemini-1.5-pro'
        }
      });
    }

    return savedAiMsg;
  }
}

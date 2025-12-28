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

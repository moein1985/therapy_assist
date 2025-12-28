// src/domain/repositories/ChatMessageRepository.ts

import { ChatMessage } from '../entities/ChatMessage';

export interface ChatMessageRepository {
  save(chatMessage: ChatMessage): Promise<ChatMessage>;
  findByUserId(userId: string): Promise<ChatMessage[]>;
}

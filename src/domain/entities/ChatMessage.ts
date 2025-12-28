// src/domain/entities/ChatMessage.ts

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  sender: 'USER' | 'AI';
  createdAt: Date;
}

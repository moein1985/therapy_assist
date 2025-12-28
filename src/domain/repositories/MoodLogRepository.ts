import { MoodLog } from '../entities/MoodLog';

export interface MoodLogRepository {
  logMood(moodLog: Omit<MoodLog, 'id' | 'createdAt'>): Promise<MoodLog>;
  getMoodsByUserId(userId: string): Promise<MoodLog[]>;
}

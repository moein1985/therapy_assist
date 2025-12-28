import { MoodLog } from '../../domain/entities/MoodLog';
import { MoodLogRepository } from '../../domain/repositories/MoodLogRepository';

export class LogMood {
  constructor(private moodLogRepository: MoodLogRepository) {}

  async execute(input: { userId: string; mood: string }): Promise<MoodLog> {
    const { userId, mood } = input;
    const moodLog: Omit<MoodLog, 'id' | 'createdAt'> = {
      userId,
      mood,
    };
    return this.moodLogRepository.logMood(moodLog);
  }
}

import { MoodLog } from '../../domain/entities/MoodLog';
import { MoodLogRepository } from '../../domain/repositories/MoodLogRepository';

export class GetMoodHistory {
  constructor(private moodLogRepository: MoodLogRepository) {}

  async execute(input: { userId: string }): Promise<MoodLog[]> {
    return this.moodLogRepository.getMoodsByUserId(input.userId);
  }
}

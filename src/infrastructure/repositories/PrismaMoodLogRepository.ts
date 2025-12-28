import { MoodLogRepository } from '../../domain/repositories/MoodLogRepository';
import { MoodLog } from '../../domain/entities/MoodLog';
import prisma from '../database/prisma';

export class PrismaMoodLogRepository implements MoodLogRepository {
  async logMood(moodLog: Omit<MoodLog, 'id' | 'createdAt'>): Promise<MoodLog> {
    return prisma.moodLog.create({
      data: moodLog,
    });
  }

  async getMoodsByUserId(userId: string): Promise<MoodLog[]> {
    return prisma.moodLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

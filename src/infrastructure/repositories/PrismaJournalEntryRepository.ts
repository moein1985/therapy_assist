import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import prisma from '../database/prisma';

export class PrismaJournalEntryRepository implements JournalEntryRepository {
  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry> {
    return prisma.journalEntry.create({
      data: entry,
    });
  }

  async getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]> {
    return prisma.journalEntry.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteJournalEntry(journalEntryId: string, userId: string): Promise<void> {
    await prisma.journalEntry.deleteMany({
      where: {
        id: journalEntryId,
        userId,
      },
    });
  }

  async updateJournalEntry(journalEntryId: string, userId: string, data: { title?: string; content?: string }): Promise<JournalEntry> {
    return prisma.journalEntry.update({
      where: {
        id: journalEntryId,
        userId,
      },
      data,
    });
  }
}

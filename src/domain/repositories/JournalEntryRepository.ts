import { JournalEntry } from '../entities/JournalEntry';

export interface JournalEntryRepository {
  createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry>;
  getJournalEntriesByUserId(userId: string): Promise<JournalEntry[]>;
  deleteJournalEntry(journalEntryId: string, userId: string): Promise<void>;
  updateJournalEntry(journalEntryId: string, userId: string, data: { title?: string; content?: string }): Promise<JournalEntry>;
}

import { JournalEntry } from '../../domain/entities/JournalEntry';
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class UpdateJournalEntry {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { journalEntryId: string; userId: string; title?: string; content?: string }): Promise<JournalEntry> {
    const { journalEntryId, userId, title, content } = input;
    return this.journalEntryRepository.updateJournalEntry(journalEntryId, userId, { title, content });
  }
}

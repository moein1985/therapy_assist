import { JournalEntry } from '../../domain/entities/JournalEntry';
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class CreateJournalEntry {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { userId: string; title: string; content: string }): Promise<JournalEntry> {
    const { userId, title, content } = input;
    const entry: Omit<JournalEntry, 'id' | 'createdAt'> = {
      userId,
      title,
      content,
    };
    return this.journalEntryRepository.createJournalEntry(entry);
  }
}

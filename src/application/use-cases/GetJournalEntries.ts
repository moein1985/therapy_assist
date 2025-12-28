import { JournalEntry } from '../../domain/entities/JournalEntry';
import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class GetJournalEntries {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { userId: string }): Promise<JournalEntry[]> {
    return this.journalEntryRepository.getJournalEntriesByUserId(input.userId);
  }
}

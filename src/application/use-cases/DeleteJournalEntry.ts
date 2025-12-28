import { JournalEntryRepository } from '../../domain/repositories/JournalEntryRepository';

export class DeleteJournalEntry {
  constructor(private journalEntryRepository: JournalEntryRepository) {}

  async execute(input: { journalEntryId: string; userId: string }): Promise<void> {
    return this.journalEntryRepository.deleteJournalEntry(input.journalEntryId, input.userId);
  }
}

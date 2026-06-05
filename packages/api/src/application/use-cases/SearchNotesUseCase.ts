import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { NoteDto } from '../dtos/NoteDto';
import { toNoteDto } from './mappers';

export class SearchNotesUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(query: string): Promise<NoteDto[]> {
    const term = query.trim().toLowerCase();
    if (term.length === 0) {
      return [];
    }

    const notes = await this.noteRepository.findAll();
    return notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(term) ||
          note.content.toLowerCase().includes(term)
      )
      .map(toNoteDto);
  }
}

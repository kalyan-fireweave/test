import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { NoteDto } from '../dtos/NoteDto';
import { toNoteDto } from './mappers';

export class ListNotesUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(): Promise<NoteDto[]> {
    const notes = await this.noteRepository.findAll();
    return notes.map(toNoteDto);
  }
}

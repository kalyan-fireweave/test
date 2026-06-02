import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { NoteDto } from '../dtos/NoteDto';
import { toNoteDto } from './mappers';

export class NoteNotFoundError extends Error {
  constructor(id: string) {
    super(`Note with id "${id}" not found`);
    this.name = 'NoteNotFoundError';
  }
}

export class GetNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(id: string): Promise<NoteDto> {
    const note = await this.noteRepository.findById(id);
    if (!note) throw new NoteNotFoundError(id);
    return toNoteDto(note);
  }
}

import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { NoteNotFoundError } from './GetNoteUseCase';

export class DeleteNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.noteRepository.delete(id);
    if (!deleted) throw new NoteNotFoundError(id);
  }
}

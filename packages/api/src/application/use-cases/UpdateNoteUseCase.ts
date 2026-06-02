import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { UpdateNoteDto, NoteDto } from '../dtos/NoteDto';
import { NoteNotFoundError } from './GetNoteUseCase';
import { toNoteDto } from './mappers';

export class UpdateNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(id: string, dto: UpdateNoteDto): Promise<NoteDto> {
    const updated = await this.noteRepository.update(id, dto);
    if (!updated) throw new NoteNotFoundError(id);
    return toNoteDto(updated);
  }
}

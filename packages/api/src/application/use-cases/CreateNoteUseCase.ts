import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { validateNoteInput } from '../../domain/entities/Note';
import { CreateNoteDto, NoteDto } from '../dtos/NoteDto';
import { toNoteDto } from './mappers';

export class CreateNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(dto: CreateNoteDto): Promise<NoteDto> {
    validateNoteInput({ title: dto.title, content: dto.content });
    const note = await this.noteRepository.create({
      title: dto.title.trim(),
      content: dto.content,
    });
    return toNoteDto(note);
  }
}

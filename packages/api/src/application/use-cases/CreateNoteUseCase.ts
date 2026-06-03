import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { validateNoteInput } from '../../domain/entities/Note';
import { CreateNoteDto, NoteDto } from '../dtos/NoteDto';
import { toNoteDto } from './mappers';
import { isFeatureEnabled, posthog } from '../../infrastructure/featureFlags';

export class CreateNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(dto: CreateNoteDto): Promise<NoteDto> {
    validateNoteInput({ title: dto.title, content: dto.content });
    const variant = await isFeatureEnabled('notes-collaboration', dto.title);
    if (variant) {
      const t0 = Date.now();
      try {
        posthog.capture(dto.title, 'feature.notes-collaboration.adopted');
        // TODO: initialise collaborative session on creation
        const note = await this.noteRepository.create({
          title: dto.title.trim(),
          content: dto.content,
        });
        posthog.capture(dto.title, 'feature.notes-collaboration.duration_ms', { ms: Date.now() - t0 });
        return toNoteDto(note);
      } catch (err) {
        posthog.capture(dto.title, 'feature.notes-collaboration.error');
        throw err;
      }
    }
    const note = await this.noteRepository.create({
      title: dto.title.trim(),
      content: dto.content,
    });
    return toNoteDto(note);
  }
}

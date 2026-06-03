import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { UpdateNoteDto, NoteDto } from '../dtos/NoteDto';
import { NoteNotFoundError } from './GetNoteUseCase';
import { toNoteDto } from './mappers';
import { isFeatureEnabled, posthog } from '../../infrastructure/featureFlags';

export class UpdateNoteUseCase {
  constructor(private readonly noteRepository: INoteRepository) {}

  async execute(id: string, dto: UpdateNoteDto): Promise<NoteDto> {
    const variant = await isFeatureEnabled('notes-collaboration', id);
    if (variant) {
      const t0 = Date.now();
      try {
        posthog.capture(id, 'feature.notes-collaboration.adopted');
        // TODO: replace with collaborative update path
        const updated = await this.noteRepository.update(id, dto);
        if (!updated) throw new NoteNotFoundError(id);
        posthog.capture(id, 'feature.notes-collaboration.duration_ms', { ms: Date.now() - t0 });
        return toNoteDto(updated);
      } catch (err) {
        posthog.capture(id, 'feature.notes-collaboration.error');
        throw err;
      }
    }
    const updated = await this.noteRepository.update(id, dto);
    if (!updated) throw new NoteNotFoundError(id);
    return toNoteDto(updated);
  }
}

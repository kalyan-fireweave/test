import { Note } from '../../domain/entities/Note';
import { NoteDto } from '../dtos/NoteDto';

export function toNoteDto(note: Note): NoteDto {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

import { Note, CreateNoteInput, UpdateNoteInput } from '../entities/Note';

export interface INoteRepository {
  findAll(): Promise<Note[]>;
  findById(id: string): Promise<Note | null>;
  create(input: CreateNoteInput): Promise<Note>;
  update(id: string, input: UpdateNoteInput): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}

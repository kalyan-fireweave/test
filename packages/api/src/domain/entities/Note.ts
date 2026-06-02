export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

export class NoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoteValidationError';
  }
}

export function validateNoteInput(input: CreateNoteInput): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new NoteValidationError('Title is required');
  }
  if (input.title.length > 255) {
    throw new NoteValidationError('Title must be 255 characters or fewer');
  }
}

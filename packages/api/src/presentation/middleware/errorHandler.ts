import { Request, Response, NextFunction } from 'express';
import { NoteValidationError } from '../../domain/entities/Note';
import { NoteNotFoundError } from '../../application/use-cases/GetNoteUseCase';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof NoteNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof NoteValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

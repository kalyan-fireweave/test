import { Request, Response, NextFunction } from 'express';
import { ListNotesUseCase } from '../../application/use-cases/ListNotesUseCase';
import { GetNoteUseCase } from '../../application/use-cases/GetNoteUseCase';
import { CreateNoteUseCase } from '../../application/use-cases/CreateNoteUseCase';
import { UpdateNoteUseCase } from '../../application/use-cases/UpdateNoteUseCase';
import { DeleteNoteUseCase } from '../../application/use-cases/DeleteNoteUseCase';

export class NoteController {
  constructor(
    private readonly listNotes: ListNotesUseCase,
    private readonly getNote: GetNoteUseCase,
    private readonly createNote: CreateNoteUseCase,
    private readonly updateNote: UpdateNoteUseCase,
    private readonly deleteNote: DeleteNoteUseCase
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notes = await this.listNotes.execute();
      res.json(notes);
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await this.getNote.execute(req.params.id);
      res.json(note);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await this.createNote.execute(req.body);
      res.status(201).json(note);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await this.updateNote.execute(req.params.id, req.body);
      res.json(note);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteNote.execute(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

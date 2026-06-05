import { Request, Response, NextFunction } from 'express';
import { ListNotesUseCase } from '../../application/use-cases/ListNotesUseCase';
import { GetNoteUseCase } from '../../application/use-cases/GetNoteUseCase';
import { CreateNoteUseCase } from '../../application/use-cases/CreateNoteUseCase';
import { UpdateNoteUseCase } from '../../application/use-cases/UpdateNoteUseCase';
import { DeleteNoteUseCase } from '../../application/use-cases/DeleteNoteUseCase';
import { SearchNotesUseCase } from '../../application/use-cases/SearchNotesUseCase';
import { isFeatureEnabled, posthog } from '../../infrastructure/featureFlags';

export class NoteController {
  constructor(
    private readonly listNotes: ListNotesUseCase,
    private readonly getNote: GetNoteUseCase,
    private readonly createNote: CreateNoteUseCase,
    private readonly updateNote: UpdateNoteUseCase,
    private readonly deleteNote: DeleteNoteUseCase,
    private readonly searchNotes: SearchNotesUseCase
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notes = await this.listNotes.execute();
      res.json(notes);
    } catch (err) {
      next(err);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // [note-full-text-search] flag-gated rollout: new code path guarded by
    // the note-full-text-search flag, cohort-keyed on the X-User-Id header.
    const cohortKey = req.header('x-user-id') ?? 'anonymous';
    const variantOn = await isFeatureEnabled('note-full-text-search', cohortKey);

    if (variantOn) {
      const startedAt = Date.now();
      try {
        posthog.capture({
          distinctId: cohortKey,
          event: 'feature.note-full-text-search.adopted',
        });

        const query = typeof req.query.q === 'string' ? req.query.q : '';
        const results = await this.searchNotes.execute(query);
        res.json(results);

        posthog.capture({
          distinctId: cohortKey,
          event: 'feature.note-full-text-search.duration_ms',
          properties: { ms: Date.now() - startedAt },
        });
      } catch (err) {
        posthog.capture({
          distinctId: cohortKey,
          event: 'feature.note-full-text-search.error',
        });
        next(err);
      }
    } else {
      // Baseline: search is not enabled for this cohort.
      res.status(404).json({ error: 'Not found' });
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

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PostgresNoteRepository } from '../infrastructure/repositories/PostgresNoteRepository';
import { ListNotesUseCase } from '../application/use-cases/ListNotesUseCase';
import { GetNoteUseCase } from '../application/use-cases/GetNoteUseCase';
import { CreateNoteUseCase } from '../application/use-cases/CreateNoteUseCase';
import { UpdateNoteUseCase } from '../application/use-cases/UpdateNoteUseCase';
import { DeleteNoteUseCase } from '../application/use-cases/DeleteNoteUseCase';
import { SearchNotesUseCase } from '../application/use-cases/SearchNotesUseCase';
import { NoteController } from './controllers/NoteController';
import { createNoteRouter } from './routes/noteRoutes';
import { errorHandler } from './middleware/errorHandler';

export async function createApp(pool: Pool): Promise<express.Application> {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Dependency wiring
  const noteRepo = new PostgresNoteRepository(pool);
  const controller = new NoteController(
    new ListNotesUseCase(noteRepo),
    new GetNoteUseCase(noteRepo),
    new CreateNoteUseCase(noteRepo),
    new UpdateNoteUseCase(noteRepo),
    new DeleteNoteUseCase(noteRepo),
    new SearchNotesUseCase(noteRepo)
  );

  app.use('/api/notes', await createNoteRouter(controller));
  app.use(errorHandler);

  return app;
}

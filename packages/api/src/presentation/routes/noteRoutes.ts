import { Router } from 'express';
import { NoteController } from '../controllers/NoteController';

export function createNoteRouter(controller: NoteController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

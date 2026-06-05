import { Router } from 'express';
import { NoteController } from '../controllers/NoteController';
import { isFeatureEnabled } from '../../infrastructure/featureFlags';

export async function createNoteRouter(controller: NoteController): Promise<Router> {
  const router = Router();

  router.get('/', controller.list);

  // [note-full-text-search] flag-gated rollout: register the search route only
  // when the flag is enabled at boot. Placed before '/:id' so '/search' wins.
  const searchEnabled = await isFeatureEnabled('note-full-text-search', 'anonymous');
  if (searchEnabled) {
    router.get('/search', controller.search);
  }

  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.delete);

  const collaborationEnabled = await isFeatureEnabled('notes-collaboration', 'anonymous');
  if (collaborationEnabled) {
    // TODO: register WebSocket upgrade and collaboration-specific REST routes
    // router.get('/:id/session', collaborationController.getSession);
  }

  return router;
}

import { writable } from 'svelte/store';
// TODO: migrate to Fireweave RPC telemetry — replace posthog-js direct import with Fireweave evaluation SDK
import posthog from 'posthog-js';
import type { Note } from '../types';
import { notesApi } from '../api/notes';
import { isFeatureEnabled } from '../featureFlags';

function createNotesStore() {
  const { subscribe, set, update } = writable<Note[]>([]);

  return {
    subscribe,
    async load() {
      const notes = await notesApi.list();
      set(notes);
    },
    async create(title: string, content: string) {
      const variant = await isFeatureEnabled('notes-collaboration', 'anonymous');
      if (variant) {
        const t0 = Date.now();
        try {
          posthog.capture('feature.notes-collaboration.adopted'); // TODO: migrate to Fireweave RPC telemetry
          // TODO: create note via collaborative session
          const note = await notesApi.create({ title, content });
          posthog.capture('feature.notes-collaboration.duration_ms', { ms: Date.now() - t0 }); // TODO: migrate to Fireweave RPC telemetry
          update(notes => [note, ...notes]);
          return note;
        } catch (err) {
          posthog.capture('feature.notes-collaboration.error'); // TODO: migrate to Fireweave RPC telemetry
          throw err;
        }
      }
      const note = await notesApi.create({ title, content });
      update(notes => [note, ...notes]);
      return note;
    },
    async update(id: string, title: string, content: string) {
      const variant = await isFeatureEnabled('notes-collaboration', 'anonymous');
      if (variant) {
        const t0 = Date.now();
        try {
          posthog.capture('feature.notes-collaboration.adopted'); // TODO: migrate to Fireweave RPC telemetry
          // TODO: broadcast update via collaborative socket
          const updated = await notesApi.update(id, { title, content });
          posthog.capture('feature.notes-collaboration.duration_ms', { ms: Date.now() - t0 }); // TODO: migrate to Fireweave RPC telemetry
          update(notes => notes.map(n => (n.id === id ? updated : n)));
          return updated;
        } catch (err) {
          posthog.capture('feature.notes-collaboration.error'); // TODO: migrate to Fireweave RPC telemetry
          throw err;
        }
      }
      const updated = await notesApi.update(id, { title, content });
      update(notes => notes.map(n => (n.id === id ? updated : n)));
      return updated;
    },
    async delete(id: string) {
      await notesApi.delete(id);
      update(notes => notes.filter(n => n.id !== id));
    },
  };
}

export const notes = createNotesStore();

import { writable } from 'svelte/store';
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
      const variant = await isFeatureEnabled('notes-collaboration', sessionStorage.getItem('sessionId') ?? 'anonymous');
      if (variant) {
        // TODO: create note via collaborative session
        const note = await notesApi.create({ title, content });
        update(notes => [note, ...notes]);
        return note;
      }
      const note = await notesApi.create({ title, content });
      update(notes => [note, ...notes]);
      return note;
    },
    async update(id: string, title: string, content: string) {
      const variant = await isFeatureEnabled('notes-collaboration', sessionStorage.getItem('sessionId') ?? 'anonymous');
      if (variant) {
        // TODO: broadcast update via collaborative socket
        const updated = await notesApi.update(id, { title, content });
        update(notes => notes.map(n => (n.id === id ? updated : n)));
        return updated;
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

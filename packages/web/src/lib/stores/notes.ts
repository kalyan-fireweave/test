import { writable } from 'svelte/store';
import type { Note } from '../types';
import { notesApi } from '../api/notes';

function createNotesStore() {
  const { subscribe, set, update } = writable<Note[]>([]);

  return {
    subscribe,
    async load() {
      const notes = await notesApi.list();
      set(notes);
    },
    async create(title: string, content: string) {
      const note = await notesApi.create({ title, content });
      update(notes => [note, ...notes]);
      return note;
    },
    async update(id: string, title: string, content: string) {
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

import type { Note, CreateNotePayload, UpdateNotePayload } from '../types';

const BASE = '/api/notes';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const notesApi = {
  list: (): Promise<Note[]> => request<Note[]>(BASE),
  get: (id: string): Promise<Note> => request<Note>(`${BASE}/${id}`),
  create: (payload: CreateNotePayload): Promise<Note> =>
    request<Note>(BASE, { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: UpdateNotePayload): Promise<Note> =>
    request<Note>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string): Promise<void> =>
    request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};

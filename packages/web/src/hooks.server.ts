import type { Handle } from '@sveltejs/kit';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3001';

export const handle: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith('/api/')) {
    return resolve(event);
  }

  const target = `${API_ORIGIN}${event.url.pathname}${event.url.search}`;
  const method = event.request.method;
  const headers = new Headers(event.request.headers);
  headers.delete('host');

  return fetch(target, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : await event.request.text(),
  });
};

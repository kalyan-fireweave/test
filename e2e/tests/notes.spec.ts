import { test, expect, request } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

// Clean up notes before each test via the API
test.beforeEach(async () => {
  const ctx = await request.newContext({ baseURL: API_URL });
  const notes = await ctx.get('/api/notes');
  const list = await notes.json();
  await Promise.all(
    list.map((n: { id: string }) => ctx.delete(`/api/notes/${n.id}`))
  );
  await ctx.dispose();
});

test.describe('Notes App', () => {
  test('shows empty state on first load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/No notes yet/i)).toBeVisible();
  });

  test('creates a new note', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('new-note-btn').click();

    await expect(page.getByTestId('note-form')).toBeVisible();

    await page.getByTestId('note-title-input').fill('My First Note');
    await page.getByTestId('note-content-input').fill('Hello, world!');
    await page.getByTestId('save-note-btn').click();

    await expect(page.getByTestId('note-detail-title')).toHaveText('My First Note');
    await expect(page.getByTestId('note-detail-content')).toHaveText('Hello, world!');
    await expect(page.getByTestId('note-item')).toHaveCount(1);
  });

  test('shows validation error when title is empty', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('new-note-btn').click();
    await page.getByTestId('save-note-btn').click();

    await expect(page.getByText(/title is required/i)).toBeVisible();
  });

  test('edits an existing note', async ({ page }) => {
    // Create via API first
    const ctx = await request.newContext({ baseURL: API_URL });
    await ctx.post('/api/notes', {
      data: { title: 'Original Title', content: 'Original content' },
    });
    await ctx.dispose();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('note-item').first().click();
    await page.getByTestId('edit-note-btn').click();

    await expect(page.getByTestId('note-form')).toBeVisible();

    await page.getByTestId('note-title-input').fill('Updated Title');
    await page.getByTestId('note-content-input').fill('Updated content');
    await page.getByTestId('save-note-btn').click();

    await expect(page.getByTestId('note-detail-title')).toHaveText('Updated Title');
    await expect(page.getByTestId('note-detail-content')).toHaveText('Updated content');
  });

  test('deletes a note', async ({ page }) => {
    const ctx = await request.newContext({ baseURL: API_URL });
    await ctx.post('/api/notes', {
      data: { title: 'Note to Delete', content: 'Delete me' },
    });
    await ctx.dispose();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('note-item').first().click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByTestId('delete-note-btn').click();

    await expect(page.getByTestId('note-item')).toHaveCount(0);
    await expect(page.getByText(/No notes yet/i)).toBeVisible();
  });

  test('lists multiple notes in the sidebar', async ({ page }) => {
    const ctx = await request.newContext({ baseURL: API_URL });
    await ctx.post('/api/notes', { data: { title: 'Note A', content: '' } });
    await ctx.post('/api/notes', { data: { title: 'Note B', content: '' } });
    await ctx.post('/api/notes', { data: { title: 'Note C', content: '' } });
    await ctx.dispose();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('note-item')).toHaveCount(3);
  });

  test('selects a note from sidebar', async ({ page }) => {
    const ctx = await request.newContext({ baseURL: API_URL });
    await ctx.post('/api/notes', { data: { title: 'Clickable Note', content: 'Click content' } });
    await ctx.dispose();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('note-item').first().click();

    await expect(page.getByTestId('note-detail-title')).toHaveText('Clickable Note');
    await expect(page.getByTestId('note-detail-content')).toHaveText('Click content');
  });
});

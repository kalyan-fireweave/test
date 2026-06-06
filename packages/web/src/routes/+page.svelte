<script lang="ts">
  import { onMount } from 'svelte';
  import { notes } from '$lib/stores/notes';
  import type { Note } from '$lib/types';
  import {
    initFeatureFlags,
    isFeatureEnabled,
    getCohortKey,
    captureFeatureEvent,
  } from '$lib/featureFlags';
  import { initSentry, captureFeatureError, measureSpan } from '$lib/sentry';

  const COPY_FLAG_KEY = 'copy-note-to-clipboard';
  const WORD_COUNT_FLAG_KEY = 'note-word-count';

  let selectedNote: Note | null = null;
  let isCreating = false;
  let isEditing = false;
  let loadError = '';

  // copy-note-to-clipboard rollout state. Safe default (flag off / eval
  // error) keeps the Copy button hidden so behaviour matches baseline.
  let copyEnabled = false;
  let copyStatus: 'idle' | 'copied' | 'failed' = 'idle';
  let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  // note-word-count rollout state. Safe default (flag off / eval error)
  // hides the badge so behaviour matches baseline. Adoption is tracked in
  // PostHog; errors and latency are monitored in Sentry.
  let wordCountEnabled = false;
  let wordCountLabel = '';

  // Form state
  let formTitle = '';
  let formContent = '';
  let formError = '';
  let saving = false;

  onMount(async () => {
    try {
      await notes.load();
    } catch {
      loadError = 'Failed to load notes. Is the API running?';
    }

    // copy-note-to-clipboard rollout: gate the Copy button behind the
    // Fireweave-managed flag. initFeatureFlags() is idempotent and called
    // here defensively because the page mounts before the layout's onMount.
    try {
      initFeatureFlags();
      copyEnabled = await isFeatureEnabled(COPY_FLAG_KEY, getCohortKey());
    } catch (err) {
      copyEnabled = false;
      captureFeatureEvent('feature.copy-note-to-clipboard.error', {
        message: err instanceof Error ? err.message : String(err),
        phase: 'evaluate',
      });
    }

    // note-word-count rollout: gate the word/char count badge behind the
    // Fireweave-managed flag. Sentry is initialised here (idempotent) so the
    // new code path's errors and latency are monitored. On eval failure the
    // safe default keeps the badge hidden and the error is sent to Sentry.
    try {
      initFeatureFlags();
      initSentry();
      wordCountEnabled = await isFeatureEnabled(WORD_COUNT_FLAG_KEY, getCohortKey());
    } catch (err) {
      wordCountEnabled = false;
      captureFeatureError('feature.note-word-count.error', err, { phase: 'evaluate' });
    }
  });

  // New code path guarded by note-word-count. Computes the live word/char
  // count inside a Sentry span (latency monitoring), emits the adoption
  // counter to PostHog, and routes any failure to Sentry.
  function computeWordCount(note: Note): void {
    const cohortKey = getCohortKey();
    measureSpan(
      'feature.note-word-count.duration_ms',
      () => {
        try {
          const trimmed = note.content.trim();
          const words = trimmed ? trimmed.split(/\s+/).length : 0;
          const chars = note.content.length;
          wordCountLabel = `${words} word${words === 1 ? '' : 's'} · ${chars} char${chars === 1 ? '' : 's'}`;
          captureFeatureEvent('feature.note-word-count.adopted', { cohortKey, words, chars });
        } catch (err) {
          wordCountLabel = '';
          captureFeatureError('feature.note-word-count.error', err, { cohortKey, phase: 'compute' });
        }
      },
      { cohortKey },
    );
  }

  // Recompute whenever the selected note changes while the flag is on.
  $: if (wordCountEnabled && selectedNote) computeWordCount(selectedNote);

  function startCreate() {
    selectedNote = null;
    isCreating = true;
    isEditing = false;
    formTitle = '';
    formContent = '';
    formError = '';
  }

  function startEdit(note: Note) {
    selectedNote = note;
    isEditing = true;
    isCreating = false;
    formTitle = note.title;
    formContent = note.content;
    formError = '';
  }

  function selectNote(note: Note) {
    selectedNote = note;
    isCreating = false;
    isEditing = false;
  }

  function cancelForm() {
    isCreating = false;
    isEditing = false;
    formError = '';
  }

  async function submitCreate() {
    if (!formTitle.trim()) { formError = 'Title is required.'; return; }
    saving = true;
    formError = '';
    try {
      const created = await notes.create(formTitle.trim(), formContent);
      selectedNote = created;
      isCreating = false;
    } catch (e) {
      formError = e instanceof Error ? e.message : 'Failed to create note.';
    } finally {
      saving = false;
    }
  }

  async function submitUpdate() {
    if (!selectedNote) return;
    if (!formTitle.trim()) { formError = 'Title is required.'; return; }
    saving = true;
    formError = '';
    try {
      const updated = await notes.update(selectedNote.id, formTitle.trim(), formContent);
      selectedNote = updated;
      isEditing = false;
    } catch (e) {
      formError = e instanceof Error ? e.message : 'Failed to update note.';
    } finally {
      saving = false;
    }
  }

  async function deleteNote(note: Note) {
    if (!confirm(`Delete "${note.title}"?`)) return;
    try {
      await notes.delete(note.id);
      if (selectedNote?.id === note.id) {
        selectedNote = null;
        isEditing = false;
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete note.');
    }
  }

  // New code path guarded by copy-note-to-clipboard. Copies the note's
  // title + body to the clipboard and emits cohort-keyed telemetry so the
  // controller can ramp safely.
  async function copyNote(note: Note) {
    const cohortKey = getCohortKey();
    const start = performance.now();
    clearTimeout(copyResetTimer);
    try {
      await navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
      copyStatus = 'copied';
      captureFeatureEvent('feature.copy-note-to-clipboard.adopted', { cohortKey });
      captureFeatureEvent('feature.copy-note-to-clipboard.duration_ms', {
        ms: performance.now() - start,
        cohortKey,
      });
    } catch (err) {
      copyStatus = 'failed';
      captureFeatureEvent('feature.copy-note-to-clipboard.error', {
        message: err instanceof Error ? err.message : String(err),
        phase: 'write',
        cohortKey,
      });
    } finally {
      copyResetTimer = setTimeout(() => (copyStatus = 'idle'), 2000);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }
</script>

<div class="layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">All Notes</span>
      <button class="btn-primary" on:click={startCreate} data-testid="new-note-btn">+ New</button>
    </div>

    {#if loadError}
      <p class="error-msg" style="padding:1rem">{loadError}</p>
    {:else if $notes.length === 0}
      <p class="empty">No notes yet. Create one!</p>
    {:else}
      <ul class="note-list">
        {#each $notes as note (note.id)}
          <li class="note-item" class:active={selectedNote?.id === note.id}>
            <button
              class="note-item-btn"
              on:click={() => selectNote(note)}
              data-testid="note-item"
            >
              <span class="note-item-title">{note.title}</span>
              <span class="note-item-date">{formatDate(note.updatedAt)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </aside>

  <!-- Main panel -->
  <section class="panel">
    {#if isCreating}
      <div class="note-form" data-testid="note-form">
        <h2>New Note</h2>
        <input
          type="text"
          placeholder="Title"
          bind:value={formTitle}
          data-testid="note-title-input"
        />
        <textarea
          placeholder="Start writing…"
          bind:value={formContent}
          data-testid="note-content-input"
          rows="12"
        />
        {#if formError}<p class="error-msg">{formError}</p>{/if}
        <div class="form-actions">
          <button class="btn-primary" on:click={submitCreate} disabled={saving} data-testid="save-note-btn">
            {saving ? 'Saving…' : 'Create Note'}
          </button>
          <button class="btn-ghost" on:click={cancelForm}>Cancel</button>
        </div>
      </div>

    {:else if isEditing && selectedNote}
      <div class="note-form" data-testid="note-form">
        <h2>Edit Note</h2>
        <input
          type="text"
          placeholder="Title"
          bind:value={formTitle}
          data-testid="note-title-input"
        />
        <textarea
          placeholder="Start writing…"
          bind:value={formContent}
          data-testid="note-content-input"
          rows="12"
        />
        {#if formError}<p class="error-msg">{formError}</p>{/if}
        <div class="form-actions">
          <button class="btn-primary" on:click={submitUpdate} disabled={saving} data-testid="save-note-btn">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button class="btn-ghost" on:click={cancelForm}>Cancel</button>
        </div>
      </div>

    {:else if selectedNote}
      {@const note = selectedNote}
      <div class="note-detail" data-testid="note-detail">
        <div class="note-detail-header">
          <h1 data-testid="note-detail-title">{note.title}</h1>
          <div class="note-detail-actions">
            {#if copyEnabled}
              <button
                class="btn-ghost"
                on:click={() => copyNote(note)}
                data-testid="copy-note-btn"
              >
                {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy'}
              </button>
            {/if}
            <button class="btn-ghost" on:click={() => startEdit(note)} data-testid="edit-note-btn">
              Edit
            </button>
            <button class="btn-danger" on:click={() => deleteNote(note)} data-testid="delete-note-btn">
              Delete
            </button>
          </div>
        </div>
        <p class="note-meta">
          Updated {formatDate(note.updatedAt)}
          {#if wordCountEnabled && wordCountLabel}
            <span class="word-count-badge" data-testid="word-count-badge">{wordCountLabel}</span>
          {/if}
        </p>
        <div class="note-content" data-testid="note-detail-content">{note.content}</div>
      </div>

    {:else}
      <div class="placeholder">
        <p>Select a note or <button class="link-btn" on:click={startCreate}>create a new one</button>.</p>
      </div>
    {/if}
  </section>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 0;
    height: calc(100vh - 56px);
    margin: -2rem -1.5rem;
  }

  .sidebar {
    border-right: 1px solid var(--border);
    overflow-y: auto;
    padding-bottom: 1rem;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem 0.75rem;
    position: sticky;
    top: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .sidebar-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .note-list {
    list-style: none;
    padding: 0.5rem 0;
  }

  .note-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: background 0.1s;
  }
  .note-item:hover { background: var(--surface-hover); }
  .note-item.active {
    background: var(--surface);
    border-left-color: var(--accent);
  }

  .note-item-btn {
    display: block;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
    color: inherit;
    border-radius: 0;
  }

  .note-item-title {
    display: block;
    font-size: 0.9375rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .note-item-date {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .empty {
    padding: 1.5rem 1rem;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .panel {
    overflow-y: auto;
    padding: 2rem 2.5rem;
  }

  .note-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 680px;
  }
  .note-form h2 {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  .note-detail { max-width: 680px; }
  .note-detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }
  .note-detail-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
  }
  .note-detail-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .note-meta {
    font-size: 0.8125rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
  }
  .word-count-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.0625rem 0.5rem;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .note-content {
    white-space: pre-wrap;
    line-height: 1.75;
    color: var(--text);
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    font-size: inherit;
    padding: 0;
    text-decoration: underline;
  }
</style>

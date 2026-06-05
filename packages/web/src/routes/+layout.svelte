<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import {
    initFeatureFlags,
    isFeatureEnabled,
    getCohortKey,
    captureFeatureEvent,
  } from '$lib/featureFlags';

  const FLAG_KEY = 'new-background-colors';

  // new-background-colors rollout: gate the alternate background palette
  // behind the Fireweave-managed flag. Safe default (flag off / eval error)
  // leaves the baseline dark theme in place.
  onMount(async () => {
    initFeatureFlags();
    const cohortKey = getCohortKey();
    const start = performance.now();
    try {
      const variantOn = await isFeatureEnabled(FLAG_KEY, cohortKey);
      if (variantOn) {
        // New code path: apply the "fresh" background palette.
        document.documentElement.setAttribute('data-bg-theme', 'fresh');
        captureFeatureEvent('feature.new-background-colors.adopted', { cohortKey });
        captureFeatureEvent('feature.new-background-colors.duration_ms', {
          ms: performance.now() - start,
        });
      }
      // Baseline branch (flag off): leave the default dark theme untouched.
    } catch (err) {
      captureFeatureEvent('feature.new-background-colors.error', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });
</script>

<div class="app">
  <header>
    <nav>
      <a href="/" class="brand">Notes</a>
    </nav>
  </header>

  <main>
    <slot />
  </main>
</div>

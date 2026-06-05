import posthog from 'posthog-js';

export function initFeatureFlags() {
  posthog.init(import.meta.env.VITE_POSTHOG_API_KEY ?? '', {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  });
}

export async function isFeatureEnabled(flagKey: string, _cohortKey?: string): Promise<boolean> {
  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/** Cohort/bucketing identifier for the current visitor. */
export function getCohortKey(): string | undefined {
  return posthog.get_distinct_id?.();
}

/** Emit a rollout telemetry event through the provider client. */
export function captureFeatureEvent(event: string, props?: Record<string, unknown>): void {
  posthog.capture(event, props);
}

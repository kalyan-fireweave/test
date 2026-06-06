import * as Sentry from '@sentry/sveltekit';

let initialized = false;

/**
 * Idempotent Sentry init for the browser. Safe to call on every mount.
 * No-ops when VITE_SENTRY_DSN is unset (e.g. local dev) so behaviour
 * matches baseline when Sentry isn't configured.
 */
export function initSentry(): void {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? 'production',
    tracesSampleRate: 1.0,
  });
  initialized = true;
}

/**
 * Route a feature's error/health signal to Sentry. Tagged with the
 * rollout telemetry event name so the controller's Sentry-backed
 * observability provider can query error rate per feature.
 */
export function captureFeatureError(
  event: string,
  err: unknown,
  context?: Record<string, unknown>,
): void {
  Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
    tags: { feature_event: event },
    extra: context,
  });
}

/**
 * Wrap the new code path in a Sentry span so p95 latency
 * (`feature.<flag>.duration_ms`) is observable through the
 * Sentry-backed metrics provider.
 */
export function measureSpan<T>(
  name: string,
  fn: () => T,
  attributes?: Record<string, number | string | boolean | undefined>,
): T {
  return Sentry.startSpan({ name, attributes }, fn);
}

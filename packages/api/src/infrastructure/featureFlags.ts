import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.POSTHOG_API_KEY ?? '', {
  host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
});

export async function isFeatureEnabled(flagKey: string, cohortKey: string): Promise<boolean> {
  const enabled = await client.isFeatureEnabled(flagKey, cohortKey);
  return enabled ?? false;
}

export { client as posthog };

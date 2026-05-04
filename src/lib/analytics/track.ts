type TierInterest = 'SOLO' | 'PRO' | null | undefined;

type BetaLeadProps = { tier?: TierInterest; source?: string | null };
type DemoRequestProps = { source?: string | null };

async function safeCapture(event: string, props: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    const { default: posthog } = await import('posthog-js');
    if (!posthog.__loaded) return;
    posthog.capture(event, props);
  } catch {
    // PostHog not available — silent no-op
  }
}

export async function trackBetaLeadSubmitted(props: BetaLeadProps = {}) {
  await safeCapture('beta_lead_submitted', {
    tier: props.tier ?? null,
    source: props.source ?? null,
  });
}

export async function trackDemoRequestSubmitted(props: DemoRequestProps = {}) {
  await safeCapture('demo_request_submitted', {
    source: props.source ?? null,
  });
}

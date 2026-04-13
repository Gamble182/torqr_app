interface OptInData {
  emailOptIn: 'CONFIRMED' | 'NONE';
  optInConfirmedAt: Date | null;
}

/**
 * Computes the emailOptIn status from form inputs.
 * Pure function — no DB access. Call this in API routes before writing to Prisma.
 *
 * Rules:
 * - No email (or whitespace) → NONE
 * - Email present + suppress = true → NONE (Max explicitly blocked)
 * - Email present + suppress = false → CONFIRMED (on-site consent from customer)
 */
export function computeOptInData(
  email: string | null | undefined,
  suppress: boolean
): OptInData {
  if (!email || email.trim() === '') {
    return { emailOptIn: 'NONE', optInConfirmedAt: null };
  }
  if (suppress) {
    return { emailOptIn: 'NONE', optInConfirmedAt: null };
  }
  return { emailOptIn: 'CONFIRMED', optInConfirmedAt: new Date() };
}

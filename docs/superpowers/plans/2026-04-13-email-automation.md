# Email Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build automated email reminders for heating maintenance appointments via Resend, with a weekly summary email to Max and customer unsubscribe flow.

**Architecture:** Layered `src/lib/email/` module — Resend client, opt-in logic, React Email templates, and a send service. Vercel Cron triggers two routes: daily (reminder checks) and weekly (summary). Unsubscribe uses HMAC-signed stateless tokens.

**Tech Stack:** Resend v6, @react-email/components v1, Vitest v2, date-fns v4, Prisma 7, Next.js 16 App Router

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/email/client.ts` | Create | Resend singleton |
| `src/lib/email/unsubscribe-token.ts` | Create | HMAC token generation + verification |
| `src/lib/email/opt-in.ts` | Create | Pure opt-in status computation |
| `src/lib/email/service.tsx` | Create | sendReminder(), sendWeeklySummary() |
| `src/lib/email/templates/ReminderEmail.tsx` | Create | Customer reminder template |
| `src/lib/email/templates/WeeklySummaryEmail.tsx` | Create | Weekly summary template for Max |
| `src/test/setup.ts` | Create | Vitest env var setup |
| `src/lib/email/__tests__/unsubscribe-token.test.ts` | Create | Token unit tests |
| `src/lib/email/__tests__/opt-in.test.ts` | Create | Opt-in logic unit tests |
| `src/app/api/cron/daily-reminders/route.ts` | Create | Vercel Cron daily job |
| `src/app/api/cron/weekly-summary/route.ts` | Create | Vercel Cron weekly job |
| `src/app/api/email/unsubscribe/[token]/route.ts` | Create | Unsubscribe POST handler |
| `src/app/unsubscribe/[token]/page.tsx` | Create | Public unsubscribe page |
| `src/lib/validations.ts` | Modify | Add suppressEmail field to customer schemas |
| `src/app/api/customers/route.ts` | Modify | Apply opt-in logic on POST |
| `src/app/api/customers/[id]/route.ts` | Modify | Apply opt-in logic on PATCH (guard UNSUBSCRIBED) |
| `src/app/dashboard/customers/new/page.tsx` | Modify | Add suppress toggle UI |
| `src/app/dashboard/customers/[id]/edit/page.tsx` | Modify | Add suppress toggle + status badge UI |
| `vercel.json` | Modify | Add cron schedules |
| `vitest.config.ts` | Create | Vitest configuration |
| `package.json` | Modify | Add test scripts |

---

## Task 1: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json`

- [ ] **Step 1.1: Install Vitest**

```bash
npm install -D vitest
```

Expected: `vitest` appears in `devDependencies` in `package.json`.

- [ ] **Step 1.2: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 1.3: Create test setup file**

```typescript
// src/test/setup.ts
process.env.UNSUBSCRIBE_SECRET = 'test-secret-for-testing-only-32chars';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.RESEND_API_KEY = 're_test_placeholder';
process.env.RESEND_FROM_EMAIL = 'noreply@torqr.de';
```

- [ ] **Step 1.4: Add test scripts to package.json**

In `package.json`, add to the `"scripts"` section:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 1.5: Write a smoke test to verify setup**

Create `src/test/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('resolves env vars from setup file', () => {
    expect(process.env.UNSUBSCRIBE_SECRET).toBeDefined();
  });
});
```

- [ ] **Step 1.6: Run to verify**

```bash
npx vitest run src/test/smoke.test.ts
```

Expected output: `1 passed`

- [ ] **Step 1.7: Commit**

```bash
git add vitest.config.ts src/test/setup.ts src/test/smoke.test.ts package.json
git commit -m "chore: add Vitest test infrastructure"
```

---

## Task 2: Unsubscribe Token Utility

**Files:**
- Create: `src/lib/email/unsubscribe-token.ts`
- Create: `src/lib/email/__tests__/unsubscribe-token.test.ts`

- [ ] **Step 2.1: Write failing tests first**

Create `src/lib/email/__tests__/unsubscribe-token.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
  parseUnsubscribePath,
} from '../unsubscribe-token';

describe('generateUnsubscribeToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateUnsubscribeToken('abc-123');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(generateUnsubscribeToken('abc-123')).toBe(generateUnsubscribeToken('abc-123'));
  });

  it('differs for different inputs', () => {
    expect(generateUnsubscribeToken('id-1')).not.toBe(generateUnsubscribeToken('id-2'));
  });
});

describe('verifyUnsubscribeToken', () => {
  it('returns true for a valid token', () => {
    const token = generateUnsubscribeToken('cust-xyz');
    expect(verifyUnsubscribeToken('cust-xyz', token)).toBe(true);
  });

  it('returns false for a wrong token', () => {
    expect(verifyUnsubscribeToken('cust-xyz', 'a'.repeat(64))).toBe(false);
  });

  it('returns false for a token from a different id', () => {
    const token = generateUnsubscribeToken('other-id');
    expect(verifyUnsubscribeToken('cust-xyz', token)).toBe(false);
  });
});

describe('parseUnsubscribePath', () => {
  it('splits customerId and token correctly', () => {
    const token = generateUnsubscribeToken('cust-123');
    const result = parseUnsubscribePath(`cust-123.${token}`);
    expect(result).toEqual({ customerId: 'cust-123', token });
  });

  it('returns null when no dot separator', () => {
    expect(parseUnsubscribePath('nodot')).toBeNull();
  });

  it('handles UUIDs with hyphens correctly', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const token = generateUnsubscribeToken(id);
    const result = parseUnsubscribePath(`${id}.${token}`);
    expect(result).toEqual({ customerId: id, token });
  });
});

describe('buildUnsubscribeUrl', () => {
  it('builds a URL with customerId and token', () => {
    const url = buildUnsubscribeUrl('cust-123');
    expect(url).toMatch(/^http:\/\/localhost:3000\/unsubscribe\//);
    expect(url).toContain('cust-123');
  });
});
```

- [ ] **Step 2.2: Run to verify tests fail**

```bash
npx vitest run src/lib/email/__tests__/unsubscribe-token.test.ts
```

Expected: `Cannot find module '../unsubscribe-token'`

- [ ] **Step 2.3: Implement the module**

Create `src/lib/email/unsubscribe-token.ts`:
```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not set');
  return secret;
}

export function generateUnsubscribeToken(customerId: string): string {
  return createHmac('sha256', getSecret()).update(customerId).digest('hex');
}

export function verifyUnsubscribeToken(customerId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(customerId);
  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const tokenBuf = Buffer.from(token, 'hex');
    if (expectedBuf.length !== tokenBuf.length) return false;
    return timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}

// Path format: "<customerId>.<hmacToken>"
// Using lastIndexOf to handle UUIDs (which contain hyphens but not dots)
export function buildUnsubscribePath(customerId: string): string {
  return `${customerId}.${generateUnsubscribeToken(customerId)}`;
}

export function parseUnsubscribePath(path: string): { customerId: string; token: string } | null {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return null;
  return {
    customerId: path.slice(0, dotIndex),
    token: path.slice(dotIndex + 1),
  };
}

export function buildUnsubscribeUrl(customerId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/unsubscribe/${buildUnsubscribePath(customerId)}`;
}
```

- [ ] **Step 2.4: Run tests — must pass**

```bash
npx vitest run src/lib/email/__tests__/unsubscribe-token.test.ts
```

Expected: `5 passed`

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/email/unsubscribe-token.ts src/lib/email/__tests__/unsubscribe-token.test.ts
git commit -m "feat: add HMAC-based unsubscribe token utility"
```

---

## Task 3: Opt-in Logic

**Files:**
- Create: `src/lib/email/opt-in.ts`
- Create: `src/lib/email/__tests__/opt-in.test.ts`

- [ ] **Step 3.1: Write failing tests**

Create `src/lib/email/__tests__/opt-in.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { computeOptInData } from '../opt-in';

describe('computeOptInData', () => {
  it('confirms opt-in when email present and suppress is false', () => {
    const result = computeOptInData('user@example.com', false);
    expect(result.emailOptIn).toBe('CONFIRMED');
    expect(result.optInConfirmedAt).toBeInstanceOf(Date);
  });

  it('sets NONE when suppress is true', () => {
    const result = computeOptInData('user@example.com', true);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });

  it('sets NONE when email is null', () => {
    const result = computeOptInData(null, false);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });

  it('sets NONE when email is empty string', () => {
    const result = computeOptInData('', false);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });

  it('sets NONE when email is whitespace only', () => {
    const result = computeOptInData('   ', false);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });
});
```

- [ ] **Step 3.2: Run to verify they fail**

```bash
npx vitest run src/lib/email/__tests__/opt-in.test.ts
```

Expected: `Cannot find module '../opt-in'`

- [ ] **Step 3.3: Implement opt-in.ts**

Create `src/lib/email/opt-in.ts`:
```typescript
interface OptInData {
  emailOptIn: 'CONFIRMED' | 'NONE';
  optInConfirmedAt: Date | null;
}

/**
 * Computes the emailOptIn status from form inputs.
 * Pure function — no DB access. Use in API routes before writing to Prisma.
 *
 * Rules:
 * - No email → NONE
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
```

- [ ] **Step 3.4: Run tests — must pass**

```bash
npx vitest run src/lib/email/__tests__/opt-in.test.ts
```

Expected: `5 passed`

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/email/opt-in.ts src/lib/email/__tests__/opt-in.test.ts
git commit -m "feat: add opt-in status computation logic"
```

---

## Task 4: Resend Client

**Files:**
- Create: `src/lib/email/client.ts`

- [ ] **Step 4.1: Create client.ts**

```typescript
// src/lib/email/client.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@torqr.de';
export const CAL_COM_URL = process.env.CAL_COM_URL || '';
```

- [ ] **Step 4.2: Commit**

```bash
git add src/lib/email/client.ts
git commit -m "feat: add Resend email client"
```

---

## Task 5: Email Templates

**Files:**
- Create: `src/lib/email/templates/ReminderEmail.tsx`
- Create: `src/lib/email/templates/WeeklySummaryEmail.tsx`

- [ ] **Step 5.1: Create ReminderEmail.tsx**

```tsx
// src/lib/email/templates/ReminderEmail.tsx
import {
  Html, Head, Body, Container, Section, Heading,
  Text, Button, Hr, Link, Row, Column,
} from '@react-email/components';

export interface ReminderEmailProps {
  customerName: string;
  maintenanceDate: string;       // formatted: DD.MM.YYYY
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  weeksUntil: 4 | 1;
  calComUrl: string;
  maxPhone: string;
  unsubscribeUrl: string;
}

export function ReminderEmail({
  customerName,
  maintenanceDate,
  heaterManufacturer,
  heaterModel,
  heaterSerialNumber,
  weeksUntil,
  calComUrl,
  maxPhone,
  unsubscribeUrl,
}: ReminderEmailProps) {
  const heaterInfo = [heaterManufacturer, heaterModel].filter(Boolean).join(' ');
  const weekWord = weeksUntil === 1 ? 'Woche' : 'Wochen';

  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px' }}>

          <Heading style={{ fontSize: '20px', color: '#111827', margin: '0 0 24px' }}>
            Wartungserinnerung
          </Heading>

          <Text style={{ color: '#374151', margin: '0 0 8px' }}>
            Guten Tag {customerName},
          </Text>
          <Text style={{ color: '#374151', margin: '0 0 24px' }}>
            der Wartungstermin für Ihre Heizungsanlage steht in{' '}
            <strong>{weeksUntil} {weekWord}</strong> an.
          </Text>

          <Section style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '16px', margin: '0 0 24px' }}>
            <Text style={{ margin: '0 0 4px', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>
              Anlage
            </Text>
            <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#111827' }}>
              {heaterInfo}
            </Text>
            {heaterSerialNumber && (
              <Text style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '12px' }}>
                Serien-Nr.: {heaterSerialNumber}
              </Text>
            )}
            <Text style={{ margin: '0', color: '#374151' }}>
              Termindatum: <strong>{maintenanceDate}</strong>
            </Text>
          </Section>

          {calComUrl && (
            <Button
              href={calComUrl}
              style={{
                backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '6px',
                padding: '12px 24px', fontSize: '14px', fontWeight: '600',
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              Termin jetzt buchen
            </Button>
          )}

          <Hr style={{ margin: '32px 0 16px', borderColor: '#e5e7eb' }} />

          <Text style={{ color: '#374151', fontSize: '14px', margin: '0' }}>
            Bei Fragen erreichen Sie uns unter: <strong>{maxPhone}</strong>
          </Text>

          <Hr style={{ margin: '16px 0', borderColor: '#e5e7eb' }} />

          <Text style={{ color: '#9ca3af', fontSize: '11px', margin: '0' }}>
            Sie erhalten diese E-Mail, weil Ihre Kontaktdaten bei uns für Wartungserinnerungen hinterlegt sind.{' '}
            <Link href={unsubscribeUrl} style={{ color: '#9ca3af' }}>
              Abmelden
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 5.2: Create WeeklySummaryEmail.tsx**

```tsx
// src/lib/email/templates/WeeklySummaryEmail.tsx
import {
  Html, Head, Body, Container, Section, Heading,
  Text, Hr, Row, Column,
} from '@react-email/components';

export interface UpcomingItem {
  customerName: string;
  date: string;
  heaterInfo: string;
}

export interface OverdueItem {
  customerName: string;
  daysOverdue: number;
  heaterInfo: string;
}

export interface WeeklySummaryEmailProps {
  weekLabel: string;
  upcomingCount: number;
  overdueCount: number;
  completedCount: number;
  upcomingList: UpcomingItem[];
  overdueList: OverdueItem[];
}

export function WeeklySummaryEmail({
  weekLabel,
  upcomingCount,
  overdueCount,
  completedCount,
  upcomingList,
  overdueList,
}: WeeklySummaryEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px' }}>

          <Heading style={{ fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>
            Wochenübersicht
          </Heading>
          <Text style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px' }}>
            {weekLabel}
          </Text>

          {/* Stat blocks */}
          <Section style={{ margin: '0 0 8px' }}>
            <Row>
              <Column style={{ textAlign: 'center' as const, padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                <Text style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#1d4ed8' }}>
                  {upcomingCount}
                </Text>
                <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#3b82f6' }}>
                  📅 Anstehend
                </Text>
              </Column>
              <Column style={{ width: '12px' }} />
              <Column style={{ textAlign: 'center' as const, padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                <Text style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#b45309' }}>
                  {overdueCount}
                </Text>
                <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#d97706' }}>
                  ⚠️ Überfällig
                </Text>
              </Column>
              <Column style={{ width: '12px' }} />
              <Column style={{ textAlign: 'center' as const, padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                <Text style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#15803d' }}>
                  {completedCount}
                </Text>
                <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#16a34a' }}>
                  ✅ Abgeschlossen
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Upcoming list */}
          {upcomingList.length > 0 && (
            <>
              <Hr style={{ margin: '24px 0 16px', borderColor: '#e5e7eb' }} />
              <Text style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const, margin: '0 0 12px', letterSpacing: '0.05em' }}>
                Anstehende Termine diese Woche
              </Text>
              {upcomingList.map((item, i) => (
                <Section key={i} style={{ marginBottom: '8px' }}>
                  <Text style={{ margin: '0', fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                    {item.customerName}
                  </Text>
                  <Text style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '12px' }}>
                    {item.heaterInfo} · {item.date}
                  </Text>
                </Section>
              ))}
            </>
          )}

          {/* Overdue list */}
          {overdueList.length > 0 && (
            <>
              <Hr style={{ margin: '24px 0 16px', borderColor: '#e5e7eb' }} />
              <Text style={{ fontSize: '12px', fontWeight: '600', color: '#b45309', textTransform: 'uppercase' as const, margin: '0 0 12px', letterSpacing: '0.05em' }}>
                ⚠️ Überfällige Wartungen
              </Text>
              {overdueList.map((item, i) => (
                <Section key={i} style={{ marginBottom: '8px' }}>
                  <Text style={{ margin: '0', fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                    {item.customerName}
                  </Text>
                  <Text style={{ margin: '2px 0 0', color: '#d97706', fontSize: '12px' }}>
                    {item.heaterInfo} · {item.daysOverdue} Tage überfällig
                  </Text>
                </Section>
              ))}
            </>
          )}

          <Hr style={{ margin: '32px 0 16px', borderColor: '#e5e7eb' }} />
          <Text style={{ color: '#9ca3af', fontSize: '11px', textAlign: 'center' as const, margin: '0' }}>
            Torqr · Automatisch generiert
          </Text>

        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 5.3: Commit**

```bash
git add src/lib/email/templates/
git commit -m "feat: add ReminderEmail and WeeklySummaryEmail templates"
```

---

## Task 6: Email Send Service

**Files:**
- Create: `src/lib/email/service.tsx`

- [ ] **Step 6.1: Create service.tsx**

```tsx
// src/lib/email/service.tsx
import { render } from '@react-email/components';
import React from 'react';
import { resend, FROM_EMAIL, CAL_COM_URL } from './client';
import { prisma } from '@/lib/prisma';
import { buildUnsubscribeUrl } from './unsubscribe-token';
import { ReminderEmail } from './templates/ReminderEmail';
import { WeeklySummaryEmail } from './templates/WeeklySummaryEmail';
import { format, addDays, subDays, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { EmailType } from '@prisma/client';

/**
 * Send a maintenance reminder email to a customer.
 * Logs the send to EmailLog. Throws on Resend error.
 */
export async function sendReminder(
  heaterId: string,
  type: EmailType.REMINDER_4_WEEKS | EmailType.REMINDER_1_WEEK
): Promise<void> {
  const heater = await prisma.heater.findUnique({
    where: { id: heaterId },
    include: {
      customer: true,
      user: { select: { phone: true } },
    },
  });

  if (!heater?.customer?.email) {
    throw new Error(`Heater ${heaterId}: no customer or no email`);
  }

  const { customer, user } = heater;
  const weeksUntil = type === EmailType.REMINDER_4_WEEKS ? 4 : 1;
  const maintenanceDate = heater.nextMaintenance
    ? format(heater.nextMaintenance, 'dd.MM.yyyy', { locale: de })
    : 'Unbekannt';

  const html = await render(
    React.createElement(ReminderEmail, {
      customerName: customer.name,
      maintenanceDate,
      heaterManufacturer: heater.manufacturer,
      heaterModel: heater.model,
      heaterSerialNumber: heater.serialNumber,
      weeksUntil,
      calComUrl: CAL_COM_URL,
      maxPhone: user?.phone || '',
      unsubscribeUrl: buildUnsubscribeUrl(customer.id),
    })
  );

  const heaterLabel = [heater.manufacturer, heater.model].filter(Boolean).join(' ');
  const weekWord = weeksUntil === 1 ? 'Woche' : 'Wochen';

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email,
    subject: `Wartungserinnerung: Termin in ${weeksUntil} ${weekWord} – ${heaterLabel}`,
    html,
  });

  await prisma.emailLog.create({
    data: {
      customerId: customer.id,
      type,
      resendId: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
    },
  });

  if (error) throw new Error(`Resend error for heater ${heaterId}: ${JSON.stringify(error)}`);
}

/**
 * Send the weekly summary email to Max.
 * Uses SUMMARY_RECIPIENT_EMAIL env var to find the user and send to them.
 * Logs are tracked via CronRun, not EmailLog (no customerId required).
 */
export async function sendWeeklySummary(): Promise<{ emailsSent: number }> {
  const recipientEmail = process.env.SUMMARY_RECIPIENT_EMAIL;
  if (!recipientEmail) throw new Error('SUMMARY_RECIPIENT_EMAIL is not set');

  const user = await prisma.user.findUnique({ where: { email: recipientEmail } });
  if (!user) throw new Error(`No user found for SUMMARY_RECIPIENT_EMAIL: ${recipientEmail}`);

  const now = new Date();
  const weekEnd = addDays(now, 7);
  const weekAgo = subDays(now, 7);

  const [upcomingHeaters, overdueHeaters, completedMaintenances] = await Promise.all([
    prisma.heater.findMany({
      where: { userId: user.id, nextMaintenance: { gte: now, lte: weekEnd } },
      include: { customer: { select: { name: true } } },
      orderBy: { nextMaintenance: 'asc' },
    }),
    prisma.heater.findMany({
      where: { userId: user.id, nextMaintenance: { lt: now } },
      include: { customer: { select: { name: true } } },
      orderBy: { nextMaintenance: 'asc' },
    }),
    prisma.maintenance.findMany({
      where: { userId: user.id, date: { gte: weekAgo, lte: now } },
    }),
  ]);

  const weekLabel = `${format(now, 'dd.MM.')} – ${format(weekEnd, 'dd.MM.yyyy')}`;

  const html = await render(
    React.createElement(WeeklySummaryEmail, {
      weekLabel,
      upcomingCount: upcomingHeaters.length,
      overdueCount: overdueHeaters.length,
      completedCount: completedMaintenances.length,
      upcomingList: upcomingHeaters.map((h) => ({
        customerName: h.customer?.name ?? 'Unbekannt',
        date: h.nextMaintenance ? format(h.nextMaintenance, 'dd.MM.yyyy') : '–',
        heaterInfo: [h.manufacturer, h.model].filter(Boolean).join(' '),
      })),
      overdueList: overdueHeaters.map((h) => ({
        customerName: h.customer?.name ?? 'Unbekannt',
        daysOverdue: h.nextMaintenance ? differenceInDays(now, h.nextMaintenance) : 0,
        heaterInfo: [h.manufacturer, h.model].filter(Boolean).join(' '),
      })),
    })
  );

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: recipientEmail,
    subject: `Wochenübersicht ${weekLabel}`,
    html,
  });

  if (error) throw new Error(`Resend error for weekly summary: ${JSON.stringify(error)}`);

  return { emailsSent: 1 };
}
```

- [ ] **Step 6.2: Commit**

```bash
git add src/lib/email/service.tsx
git commit -m "feat: add email send service (sendReminder, sendWeeklySummary)"
```

---

## Task 7: Customer Form — Suppress Toggle

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/app/api/customers/route.ts`
- Modify: `src/app/api/customers/[id]/route.ts`
- Modify: `src/app/dashboard/customers/new/page.tsx`
- Modify: `src/app/dashboard/customers/[id]/edit/page.tsx`

- [ ] **Step 7.1: Add suppressEmail to customer schemas in validations.ts**

In `src/lib/validations.ts`, update `customerCreateSchema`:
```typescript
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  street: z.string().min(1, 'Straße ist erforderlich').max(100, 'Straße zu lang'),
  zipCode: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben').max(10, 'PLZ zu lang'),
  city: z.string().min(1, 'Stadt ist erforderlich').max(100, 'Stadt zu lang'),
  phone: z.string().min(1, 'Telefon ist erforderlich').max(20, 'Telefon zu lang'),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  suppressEmail: z.boolean().optional().default(false),   // NEW
  heatingType: HeatingTypeEnum,
  additionalEnergySources: z.array(AdditionalEnergySourceEnum).optional().default([]),
  energyStorageSystems: z.array(EnergyStorageSystemEnum).optional().default([]),
  notes: z.string().max(1000, 'Notizen zu lang').optional(),
});
```

(`customerUpdateSchema` is `customerCreateSchema.partial()` so it picks up `suppressEmail` automatically.)

- [ ] **Step 7.2: Update POST /api/customers to apply opt-in logic**

In `src/app/api/customers/route.ts`, add imports at top:
```typescript
import { computeOptInData } from '@/lib/email/opt-in';
```

Replace the existing `// 4. Create customer in database` section with:
```typescript
    // 4. Compute opt-in status from email + suppress flag
    const email = validatedData.email?.trim() || null;
    const optInData = computeOptInData(email, validatedData.suppressEmail ?? false);

    // 5. Create customer in database
    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        street: validatedData.street,
        zipCode: validatedData.zipCode,
        city: validatedData.city,
        phone: validatedData.phone,
        email,
        emailOptIn: optInData.emailOptIn,
        optInConfirmedAt: optInData.optInConfirmedAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        heatingType: validatedData.heatingType as any,
        additionalEnergySources: validatedData.additionalEnergySources || [],
        energyStorageSystems: validatedData.energyStorageSystems || [],
        notes: validatedData.notes || null,
        userId: userId,
      },
    });
```

- [ ] **Step 7.3: Update PATCH /api/customers/[id] to apply opt-in logic (with UNSUBSCRIBED guard)**

In `src/app/api/customers/[id]/route.ts`, add import:
```typescript
import { computeOptInData } from '@/lib/email/opt-in';
```

After the existing `// 5. Convert empty email string to null` block, add and replace the update call:
```typescript
    // 5. Compute opt-in — preserve UNSUBSCRIBED status unless email changes
    const email = validatedData.email?.trim() || null;
    const emailChanged = email !== null && email !== existingCustomer.email;
    const shouldRespectUnsubscribed =
      existingCustomer.emailOptIn === 'UNSUBSCRIBED' && !emailChanged;

    const optInData = shouldRespectUnsubscribed
      ? { emailOptIn: 'UNSUBSCRIBED' as const, optInConfirmedAt: existingCustomer.optInConfirmedAt }
      : computeOptInData(email, validatedData.suppressEmail ?? false);

    // 6. Update customer
    const customer = await prisma.customer.update({
      where: { id: id, userId: userId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.street && { street: validatedData.street }),
        ...(validatedData.zipCode && { zipCode: validatedData.zipCode }),
        ...(validatedData.city && { city: validatedData.city }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        email,
        emailOptIn: optInData.emailOptIn,
        optInConfirmedAt: optInData.optInConfirmedAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(validatedData.heatingType && { heatingType: validatedData.heatingType as any }),
        ...(validatedData.additionalEnergySources && { additionalEnergySources: validatedData.additionalEnergySources }),
        ...(validatedData.energyStorageSystems && { energyStorageSystems: validatedData.energyStorageSystems }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
      },
    });
```

(Remove the old `prisma.customer.update` call that was there before, replace with this one.)

- [ ] **Step 7.4: Add suppress toggle to new customer form**

In `src/app/dashboard/customers/new/page.tsx`:

Add `suppressEmail: false` to the initial `formData` state:
```typescript
  const [formData, setFormData] = useState<FormData>({
    name: '', street: '', zipCode: '', city: '', phone: '', email: '',
    heatingType: '', additionalEnergySources: [], energyStorageSystems: [], notes: '',
    suppressEmail: false,   // NEW
  });
```

Add `suppressEmail: boolean` to the `FormData` interface:
```typescript
interface FormData {
  // ... existing fields ...
  suppressEmail: boolean;   // NEW
}
```

Replace the email input block (the `<div>` containing `id="email"`) with:
```tsx
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-sm">E-Mail (optional)</Label>
                <Input
                  id="email" name="email" type="email" value={formData.email}
                  onChange={handleChange} className={errors.email ? 'border-destructive' : ''}
                  placeholder="max@beispiel.de"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Für automatische Wartungserinnerungen</p>
                {formData.email && (
                  <label className="mt-2 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.suppressEmail}
                      onChange={(e) => setFormData((prev) => ({ ...prev, suppressEmail: e.target.checked }))}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-xs text-muted-foreground">Keine E-Mail-Erinnerungen senden</span>
                  </label>
                )}
              </div>
```

- [ ] **Step 7.5: Add suppress toggle + status badge to edit customer form**

In `src/app/dashboard/customers/[id]/edit/page.tsx`, make the same changes as Step 7.4, plus:

When loading the existing customer data (in the `useEffect` that populates form), add:
```typescript
suppressEmail: data.emailOptIn === 'NONE',  // pre-fill toggle from existing status
```

Below the email input block, also show the current opt-in status if the customer has an email:
```tsx
                {formData.email && customer?.emailOptIn === 'UNSUBSCRIBED' && (
                  <p className="mt-2 text-xs text-amber-600">
                    ⚠️ Kunde hat sich abgemeldet. Status wird nur bei neuer E-Mail-Adresse zurückgesetzt.
                  </p>
                )}
                {formData.email && customer?.emailOptIn === 'CONFIRMED' && (
                  <p className="mt-2 text-xs text-green-600">✓ E-Mail-Erinnerungen aktiv</p>
                )}
```

(The `customer` variable comes from the existing data fetch in the edit page.)

- [ ] **Step 7.6: Verify TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: `0 errors`

- [ ] **Step 7.7: Commit**

```bash
git add src/lib/validations.ts src/app/api/customers/ src/app/dashboard/customers/
git commit -m "feat: add email suppress toggle to customer form and opt-in logic to API"
```

---

## Task 8: Daily Reminder Cron Route

**Files:**
- Create: `src/app/api/cron/daily-reminders/route.ts`

- [ ] **Step 8.1: Create the cron route**

```typescript
// src/app/api/cron/daily-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReminder } from '@/lib/email/service';
import { EmailType } from '@prisma/client';
import { addDays } from 'date-fns';

function verifyCronSecret(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * Returns heater IDs that need a reminder of the given type sent today.
 * Window: ±1 day around the target (28 or 7 days away).
 * Dedup: skips customers who received this type in the last 30 days.
 */
async function getEligibleHeaterIds(
  type: EmailType.REMINDER_4_WEEKS | EmailType.REMINDER_1_WEEK
): Promise<string[]> {
  const now = new Date();
  const targetDays = type === EmailType.REMINDER_4_WEEKS ? 28 : 7;
  const windowStart = addDays(now, targetDays - 1);
  const windowEnd = addDays(now, targetDays + 1);
  const dedupeFrom = addDays(now, -30);

  const heaters = await prisma.heater.findMany({
    where: {
      nextMaintenance: { gte: windowStart, lte: windowEnd },
      customer: {
        emailOptIn: 'CONFIRMED',
        email: { not: null },
        emailLogs: {
          none: {
            type,
            sentAt: { gte: dedupeFrom },
          },
        },
      },
    },
    select: { id: true },
  });

  return heaters.map((h) => h.id);
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cronRun = await prisma.cronRun.create({
    data: { jobType: 'daily_reminders' },
  });

  const errors: string[] = [];
  let emailsSent = 0;

  for (const type of [EmailType.REMINDER_4_WEEKS, EmailType.REMINDER_1_WEEK] as const) {
    const heaterIds = await getEligibleHeaterIds(type);

    for (const heaterId of heaterIds) {
      try {
        await sendReminder(heaterId, type);
        emailsSent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${heaterId}: ${msg}`);
        console.error(`[daily-reminders] Failed for heater ${heaterId}:`, err);
      }
    }
  }

  const status = errors.length === 0 ? 'SUCCESS' : (emailsSent === 0 ? 'FAILED' : 'SUCCESS');

  await prisma.cronRun.update({
    where: { id: cronRun.id },
    data: {
      completedAt: new Date(),
      status,
      emailsSent,
      errors: errors.length > 0 ? JSON.stringify(errors) : null,
    },
  });

  return NextResponse.json({ ok: true, emailsSent, errors });
}
```

- [ ] **Step 8.2: Commit**

```bash
git add src/app/api/cron/daily-reminders/route.ts
git commit -m "feat: add daily reminder cron route"
```

---

## Task 9: Weekly Summary Cron Route

**Files:**
- Create: `src/app/api/cron/weekly-summary/route.ts`

- [ ] **Step 9.1: Create the cron route**

```typescript
// src/app/api/cron/weekly-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklySummary } from '@/lib/email/service';

function verifyCronSecret(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cronRun = await prisma.cronRun.create({
    data: { jobType: 'weekly_summary' },
  });

  try {
    const { emailsSent } = await sendWeeklySummary();

    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: { completedAt: new Date(), status: 'SUCCESS', emailsSent },
    });

    return NextResponse.json({ ok: true, emailsSent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[weekly-summary] Failed:', err);

    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: { completedAt: new Date(), status: 'FAILED', errors: JSON.stringify([msg]) },
    });

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 9.2: Commit**

```bash
git add src/app/api/cron/weekly-summary/route.ts
git commit -m "feat: add weekly summary cron route"
```

---

## Task 10: Unsubscribe Flow

**Files:**
- Create: `src/app/api/email/unsubscribe/[token]/route.ts`
- Create: `src/app/unsubscribe/[token]/page.tsx`

- [ ] **Step 10.1: Create the unsubscribe API route**

```typescript
// src/app/api/email/unsubscribe/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUnsubscribePath, verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: combined } = await params;
  const parsed = parseUnsubscribePath(combined);

  if (!parsed) {
    return NextResponse.json({ error: 'Ungültiger Link' }, { status: 400 });
  }

  const { customerId, token } = parsed;

  if (!verifyUnsubscribeToken(customerId, token)) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link' }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
  }

  if (customer.emailOptIn === 'UNSUBSCRIBED') {
    return NextResponse.json({ ok: true, alreadyUnsubscribed: true });
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { emailOptIn: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 10.2: Create the public unsubscribe page**

```tsx
// src/app/unsubscribe/[token]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function UnsubscribePage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleUnsubscribe() {
    setState('loading');
    try {
      const res = await fetch(`/api/email/unsubscribe/${params.token}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setState('done');
        setMessage(
          data.alreadyUnsubscribed
            ? 'Sie sind bereits abgemeldet.'
            : 'Sie wurden erfolgreich abgemeldet. Sie erhalten keine Wartungserinnerungen mehr.'
        );
      } else {
        setState('error');
        setMessage(data.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch {
      setState('error');
      setMessage('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

        {state === 'done' ? (
          <>
            <p style={{ fontSize: '24px', margin: '0 0 12px' }}>✅</p>
            <h1 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}>
              Abgemeldet
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>{message}</p>
          </>
        ) : state === 'error' ? (
          <>
            <p style={{ fontSize: '24px', margin: '0 0 12px' }}>⚠️</p>
            <h1 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}>
              Fehler
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>{message}</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}>
              E-Mail-Erinnerungen abbestellen
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
              Möchten Sie keine Wartungserinnerungen mehr erhalten? Klicken Sie auf Abmelden.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={state === 'loading'}
              style={{
                width: '100%', padding: '10px 16px', backgroundColor: '#2563eb', color: '#ffffff',
                border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600',
                cursor: state === 'loading' ? 'not-allowed' : 'pointer', opacity: state === 'loading' ? 0.7 : 1,
              }}
            >
              {state === 'loading' ? 'Wird verarbeitet...' : 'Abmelden'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 10.3: Commit**

```bash
git add src/app/api/email/unsubscribe/ src/app/unsubscribe/
git commit -m "feat: add unsubscribe API route and public unsubscribe page"
```

---

## Task 11: Vercel Cron Config + Env Documentation

**Files:**
- Modify: `vercel.json`
- Modify: `SPRINT.md`

- [ ] **Step 11.1: Add cron schedules to vercel.json**

Replace the contents of `vercel.json` with:
```json
{
  "buildCommand": "next build",
  "env": {
    "SKIP_ENV_VALIDATION": "true"
  },
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/weekly-summary",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

- [ ] **Step 11.2: Add required env vars to Vercel (manual step)**

In Vercel Dashboard → Project Settings → Environment Variables, add:

| Variable | Example Value | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_xxxx` | From Resend dashboard |
| `RESEND_FROM_EMAIL` | `noreply@torqr.de` | Must be verified in Resend |
| `CRON_SECRET` | `<random 32+ char string>` | `openssl rand -hex 32` |
| `UNSUBSCRIBE_SECRET` | `<random 32+ char string>` | `openssl rand -hex 32` |
| `CAL_COM_URL` | `https://cal.com/max/wartung` | Max's Cal.com booking page |
| `SUMMARY_RECIPIENT_EMAIL` | `max@example.com` | Max's login email |

- [ ] **Step 11.3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 11.4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: `0 errors`

- [ ] **Step 11.5: Update SPRINT.md — mark tasks complete**

Mark all tasks in SPRINT.md as `[x]` and update status to `✅ Implementation complete`.

- [ ] **Step 11.6: Final commit**

```bash
git add vercel.json SPRINT.md
git commit -m "feat: complete Sprint 4 email automation — cron config and env docs"
```

---

## Self-Review Checklist

Spec requirements mapped to tasks:

| Spec Requirement | Task |
|---|---|
| Opt-in on customer save (email + suppress toggle) | Task 7 |
| `CONFIRMED` set immediately (no confirmation email) | Task 7 (computeOptInData) |
| Suppress toggle near email field | Task 7 (UI) |
| `UNSUBSCRIBED` guard on edit | Task 7 (PATCH route) |
| Customer reminder email (4w + 1w) | Task 5 (template), Task 6 (service), Task 8 (cron) |
| Heater info + maintenance date in email | Task 5 (ReminderEmail props) |
| Cal.com booking link in email | Task 5 (calComUrl prop) |
| Max's phone in email | Task 5 (maxPhone prop) |
| Unsubscribe link in every reminder email | Task 5 + Task 2 (buildUnsubscribeUrl) |
| Weekly summary to Max | Task 5 (service), Task 9 (cron) |
| Stat blocks (upcoming/overdue/completed) | Task 5 (WeeklySummaryEmail) |
| Cron dedup (no duplicate sends) | Task 8 (getEligibleHeaterIds with emailLogs.none) |
| CronRun tracking (start/complete/errors) | Task 8 + Task 9 |
| HMAC unsubscribe tokens | Task 2 |
| Public unsubscribe page (no auth) | Task 10 |
| Unsubscribe sets UNSUBSCRIBED + unsubscribedAt | Task 10 (API route) |
| Vercel Cron schedules | Task 11 |
| Test infrastructure | Task 1 |
| Unit tests for token utility | Task 2 |
| Unit tests for opt-in logic | Task 3 |

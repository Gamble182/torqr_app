# Termine Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver `/dashboard/termine` as the single surface for appointment management — source-agnostic list + monthly calendar, filters, in-app reschedule/cancel for both manual and Cal.com bookings (with customer emails), and webhook-driven mirroring of Cal.com reschedule/cancel events.

**Architecture:** Extend the existing `Booking` table with reschedule/cancel metadata and extend `BookingStatus` with `RESCHEDULED`. Introduce a thin Cal.com v2 REST client (`src/lib/cal-com/client.ts`) that server API routes call on OWNER-initiated reschedule/cancel; the webhook reconciles idempotently via `calBookingUid`. UI is a URL-driven page (query params = state) with three new composed components (filters, list, calendar) and two mutation modals, all backed by three new React Query hooks.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma, NextAuth v5, React Query v5, Zod, Tailwind + shadcn/ui, Vitest, React Hook Form, Resend + React Email, date-fns (already installed).

**Spec reference:** `docs/superpowers/specs/2026-04-23-termine-page-design.md`

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add reschedule/cancel fields on `Booking`; `RESCHEDULED` status; new `EmailType` values |
| `prisma/migrations/20260423120000_termine_page/migration.sql` | Create | SQL migration for schema changes |
| `.env.example` | Modify | Document `CAL_COM_API_KEY`, `CAL_COM_API_BASE` |
| `src/lib/cal-com/client.ts` | Create | Reschedule + cancel wrapper around Cal.com v2 API |
| `src/lib/cal-com/__tests__/client.test.ts` | Create | Unit tests for the Cal.com client |
| `src/app/api/webhooks/cal/route.ts` | Modify | Strict HMAC, handle `BOOKING_RESCHEDULED` + `BOOKING_CANCELLED` |
| `src/app/api/webhooks/cal/__tests__/route.test.ts` | Create | Webhook HMAC + reschedule/cancel handler tests |
| `src/lib/email/templates/BookingRescheduleEmail.tsx` | Create | German template: reschedule notification |
| `src/lib/email/templates/BookingCancellationEmail.tsx` | Create | German template: cancellation notification |
| `src/lib/email/service.tsx` | Modify | Add `sendBookingReschedule`, `sendBookingCancellation` |
| `src/lib/validations.ts` | Modify | `bookingRescheduleSchema`, `bookingCancelSchema`, `bookingListQuerySchema` |
| `src/app/api/bookings/route.ts` | Modify | Filtering (range/status/assignee/customer/systemType/source/from/to) |
| `src/app/api/bookings/[id]/route.ts` | Create | `GET` + `PATCH` (reschedule) + `DELETE` (cancel) |
| `src/hooks/useBookings.ts` | Modify | Accept full filter object; add `useBooking`, `useRescheduleBooking`, `useCancelBooking` |
| `src/components/DashboardNav.tsx` | Modify | Add "Termine" nav entry |
| `src/app/dashboard/termine/page.tsx` | Create | Page shell: URL-driven view toggle, filters, legend |
| `src/components/termine/TermineFilters.tsx` | Create | Filter bar (URL-driven) |
| `src/components/termine/TermineList.tsx` | Create | Desktop + mobile list rows with action menu |
| `src/components/termine/TermineCalendar.tsx` | Create | Monthly grid view |
| `src/components/termine/BookingDetailsDrawer.tsx` | Create | Read-only booking detail drawer |
| `src/components/termine/RescheduleBookingModal.tsx` | Create | Reschedule modal (manual + cal branches) |
| `src/components/termine/CancelBookingModal.tsx` | Create | Cancel modal (manual + cal branches) |
| `src/app/dashboard/page.tsx` | Modify | Add "Alle Termine anzeigen →" link |
| `src/app/dashboard/customers/[id]/page.tsx` | Modify | Rename "Cal.com Buchungen" → "Termine"; source icons; link to filtered page |
| `docs/BACKLOG.md` | Modify | Resolve #58 HMAC fail-open; close related items |

---

## Task 1: Prisma schema — reschedule/cancel metadata + enum values

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260423120000_termine_page/migration.sql`

- [ ] **Step 1: Add new fields + enum value to `Booking` / `BookingStatus` / `EmailType`**

Edit `prisma/schema.prisma`. Extend the `Booking` model with five new nullable columns and add `RESCHEDULED` to `BookingStatus` (already present in `useBookings.ts` union type but currently missing the enum value in the schema's runtime — verify by reading the file before editing). Also add two new values to `EmailType`:

```prisma
model Booking {
  id            String        @id @default(uuid())
  calBookingUid String        @unique
  triggerEvent  String
  startTime     DateTime
  endTime       DateTime?
  title         String?
  attendeeName  String?
  attendeeEmail String?
  status        BookingStatus @default(CONFIRMED)

  // --- NEW reschedule / cancel metadata ---
  cancelReason       String?
  cancelledAt        DateTime?
  rescheduledFromUid String?
  rescheduledToUid   String?
  rescheduledAt      DateTime?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  companyId        String
  company          Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId           String
  user             User            @relation(fields: [userId], references: [id])
  assignedToUserId String?
  assignedTo       User?           @relation("AssignedBookings", fields: [assignedToUserId], references: [id], onDelete: SetNull)
  customerId       String?
  customer         Customer?       @relation(fields: [customerId], references: [id], onDelete: SetNull)
  systemId         String?
  system           CustomerSystem? @relation(fields: [systemId], references: [id], onDelete: SetNull)

  @@index([companyId])
  @@index([userId])
  @@index([assignedToUserId])
  @@index([customerId])
  @@index([systemId])
  @@index([startTime])
  @@index([status])
  @@index([rescheduledFromUid])
  @@map("bookings")
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  RESCHEDULED
}

enum EmailType {
  OPT_IN_CONFIRMATION
  REMINDER_4_WEEKS
  REMINDER_1_WEEK
  WEEKLY_SUMMARY
  BOOKING_CONFIRMATION
  BOOKING_RESCHEDULED
  BOOKING_CANCELLED
}
```

- [ ] **Step 2: Write the migration SQL**

Create `prisma/migrations/20260423120000_termine_page/migration.sql`:

```sql
-- Enum additions (Postgres requires ADD VALUE outside a transaction, but Prisma handles this)
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'RESCHEDULED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'BOOKING_RESCHEDULED';
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'BOOKING_CANCELLED';

-- Booking metadata
ALTER TABLE "bookings"
  ADD COLUMN "cancelReason"       TEXT,
  ADD COLUMN "cancelledAt"        TIMESTAMP(3),
  ADD COLUMN "rescheduledFromUid" TEXT,
  ADD COLUMN "rescheduledToUid"   TEXT,
  ADD COLUMN "rescheduledAt"      TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "bookings_status_idx"             ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_rescheduledFromUid_idx" ON "bookings"("rescheduledFromUid");
```

- [ ] **Step 3: Apply migration locally**

Run:
```bash
npx dotenv -e .env.local -- prisma migrate deploy --schema=prisma/schema.prisma
```
Expected: `1 migration applied`.

- [ ] **Step 4: Verify with Prisma studio query (no code)**

Run:
```bash
npx dotenv -e .env.local -- prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('cancelReason','cancelledAt','rescheduledFromUid','rescheduledToUid','rescheduledAt');"
```
Expected: five rows printed.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260423120000_termine_page/
git commit -m "feat(db): add reschedule/cancel metadata to Booking + new EmailType values"
```

---

## Task 2: Regenerate Prisma client

**Files:**
- Regenerate (no edit): Prisma client under `node_modules/.prisma/client`

- [ ] **Step 1: Regenerate**

Run:
```bash
npx dotenv -e .env.local -- prisma generate --schema=prisma/schema.prisma
```
Expected: `Generated Prisma Client`.

- [ ] **Step 2: Typecheck the repo to surface any consumers of the changed enums**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors beyond pre-existing ones (if any). Record baseline; re-run after each Task below.

- [ ] **Step 3: Commit (generated client is gitignored — commit nothing; this step is informational)**

No commit. Move on.

---

## Task 3: Document new env vars

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append Cal.com API vars**

Edit `.env.example` — append:

```dotenv
# --- Cal.com v2 API (reschedule / cancel in-app) ---
# Create at https://app.cal.com/settings/developer/api-keys (account-level, not OAuth)
CAL_COM_API_KEY=
# Defaults to https://api.cal.com/v2 when unset. Override for staging.
CAL_COM_API_BASE=https://api.cal.com/v2
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(env): document CAL_COM_API_KEY + CAL_COM_API_BASE"
```

---

## Task 4: Cal.com API client — failing test

**Files:**
- Create: `src/lib/cal-com/client.ts` (empty shim)
- Create: `src/lib/cal-com/__tests__/client.test.ts`

- [ ] **Step 1: Write a failing test first**

Create `src/lib/cal-com/__tests__/client.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CalComApiError,
  cancelCalBooking,
  rescheduleCalBooking,
} from '@/lib/cal-com/client';

describe('cal-com client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.CAL_COM_API_KEY = 'test-key';
    process.env.CAL_COM_API_BASE = 'https://api.example.test/v2';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('throws if CAL_COM_API_KEY is missing', async () => {
    delete process.env.CAL_COM_API_KEY;
    await expect(
      rescheduleCalBooking({ uid: 'u1', startTime: new Date('2026-05-01T09:00:00Z') })
    ).rejects.toThrow(/CAL_COM_API_KEY/);
  });

  it('posts to /bookings/{uid}/reschedule with Bearer auth and returns new uid', async () => {
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: 'new-uid-123' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    global.fetch = mock as unknown as typeof fetch;

    const result = await rescheduleCalBooking({
      uid: 'old-uid',
      startTime: new Date('2026-05-01T09:00:00Z'),
      reschedulingReason: 'Kunde verschoben',
    });

    expect(result.newUid).toBe('new-uid-123');
    expect(mock).toHaveBeenCalledWith(
      'https://api.example.test/v2/bookings/old-uid/reschedule',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      })
    );
    const call = mock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(call.body as string)).toEqual({
      start: '2026-05-01T09:00:00.000Z',
      reschedulingReason: 'Kunde verschoben',
    });
  });

  it('throws CalComApiError on non-2xx reschedule', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'bad' }), { status: 422 })
    ) as unknown as typeof fetch;

    await expect(
      rescheduleCalBooking({ uid: 'u', startTime: new Date() })
    ).rejects.toBeInstanceOf(CalComApiError);
  });

  it('posts to /bookings/{uid}/cancel with reason', async () => {
    const mock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    global.fetch = mock as unknown as typeof fetch;

    await cancelCalBooking({ uid: 'u1', cancellationReason: 'Kunde abwesend' });

    expect(mock).toHaveBeenCalledWith(
      'https://api.example.test/v2/bookings/u1/cancel',
      expect.objectContaining({ method: 'POST' })
    );
    const call = mock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(call.body as string)).toEqual({ cancellationReason: 'Kunde abwesend' });
  });

  it('falls back to default base URL when CAL_COM_API_BASE is unset', async () => {
    delete process.env.CAL_COM_API_BASE;
    const mock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: 'x' } }), { status: 200 })
    );
    global.fetch = mock as unknown as typeof fetch;

    await rescheduleCalBooking({ uid: 'u', startTime: new Date('2026-05-01T09:00:00Z') });
    expect(mock.mock.calls[0][0]).toBe('https://api.cal.com/v2/bookings/u/reschedule');
  });
});
```

Also create a stub `src/lib/cal-com/client.ts` so the test compiles (but fails):

```ts
export class CalComApiError extends Error {}
export async function rescheduleCalBooking(_p: { uid: string; startTime: Date; reschedulingReason?: string }): Promise<{ newUid: string }> {
  throw new Error('not implemented');
}
export async function cancelCalBooking(_p: { uid: string; cancellationReason?: string }): Promise<void> {
  throw new Error('not implemented');
}
```

- [ ] **Step 2: Run test, verify fails**

Run:
```bash
npm test -- src/lib/cal-com/__tests__/client.test.ts
```
Expected: FAIL (5 tests failing with `not implemented` or missing env var).

- [ ] **Step 3: Commit**

```bash
git add src/lib/cal-com/
git commit -m "test(cal-com): failing tests for reschedule + cancel client"
```

---

## Task 5: Cal.com API client — implementation

**Files:**
- Modify: `src/lib/cal-com/client.ts`

- [ ] **Step 1: Replace the stub with a real implementation**

Overwrite `src/lib/cal-com/client.ts`:

```ts
/**
 * Thin wrapper around the Cal.com v2 REST API.
 *
 * Only reschedule + cancel are supported — booking creation stays on the
 * Cal.com side via reminder links. Called from server-side API routes.
 */

const DEFAULT_BASE = 'https://api.cal.com/v2';

export class CalComApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string
  ) {
    super(message ?? `Cal.com API error ${status}`);
    this.name = 'CalComApiError';
  }
}

function apiKey(): string {
  const key = process.env.CAL_COM_API_KEY;
  if (!key) {
    throw new Error('CAL_COM_API_KEY is not set — Cal.com reschedule/cancel is disabled');
  }
  return key;
}

function base(): string {
  return process.env.CAL_COM_API_BASE || DEFAULT_BASE;
}

async function callJson<T>(url: string, body: unknown): Promise<T> {
  const started = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const duration = Date.now() - started;

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    console.error(`[cal-com] ${url} status=${res.status} duration=${duration}ms`);
    throw new CalComApiError(res.status, parsed, `Cal.com API error ${res.status}`);
  }
  console.info(`[cal-com] ${url} status=${res.status} duration=${duration}ms`);
  return parsed as T;
}

export async function rescheduleCalBooking(params: {
  uid: string;
  startTime: Date;
  reschedulingReason?: string;
}): Promise<{ newUid: string }> {
  const response = await callJson<{ data?: { uid?: string }; uid?: string }>(
    `${base()}/bookings/${params.uid}/reschedule`,
    {
      start: params.startTime.toISOString(),
      ...(params.reschedulingReason ? { reschedulingReason: params.reschedulingReason } : {}),
    }
  );
  const newUid = response.data?.uid ?? response.uid;
  if (!newUid) {
    throw new CalComApiError(200, response, 'Cal.com reschedule: no uid returned');
  }
  return { newUid };
}

export async function cancelCalBooking(params: {
  uid: string;
  cancellationReason?: string;
}): Promise<void> {
  await callJson<unknown>(
    `${base()}/bookings/${params.uid}/cancel`,
    params.cancellationReason ? { cancellationReason: params.cancellationReason } : {}
  );
}
```

- [ ] **Step 2: Re-run tests, verify pass**

Run:
```bash
npm test -- src/lib/cal-com/__tests__/client.test.ts
```
Expected: PASS (5 tests).

- [ ] **Step 3: Commit**

```bash
git add src/lib/cal-com/client.ts
git commit -m "feat(cal-com): implement reschedule + cancel v2 API client"
```

---

## Task 6: Webhook — fix HMAC fail-open (backlog #58)

**Files:**
- Modify: `src/app/api/webhooks/cal/route.ts`
- Create: `src/app/api/webhooks/cal/__tests__/route.test.ts`

- [ ] **Step 1: Write a failing test that asserts missing-secret returns 500**

Create `src/app/api/webhooks/cal/__tests__/route.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: { upsert: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    customer: { findFirst: vi.fn() },
    customerSystem: { findFirst: vi.fn() },
  },
}));

import { POST } from '@/app/api/webhooks/cal/route';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://torqr.de/api/webhooks/cal', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;
}

describe('POST /api/webhooks/cal — HMAC', () => {
  const originalSecret = process.env.CAL_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.CAL_WEBHOOK_SECRET = originalSecret;
  });

  it('returns 500 when CAL_WEBHOOK_SECRET is unset (fail-closed)', async () => {
    delete process.env.CAL_WEBHOOK_SECRET;
    const res = await POST(makeRequest({ triggerEvent: 'BOOKING_CREATED', payload: {} }));
    expect(res.status).toBe(500);
  });

  it('returns 401 when signature header is missing', async () => {
    process.env.CAL_WEBHOOK_SECRET = 'secret';
    const res = await POST(makeRequest({ triggerEvent: 'BOOKING_CREATED', payload: {} }));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run, verify fails**

Run:
```bash
npm test -- src/app/api/webhooks/cal/__tests__/route.test.ts
```
Expected: FAIL — the first test sees `200` (current fail-open behaviour).

- [ ] **Step 3: Fix the handler — fail closed on missing secret**

In `src/app/api/webhooks/cal/route.ts`, replace the top of `POST` (the `secret`-optional block) with:

```ts
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[cal-webhook] CAL_WEBHOOK_SECRET is not configured — refusing request');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = req.headers.get('x-cal-signature-256');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
```

(Read the file first; remove the `if (secret)` wrapper and move the verification into the mandatory path.)

- [ ] **Step 4: Re-run tests, verify pass**

Run:
```bash
npm test -- src/app/api/webhooks/cal/__tests__/route.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/cal/route.ts src/app/api/webhooks/cal/__tests__/
git commit -m "fix(cal-webhook): fail closed when CAL_WEBHOOK_SECRET is unset (backlog #58)"
```

---

## Task 7: Webhook — handle `BOOKING_RESCHEDULED`

**Files:**
- Modify: `src/app/api/webhooks/cal/route.ts`
- Modify: `src/app/api/webhooks/cal/__tests__/route.test.ts`

- [ ] **Step 1: Add failing test for reschedule handling**

Append to `src/app/api/webhooks/cal/__tests__/route.test.ts`:

```ts
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

function signedRequest(event: string, payload: Record<string, unknown>) {
  process.env.CAL_WEBHOOK_SECRET = 'secret';
  const body = JSON.stringify({ triggerEvent: event, payload });
  const sig = createHmac('sha256', 'secret').update(body).digest('hex');
  return makeRequest(body, { 'x-cal-signature-256': sig });
}

describe('POST /api/webhooks/cal — BOOKING_RESCHEDULED', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CAL_WEBHOOK_SECRET = 'secret';
  });

  it('marks the original booking as RESCHEDULED and inserts the new booking', async () => {
    (prisma.booking.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'old-db-id',
      calBookingUid: 'OLD_UID',
      companyId: 'c1',
      userId: 'u1',
      customerId: 'cust1',
      systemId: 'sys1',
    });
    (prisma.booking.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.booking.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'new-db-id' });

    const res = await POST(
      signedRequest('BOOKING_RESCHEDULED', {
        uid: 'NEW_UID',
        rescheduledFromUid: 'OLD_UID',
        startTime: '2026-05-10T09:00:00Z',
        endTime: '2026-05-10T10:00:00Z',
        attendees: [{ name: 'Max Müller', email: 'max@example.com' }],
        organizer: { email: 'owner@example.com' },
        metadata: { customerId: 'cust1', userId: 'u1', systemId: 'sys1' },
      })
    );

    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { calBookingUid: 'OLD_UID' },
        data: expect.objectContaining({
          status: 'RESCHEDULED',
          rescheduledToUid: 'NEW_UID',
        }),
      })
    );
    expect(prisma.booking.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { calBookingUid: 'NEW_UID' },
        create: expect.objectContaining({
          calBookingUid: 'NEW_UID',
          triggerEvent: 'BOOKING_RESCHEDULED',
          rescheduledFromUid: 'OLD_UID',
          status: 'CONFIRMED',
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run, verify fails**

Run:
```bash
npm test -- src/app/api/webhooks/cal/__tests__/route.test.ts
```
Expected: FAIL — handler currently returns 200 without doing reschedule work.

- [ ] **Step 3: Implement reschedule branch in the handler**

In `src/app/api/webhooks/cal/route.ts`, replace the guard:

```ts
  if (triggerEvent !== 'BOOKING_CREATED') {
    return NextResponse.json({ received: true });
  }
```

with a dispatcher that routes to `BOOKING_CREATED` (unchanged), `BOOKING_RESCHEDULED` (new), `BOOKING_CANCELLED` (next task), and returns `{ received: true }` for others. Extract the existing created logic into `handleBookingCreated(data, triggerEvent)` for readability. Then add:

```ts
async function handleBookingRescheduled(data: Record<string, unknown>) {
  const newUid = (data.uid ?? data.bookingId) as string | undefined;
  const oldUid =
    (data.rescheduledFromUid as string | undefined) ??
    ((data.fromReschedule as { uid?: string } | undefined)?.uid) ??
    (data.rescheduledBy as string | undefined);

  if (!newUid || !oldUid) {
    console.error('[cal-webhook] BOOKING_RESCHEDULED missing uid or rescheduledFromUid', { newUid, oldUid });
    return NextResponse.json({ received: true });
  }

  const original = await prisma.booking.findUnique({
    where: { calBookingUid: oldUid },
  });

  if (!original) {
    console.warn(`[cal-webhook] RESCHEDULED: original ${oldUid} not found — inserting new row only`);
  }

  const startTime = data.startTime ? new Date(data.startTime as string) : null;
  const endTime = data.endTime ? new Date(data.endTime as string) : null;
  if (!startTime) {
    console.error('[cal-webhook] RESCHEDULED missing startTime');
    return NextResponse.json({ received: true });
  }

  const attendees = (data.attendees as { name?: string; email?: string }[]) ?? [];
  const attendee = attendees[0] ?? null;
  const metadata = (data.metadata ?? {}) as Record<string, string>;

  if (original) {
    await prisma.booking.update({
      where: { calBookingUid: oldUid },
      data: {
        status: 'RESCHEDULED',
        rescheduledToUid: newUid,
        rescheduledAt: new Date(),
      },
    });
  }

  // Inherit companyId / userId / customerId / systemId from the original when available,
  // otherwise fall back to the metadata-based resolution used for BOOKING_CREATED.
  const companyId = original?.companyId ?? null;
  const userId = original?.userId ?? metadata.userId ?? null;
  const customerId = original?.customerId ?? metadata.customerId ?? null;
  const systemId = original?.systemId ?? metadata.systemId ?? null;

  if (!companyId || !userId) {
    console.warn('[cal-webhook] RESCHEDULED: cannot resolve companyId/userId — skipping insert');
    return NextResponse.json({ received: true });
  }

  const newBooking = await prisma.booking.upsert({
    where: { calBookingUid: newUid },
    update: {
      triggerEvent: 'BOOKING_RESCHEDULED',
      startTime,
      endTime,
      status: 'CONFIRMED',
      rescheduledFromUid: oldUid,
      title: (data.title as string) ?? null,
      attendeeName: attendee?.name ?? null,
      attendeeEmail: attendee?.email ?? null,
    },
    create: {
      calBookingUid: newUid,
      triggerEvent: 'BOOKING_RESCHEDULED',
      startTime,
      endTime,
      status: 'CONFIRMED',
      rescheduledFromUid: oldUid,
      title: (data.title as string) ?? null,
      attendeeName: attendee?.name ?? null,
      attendeeEmail: attendee?.email ?? null,
      companyId,
      userId,
      customerId,
      systemId,
    },
  });

  // Fire-and-forget reschedule email
  if (customerId) {
    const { sendBookingReschedule } = await import('@/lib/email/service');
    sendBookingReschedule(newBooking.id).catch((err) =>
      console.error(`[cal-webhook] reschedule email failed for ${newBooking.id}:`, err)
    );
  }

  console.info(`[cal-webhook] RESCHEDULED ${oldUid} -> ${newUid}`);
  return NextResponse.json({ received: true });
}
```

Wire the dispatcher (sketch):

```ts
  switch (triggerEvent) {
    case 'BOOKING_CREATED':
      return handleBookingCreated(data, triggerEvent);
    case 'BOOKING_RESCHEDULED':
      return handleBookingRescheduled(data);
    case 'BOOKING_CANCELLED':
      return handleBookingCancelled(data); // Task 8 fills this in
    default:
      return NextResponse.json({ received: true });
  }
```

(Keep `handleBookingCancelled` as a stub returning `{ received: true }` for now.)

- [ ] **Step 4: Re-run, verify pass**

Run:
```bash
npm test -- src/app/api/webhooks/cal/__tests__/route.test.ts
```
Expected: PASS for the reschedule test.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/cal/route.ts src/app/api/webhooks/cal/__tests__/route.test.ts
git commit -m "feat(cal-webhook): handle BOOKING_RESCHEDULED event"
```

---

## Task 8: Webhook — handle `BOOKING_CANCELLED`

**Files:**
- Modify: `src/app/api/webhooks/cal/route.ts`
- Modify: `src/app/api/webhooks/cal/__tests__/route.test.ts`

- [ ] **Step 1: Add failing test**

Append to the webhook test file:

```ts
describe('POST /api/webhooks/cal — BOOKING_CANCELLED', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CAL_WEBHOOK_SECRET = 'secret';
  });

  it('marks the booking as CANCELLED with reason + timestamp', async () => {
    (prisma.booking.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'db-id',
      calBookingUid: 'U1',
      customerId: 'cust1',
    });
    (prisma.booking.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'db-id',
    });

    const res = await POST(
      signedRequest('BOOKING_CANCELLED', {
        uid: 'U1',
        cancellationReason: 'Krankheit',
      })
    );

    expect(res.status).toBe(200);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { calBookingUid: 'U1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelReason: 'Krankheit',
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run, verify fails**

Run:
```bash
npm test -- src/app/api/webhooks/cal/__tests__/route.test.ts
```
Expected: FAIL — stub doesn't update.

- [ ] **Step 3: Implement the handler**

Replace the stub `handleBookingCancelled` with:

```ts
async function handleBookingCancelled(data: Record<string, unknown>) {
  const uid = (data.uid ?? data.bookingId) as string | undefined;
  if (!uid) {
    console.error('[cal-webhook] BOOKING_CANCELLED missing uid');
    return NextResponse.json({ received: true });
  }

  const reason =
    (data.cancellationReason as string | undefined) ??
    (data.cancelReason as string | undefined) ??
    null;

  const existing = await prisma.booking.findUnique({ where: { calBookingUid: uid } });
  if (!existing) {
    console.warn(`[cal-webhook] CANCELLED: booking ${uid} not found — ignoring`);
    return NextResponse.json({ received: true });
  }

  const updated = await prisma.booking.update({
    where: { calBookingUid: uid },
    data: {
      status: 'CANCELLED',
      cancelReason: reason,
      cancelledAt: new Date(),
    },
  });

  if (existing.customerId) {
    const { sendBookingCancellation } = await import('@/lib/email/service');
    sendBookingCancellation(updated.id).catch((err) =>
      console.error(`[cal-webhook] cancel email failed for ${updated.id}:`, err)
    );
  }

  console.info(`[cal-webhook] CANCELLED ${uid}`);
  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Re-run, verify pass**

Run:
```bash
npm test -- src/app/api/webhooks/cal/__tests__/route.test.ts
```
Expected: PASS (all webhook tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/cal/route.ts src/app/api/webhooks/cal/__tests__/route.test.ts
git commit -m "feat(cal-webhook): handle BOOKING_CANCELLED event"
```

---

## Task 9: `BookingRescheduleEmail` template

**Files:**
- Create: `src/lib/email/templates/BookingRescheduleEmail.tsx`

- [ ] **Step 1: Create the template component**

Create `src/lib/email/templates/BookingRescheduleEmail.tsx`:

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components';

export interface BookingRescheduleEmailProps {
  customerName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  reason: string | null;
  maxPhone: string;
  maxEmail: string;
  maxName: string;
  maxCompanyName: string | null;
}

export function BookingRescheduleEmail({
  customerName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  heaterManufacturer,
  heaterModel,
  heaterSerialNumber,
  reason,
  maxPhone,
  maxEmail,
  maxName,
  maxCompanyName,
}: BookingRescheduleEmailProps) {
  const heaterInfo = [heaterManufacturer, heaterModel].filter(Boolean).join(' ');

  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", backgroundColor: '#F7F7F7', padding: '20px' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
          <Section style={{ backgroundColor: '#008000', padding: '20px 28px' }}>
            <Text style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: '0', letterSpacing: '-0.5px' }}>torqr</Text>
            <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
              Wartungsmanagement
            </Text>
          </Section>

          <Section style={{ padding: '28px' }}>
            <Heading style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
              Ihr Wartungstermin wurde verschoben
            </Heading>

            <Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>Guten Tag {customerName},</Text>
            <Text style={{ color: '#5C5C5C', margin: '0 0 24px', lineHeight: '1.7' }}>
              wir müssen Ihren Wartungstermin verschieben. Nachfolgend der neue Termin.
            </Text>

            <Section style={{ backgroundColor: '#FFF4E5', borderLeft: '3px solid #E8A33D', borderRadius: '6px', padding: '12px 16px', margin: '0 0 12px' }}>
              <Text style={{ margin: '0 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Alter Termin
              </Text>
              <Text style={{ margin: '0', color: '#1A1A1A', textDecoration: 'line-through' }}>
                {oldDate} · {oldTime}
              </Text>
            </Section>

            <Section style={{ backgroundColor: '#E6F2E6', borderLeft: '3px solid #008000', borderRadius: '6px', padding: '12px 16px', margin: '0 0 24px' }}>
              <Text style={{ margin: '0 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Neuer Termin
              </Text>
              <Text style={{ margin: '0 0 2px', fontWeight: 600, color: '#1A1A1A', fontSize: '16px' }}>{newDate}</Text>
              <Text style={{ margin: '0 0 12px', color: '#006600' }}>{newTime}</Text>
              <Text style={{ margin: '12px 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderTop: '1px solid #99CC99', paddingTop: '12px' }}>
                Ihre Anlage
              </Text>
              <Text style={{ margin: '0 0 4px', fontWeight: 600, color: '#1A1A1A' }}>{heaterInfo}</Text>
              {heaterSerialNumber && (
                <Text style={{ margin: '0', color: '#9A9A9A', fontSize: '12px' }}>
                  Serien-Nr.: {heaterSerialNumber}
                </Text>
              )}
            </Section>

            {reason && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 16px' }}>
                Grund: {reason}
              </Text>
            )}

            <Hr style={{ margin: '32px 0 16px', borderColor: '#E0E0E0' }} />

            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 8px' }}>
              Falls der neue Termin nicht passt, melden Sie sich direkt:
            </Text>
            {maxPhone && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 4px' }}>
                Tel. <Link href={`tel:${maxPhone}`} style={{ color: '#008000' }}>{maxPhone}</Link>
              </Text>
            )}
            {maxEmail && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 16px' }}>
                E-Mail <Link href={`mailto:${maxEmail}`} style={{ color: '#008000' }}>{maxEmail}</Link>
              </Text>
            )}

            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0' }}>Mit freundlichen Grüßen,</Text>
            <Text style={{ color: '#1A1A1A', fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>{maxName}</Text>
            {maxCompanyName && (
              <Text style={{ color: '#9A9A9A', fontSize: '13px', margin: '2px 0 0' }}>{maxCompanyName}</Text>
            )}
          </Section>

          <Section style={{ backgroundColor: '#F7F7F7', borderTop: '1px solid #E0E0E0', padding: '14px 28px' }}>
            <Text style={{ color: '#9A9A9A', fontSize: '11px', margin: '0' }}>Automatisch versendet via torqr</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/BookingRescheduleEmail.tsx
git commit -m "feat(email): BookingRescheduleEmail template"
```

---

## Task 10: `BookingCancellationEmail` template

**Files:**
- Create: `src/lib/email/templates/BookingCancellationEmail.tsx`

- [ ] **Step 1: Create the template**

Create `src/lib/email/templates/BookingCancellationEmail.tsx`:

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components';

export interface BookingCancellationEmailProps {
  customerName: string;
  cancelledDate: string;
  cancelledTime: string;
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  reason: string | null;
  rebookUrl: string | null;
  maxPhone: string;
  maxEmail: string;
  maxName: string;
  maxCompanyName: string | null;
}

export function BookingCancellationEmail({
  customerName,
  cancelledDate,
  cancelledTime,
  heaterManufacturer,
  heaterModel,
  heaterSerialNumber,
  reason,
  rebookUrl,
  maxPhone,
  maxEmail,
  maxName,
  maxCompanyName,
}: BookingCancellationEmailProps) {
  const heaterInfo = [heaterManufacturer, heaterModel].filter(Boolean).join(' ');

  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", backgroundColor: '#F7F7F7', padding: '20px' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
          <Section style={{ backgroundColor: '#008000', padding: '20px 28px' }}>
            <Text style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: '0', letterSpacing: '-0.5px' }}>torqr</Text>
            <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
              Wartungsmanagement
            </Text>
          </Section>

          <Section style={{ padding: '28px' }}>
            <Heading style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
              Ihr Wartungstermin wurde storniert
            </Heading>

            <Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>Guten Tag {customerName},</Text>
            <Text style={{ color: '#5C5C5C', margin: '0 0 24px', lineHeight: '1.7' }}>
              Ihr Wartungstermin am <strong>{cancelledDate}</strong> um <strong>{cancelledTime}</strong> wurde storniert.
            </Text>

            <Section style={{ backgroundColor: '#FFE5E5', borderLeft: '3px solid #C73E3E', borderRadius: '6px', padding: '12px 16px', margin: '0 0 24px' }}>
              <Text style={{ margin: '0 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Stornierter Termin
              </Text>
              <Text style={{ margin: '0 0 2px', fontWeight: 600, color: '#1A1A1A', fontSize: '16px', textDecoration: 'line-through' }}>
                {cancelledDate}
              </Text>
              <Text style={{ margin: '0 0 12px', color: '#9A1F1F', textDecoration: 'line-through' }}>{cancelledTime}</Text>
              <Text style={{ margin: '12px 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderTop: '1px solid #E8B8B8', paddingTop: '12px' }}>
                Ihre Anlage
              </Text>
              <Text style={{ margin: '0 0 4px', fontWeight: 600, color: '#1A1A1A' }}>{heaterInfo}</Text>
              {heaterSerialNumber && (
                <Text style={{ margin: '0', color: '#9A9A9A', fontSize: '12px' }}>
                  Serien-Nr.: {heaterSerialNumber}
                </Text>
              )}
            </Section>

            {reason && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 16px' }}>
                Grund: {reason}
              </Text>
            )}

            {rebookUrl && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 24px' }}>
                <Link href={rebookUrl} style={{ color: '#008000', fontWeight: 600 }}>
                  Neuen Termin buchen →
                </Link>
              </Text>
            )}

            <Hr style={{ margin: '32px 0 16px', borderColor: '#E0E0E0' }} />

            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 8px' }}>Bei Fragen erreichen Sie uns direkt:</Text>
            {maxPhone && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 4px' }}>
                Tel. <Link href={`tel:${maxPhone}`} style={{ color: '#008000' }}>{maxPhone}</Link>
              </Text>
            )}
            {maxEmail && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 16px' }}>
                E-Mail <Link href={`mailto:${maxEmail}`} style={{ color: '#008000' }}>{maxEmail}</Link>
              </Text>
            )}

            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0' }}>Mit freundlichen Grüßen,</Text>
            <Text style={{ color: '#1A1A1A', fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>{maxName}</Text>
            {maxCompanyName && (
              <Text style={{ color: '#9A9A9A', fontSize: '13px', margin: '2px 0 0' }}>{maxCompanyName}</Text>
            )}
          </Section>

          <Section style={{ backgroundColor: '#F7F7F7', borderTop: '1px solid #E0E0E0', padding: '14px 28px' }}>
            <Text style={{ color: '#9A9A9A', fontSize: '11px', margin: '0' }}>Automatisch versendet via torqr</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/BookingCancellationEmail.tsx
git commit -m "feat(email): BookingCancellationEmail template"
```

---

## Task 11: Email service — `sendBookingReschedule` + `sendBookingCancellation`

**Files:**
- Modify: `src/lib/email/service.tsx`

- [ ] **Step 1: Extend the service**

Add these imports to `src/lib/email/service.tsx`:

```ts
import { BookingRescheduleEmail } from './templates/BookingRescheduleEmail';
import { BookingCancellationEmail } from './templates/BookingCancellationEmail';
```

Append these exports at the end of the file:

```ts
/**
 * Send a reschedule notification email to the customer whose booking was moved.
 * No-ops silently if the customer has no email or has unsubscribed.
 *
 * `oldStartTime` is the pre-reschedule start — required for the email copy.
 * Caller must pass it because the DB now already holds the new startTime.
 */
export async function sendBookingReschedule(
  bookingId: string,
  oldStartTime?: Date,
  reason?: string | null,
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      system: {
        include: {
          catalog: true,
          user: { select: { name: true, email: true, phone: true, company: { select: { name: true } } } },
        },
      },
    },
  });

  if (!booking?.customer?.email || !booking.system) return;
  if (booking.customer.emailOptIn === 'UNSUBSCRIBED') return;

  const { customer, system } = booking;
  const { catalog, user } = system;

  const newDate = format(booking.startTime, 'EEEE, dd. MMMM yyyy', { locale: de });
  const newTime = format(booking.startTime, "HH:mm 'Uhr'", { locale: de });
  const effectiveOld = oldStartTime ?? booking.startTime;
  const oldDate = format(effectiveOld, 'EEEE, dd. MMMM yyyy', { locale: de });
  const oldTime = format(effectiveOld, "HH:mm 'Uhr'", { locale: de });

  const html = await render(
    React.createElement(BookingRescheduleEmail, {
      customerName: customer.name,
      oldDate,
      oldTime,
      newDate,
      newTime,
      heaterManufacturer: catalog.manufacturer,
      heaterModel: catalog.name,
      heaterSerialNumber: system.serialNumber,
      reason: reason ?? null,
      maxPhone: user?.phone ?? '',
      maxEmail: user?.email ?? '',
      maxName: user?.name ?? '',
      maxCompanyName: user?.company?.name ?? null,
    })
  );

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email as string,
    subject: `Ihr Wartungstermin wurde verschoben – neuer Termin ${newDate}`,
    html,
  });

  await prisma.emailLog.create({
    data: {
      customerId: customer.id,
      type: 'BOOKING_RESCHEDULED',
      resendId: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
    },
  });

  if (error) {
    throw new Error(`Resend error for reschedule ${bookingId}: ${JSON.stringify(error)}`);
  }
}

/**
 * Send a cancellation notification email to the customer.
 * Includes a "rebook" link to CAL_COM_URL with pre-filled metadata when available.
 */
export async function sendBookingCancellation(
  bookingId: string,
  reason?: string | null,
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      system: {
        include: {
          catalog: true,
          user: { select: { name: true, email: true, phone: true, company: { select: { name: true } } } },
        },
      },
    },
  });

  if (!booking?.customer?.email || !booking.system) return;
  if (booking.customer.emailOptIn === 'UNSUBSCRIBED') return;

  const { customer, system } = booking;
  const { catalog, user } = system;

  const cancelledDate = format(booking.startTime, 'EEEE, dd. MMMM yyyy', { locale: de });
  const cancelledTime = format(booking.startTime, "HH:mm 'Uhr'", { locale: de });

  const rebookUrl = CAL_COM_URL
    ? (() => {
        const url = new URL(CAL_COM_URL);
        url.searchParams.set('metadata[customerId]', customer.id);
        url.searchParams.set('metadata[userId]', system.userId);
        url.searchParams.set('metadata[systemId]', system.id);
        if (customer.name) url.searchParams.set('name', customer.name);
        if (customer.email) url.searchParams.set('email', customer.email as string);
        return url.toString();
      })()
    : null;

  const html = await render(
    React.createElement(BookingCancellationEmail, {
      customerName: customer.name,
      cancelledDate,
      cancelledTime,
      heaterManufacturer: catalog.manufacturer,
      heaterModel: catalog.name,
      heaterSerialNumber: system.serialNumber,
      reason: reason ?? booking.cancelReason ?? null,
      rebookUrl,
      maxPhone: user?.phone ?? '',
      maxEmail: user?.email ?? '',
      maxName: user?.name ?? '',
      maxCompanyName: user?.company?.name ?? null,
    })
  );

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email as string,
    subject: `Ihr Wartungstermin am ${cancelledDate} wurde storniert`,
    html,
  });

  await prisma.emailLog.create({
    data: {
      customerId: customer.id,
      type: 'BOOKING_CANCELLED',
      resendId: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
    },
  });

  if (error) {
    throw new Error(`Resend error for cancellation ${bookingId}: ${JSON.stringify(error)}`);
  }
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/service.tsx
git commit -m "feat(email): sendBookingReschedule + sendBookingCancellation"
```

---

## Task 12: `GET /api/bookings` — extend with filters

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/app/api/bookings/route.ts`

- [ ] **Step 1: Add filter query schema**

In `src/lib/validations.ts`, add under the `BOOKING SCHEMAS` section:

```ts
export const bookingRangeEnum = z.enum(['upcoming', 'week', 'month', 'past', 'all']);
export const bookingSourceEnum = z.enum(['cal', 'manual', 'all']);
export const bookingStatusEnum = z.enum(['CONFIRMED', 'CANCELLED', 'RESCHEDULED']);
export const bookingSystemTypeEnum = z.enum(['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE', 'all']);

export const bookingListQuerySchema = z.object({
  range: bookingRangeEnum.optional().default('upcoming'),
  status: z.union([bookingStatusEnum, z.array(bookingStatusEnum)]).optional(),
  assignee: z.string().uuid().or(z.literal('unassigned')).optional(),
  customerId: uuidSchema.optional(),
  systemType: bookingSystemTypeEnum.optional(),
  source: bookingSourceEnum.optional().default('all'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});
```

- [ ] **Step 2: Rewrite `GET /api/bookings`**

Replace the existing `GET` in `src/app/api/bookings/route.ts` (keep `POST` unchanged):

```ts
import type { Prisma } from '@prisma/client';
import { bookingListQuerySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { userId, companyId, role } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const parsed = bookingListQuerySchema.safeParse({
      range: searchParams.get('range') ?? undefined,
      status: searchParams.getAll('status').length > 0 ? searchParams.getAll('status') : undefined,
      assignee: searchParams.get('assignee') ?? undefined,
      customerId: searchParams.get('customerId') ?? undefined,
      systemType: searchParams.get('systemType') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Filterparameter', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const f = parsed.data;
    const now = new Date();
    const where: Prisma.BookingWhereInput = { companyId };

    // Tenant + role scoping
    if (role === 'TECHNICIAN') {
      where.OR = [
        { assignedToUserId: userId },
        { system: { assignedToUserId: userId } },
      ];
    }

    // Customer filter
    if (f.customerId) where.customerId = f.customerId;

    // Assignee filter (OWNER-only; ignored for TECHNICIAN)
    if (role === 'OWNER' && f.assignee) {
      where.assignedToUserId = f.assignee === 'unassigned' ? null : f.assignee;
    }

    // System-type filter
    if (f.systemType && f.systemType !== 'all') {
      where.system = { ...(where.system as object | undefined), catalog: { systemType: f.systemType } };
    }

    // Source filter — cal bookings have triggerEvent starting with BOOKING_; manual starts with BOOKING_MANUAL
    if (f.source === 'manual') where.triggerEvent = 'BOOKING_MANUAL';
    else if (f.source === 'cal') where.triggerEvent = { not: 'BOOKING_MANUAL' };

    // Status filter (default: exclude CANCELLED unless explicitly requested)
    if (f.status) {
      const statusArr = Array.isArray(f.status) ? f.status : [f.status];
      where.status = { in: statusArr };
    } else {
      where.status = { in: ['CONFIRMED', 'RESCHEDULED'] };
    }

    // Range filter — overrides from/to when set to a preset
    if (f.from || f.to) {
      where.startTime = {};
      if (f.from) (where.startTime as Prisma.DateTimeFilter).gte = new Date(f.from);
      if (f.to) (where.startTime as Prisma.DateTimeFilter).lte = new Date(f.to);
    } else if (f.range === 'upcoming') {
      where.startTime = { gte: now };
    } else if (f.range === 'week') {
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.startTime = { gte: now, lte: weekLater };
    } else if (f.range === 'month') {
      const monthLater = new Date(now);
      monthLater.setMonth(monthLater.getMonth() + 1);
      where.startTime = { gte: now, lte: monthLater };
    } else if (f.range === 'past') {
      where.startTime = { lt: now };
    }
    // 'all' → no startTime filter

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        system: {
          select: {
            id: true,
            serialNumber: true,
            catalog: { select: { manufacturer: true, name: true, systemType: true } },
          },
        },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [
        { startTime: f.range === 'past' ? 'desc' : 'asc' },
      ],
      take: f.limit,
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Termine' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations.ts src/app/api/bookings/route.ts
git commit -m "feat(api/bookings): add range/status/assignee/customer/systemType/source filters"
```

---

## Task 13: `GET /api/bookings/[id]`

**Files:**
- Create: `src/app/api/bookings/[id]/route.ts`

- [ ] **Step 1: Scaffold the route with GET only**

Create `src/app/api/bookings/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bookings/[id]
 * Returns a single booking with full detail for the edit/cancel modals.
 * Tenant-scoped via companyId; TECHNICIAN can only see bookings assigned to them.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId, role } = await requireAuth();
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        companyId,
        ...(role === 'TECHNICIAN'
          ? { OR: [{ assignedToUserId: userId }, { system: { assignedToUserId: userId } }] }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, emailOptIn: true } },
        system: {
          select: {
            id: true,
            serialNumber: true,
            catalog: { select: { manufacturer: true, name: true, systemType: true } },
          },
        },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Termin nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching booking:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Termins' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/[id]/route.ts
git commit -m "feat(api/bookings): GET /api/bookings/[id]"
```

---

## Task 14: `PATCH /api/bookings/[id]` — manual reschedule branch

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/app/api/bookings/[id]/route.ts`

- [ ] **Step 1: Add reschedule schema**

In `src/lib/validations.ts`, under the `BOOKING SCHEMAS` section:

```ts
export const bookingRescheduleSchema = z.object({
  startTime: z.string().datetime('Ungültiges Datum'),
  endTime: z.string().datetime('Ungültiges Datum').optional(),
  notifyCustomer: z.boolean().optional().default(true),
  reason: z.string().max(500, 'Grund zu lang').optional().nullable(),
});

export const bookingCancelSchema = z.object({
  notifyCustomer: z.boolean().optional().default(true),
  reason: z.string().max(500, 'Grund zu lang').optional().nullable(),
});
```

- [ ] **Step 2: Add PATCH handler for manual bookings**

Append to `src/app/api/bookings/[id]/route.ts`:

```ts
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { bookingRescheduleSchema } from '@/lib/validations';
import { sendBookingReschedule } from '@/lib/email/service';
import { rescheduleCalBooking, CalComApiError } from '@/lib/cal-com/client';

function isManual(triggerEvent: string): boolean {
  return triggerEvent === 'BOOKING_MANUAL';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await requireOwner();
    const { id } = await params;
    const body = await request.json();
    const validated = bookingRescheduleSchema.parse(body);

    const existing = await prisma.booking.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Termin nicht gefunden' }, { status: 404 });
    }
    if (existing.status !== 'CONFIRMED') {
      return NextResponse.json(
        { success: false, error: 'Nur bestätigte Termine können verschoben werden' },
        { status: 409 }
      );
    }

    const newStart = new Date(validated.startTime);
    const newEnd = validated.endTime ? new Date(validated.endTime) : null;
    const oldStart = existing.startTime;

    if (isManual(existing.triggerEvent)) {
      // Manual branch: direct DB update
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          rescheduledAt: new Date(),
        },
      });

      if (validated.notifyCustomer && existing.customerId) {
        sendBookingReschedule(updated.id, oldStart, validated.reason ?? null).catch((err) =>
          console.error(`[bookings] reschedule email failed for ${updated.id}:`, err)
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    // Cal.com branch — filled in next task
    return NextResponse.json(
      { success: false, error: 'Cal.com reschedule not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur Inhaber können Termine verschieben' }, { status: 403 });
    }
    if (error instanceof CalComApiError) {
      return NextResponse.json(
        { success: false, error: 'Cal.com-Fehler beim Verschieben', details: String(error.body) },
        { status: 502 }
      );
    }
    console.error('Error rescheduling booking:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Verschieben des Termins' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations.ts src/app/api/bookings/[id]/route.ts
git commit -m "feat(api/bookings): PATCH manual reschedule"
```

---

## Task 15: `PATCH /api/bookings/[id]` — Cal.com branch

**Files:**
- Modify: `src/app/api/bookings/[id]/route.ts`

- [ ] **Step 1: Replace the `501` placeholder with the real cal-branch**

In the PATCH handler, replace:

```ts
    // Cal.com branch — filled in next task
    return NextResponse.json(
      { success: false, error: 'Cal.com reschedule not yet implemented' },
      { status: 501 }
    );
```

with:

```ts
    // Cal.com branch: call v2 API, mirror into DB, fire email.
    // If CAL_COM_API_KEY is unset, surface a clear error.
    if (!process.env.CAL_COM_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Cal.com API key not configured — reschedule via Cal.com dashboard required' },
        { status: 503 }
      );
    }

    const { newUid } = await rescheduleCalBooking({
      uid: existing.calBookingUid,
      startTime: newStart,
      reschedulingReason: validated.reason ?? undefined,
    });

    // Mark the old booking as RESCHEDULED (idempotent — webhook may have beaten us)
    await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: 'RESCHEDULED',
        rescheduledToUid: newUid,
        rescheduledAt: new Date(),
      },
    });

    // Insert-or-update the new booking (webhook may have arrived first).
    const newBooking = await prisma.booking.upsert({
      where: { calBookingUid: newUid },
      update: {
        startTime: newStart,
        endTime: newEnd,
        triggerEvent: 'BOOKING_RESCHEDULED',
        status: 'CONFIRMED',
        rescheduledFromUid: existing.calBookingUid,
      },
      create: {
        calBookingUid: newUid,
        triggerEvent: 'BOOKING_RESCHEDULED',
        startTime: newStart,
        endTime: newEnd,
        status: 'CONFIRMED',
        rescheduledFromUid: existing.calBookingUid,
        companyId: existing.companyId,
        userId: existing.userId,
        customerId: existing.customerId,
        systemId: existing.systemId,
        assignedToUserId: existing.assignedToUserId,
      },
    });

    if (validated.notifyCustomer && existing.customerId) {
      sendBookingReschedule(newBooking.id, oldStart, validated.reason ?? null).catch((err) =>
        console.error(`[bookings] cal reschedule email failed for ${newBooking.id}:`, err)
      );
    }

    return NextResponse.json({ success: true, data: newBooking });
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/[id]/route.ts
git commit -m "feat(api/bookings): PATCH Cal.com reschedule via v2 API"
```

---

## Task 16: `DELETE /api/bookings/[id]` — cancel (both branches)

**Files:**
- Modify: `src/app/api/bookings/[id]/route.ts`

- [ ] **Step 1: Append DELETE handler**

Append to `src/app/api/bookings/[id]/route.ts`:

```ts
import { bookingCancelSchema } from '@/lib/validations';
import { sendBookingCancellation } from '@/lib/email/service';
import { cancelCalBooking } from '@/lib/cal-com/client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId, role } = await requireAuth();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const validated = bookingCancelSchema.parse(body);

    const existing = await prisma.booking.findFirst({
      where: {
        id,
        companyId,
        ...(role === 'TECHNICIAN'
          ? { OR: [{ assignedToUserId: userId }, { system: { assignedToUserId: userId } }] }
          : {}),
      },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Termin nicht gefunden' }, { status: 404 });
    }
    if (existing.status !== 'CONFIRMED') {
      return NextResponse.json(
        { success: false, error: 'Nur bestätigte Termine können storniert werden' },
        { status: 409 }
      );
    }

    // Cal.com branch — call API first, then mirror
    if (!isManual(existing.triggerEvent)) {
      if (!process.env.CAL_COM_API_KEY) {
        return NextResponse.json(
          { success: false, error: 'Cal.com API key not configured' },
          { status: 503 }
        );
      }
      await cancelCalBooking({
        uid: existing.calBookingUid,
        cancellationReason: validated.reason ?? undefined,
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: validated.reason ?? null,
        cancelledAt: new Date(),
      },
    });

    if (validated.notifyCustomer && existing.customerId) {
      sendBookingCancellation(updated.id, validated.reason ?? null).catch((err) =>
        console.error(`[bookings] cancel email failed for ${updated.id}:`, err)
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (error instanceof CalComApiError) {
      return NextResponse.json(
        { success: false, error: 'Cal.com-Fehler beim Stornieren', details: String(error.body) },
        { status: 502 }
      );
    }
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Stornieren des Termins' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/[id]/route.ts
git commit -m "feat(api/bookings): DELETE cancel (manual + Cal.com branches)"
```

---

## Task 17: Extend `useBookings` hook with filters

**Files:**
- Modify: `src/hooks/useBookings.ts`

- [ ] **Step 1: Rewrite the hook to accept a filter object**

Replace the contents of `src/hooks/useBookings.ts` with:

```ts
import { useQuery } from '@tanstack/react-query';

export type BookingSource = 'cal' | 'manual' | 'all';
export type BookingRange = 'upcoming' | 'week' | 'month' | 'past' | 'all';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';

export interface BookingListFilters {
  range?: BookingRange;
  status?: BookingStatus[];
  assignee?: string; // userId | 'unassigned'
  customerId?: string;
  systemType?: 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE' | 'all';
  source?: BookingSource;
  from?: string; // ISO datetime
  to?: string;   // ISO datetime
  limit?: number;
}

export interface Booking {
  id: string;
  calBookingUid: string;
  triggerEvent: string;
  startTime: string;
  endTime: string | null;
  title: string | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  status: BookingStatus;
  cancelReason: string | null;
  cancelledAt: string | null;
  rescheduledFromUid: string | null;
  rescheduledToUid: string | null;
  rescheduledAt: string | null;
  createdAt: string;
  customerId: string | null;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  system: {
    id: string;
    serialNumber: string | null;
    catalog: { manufacturer: string; name: string; systemType: string };
  } | null;
  assignedToUserId: string | null;
  assignedTo: { id: string; name: string } | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function buildSearchParams(filters: BookingListFilters): string {
  const sp = new URLSearchParams();
  if (filters.range) sp.set('range', filters.range);
  if (filters.status) {
    for (const s of filters.status) sp.append('status', s);
  }
  if (filters.assignee) sp.set('assignee', filters.assignee);
  if (filters.customerId) sp.set('customerId', filters.customerId);
  if (filters.systemType && filters.systemType !== 'all') sp.set('systemType', filters.systemType);
  if (filters.source && filters.source !== 'all') sp.set('source', filters.source);
  if (filters.from) sp.set('from', filters.from);
  if (filters.to) sp.set('to', filters.to);
  if (filters.limit) sp.set('limit', String(filters.limit));
  return sp.toString();
}

/**
 * Fetch bookings. Accepts either a customerId (legacy short form) or a full filter object.
 */
export function useBookings(input?: string | BookingListFilters) {
  const filters: BookingListFilters =
    typeof input === 'string' ? { customerId: input } : input ?? {};

  const query = buildSearchParams(filters);

  return useQuery<Booking[]>({
    queryKey: ['bookings', filters],
    staleTime: 30_000,
    queryFn: async () => {
      const url = query ? `/api/bookings?${query}` : '/api/bookings';
      const res = await fetch(url);
      const result: ApiResponse<Booking[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Termine');
      }
      return result.data;
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean — both call sites (`dashboard/page.tsx` passes nothing, `customers/[id]/page.tsx` passes `customerId`) still work because the legacy string argument is accepted.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBookings.ts
git commit -m "feat(hooks): useBookings accepts full filter object"
```

---

## Task 18: `useBooking(id)` hook

**Files:**
- Modify: `src/hooks/useBookings.ts`

- [ ] **Step 1: Append the single-booking hook**

Append to `src/hooks/useBookings.ts`:

```ts
/**
 * Fetch a single booking by id with full detail (customer email, phone, system catalog).
 */
export function useBooking(id: string | null | undefined) {
  return useQuery<Booking>({
    queryKey: ['booking', id],
    enabled: !!id,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${id}`);
      const result: ApiResponse<Booking> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Termins');
      }
      return result.data;
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useBookings.ts
git commit -m "feat(hooks): useBooking(id)"
```

---

## Task 19: `useRescheduleBooking` + `useCancelBooking` mutations

**Files:**
- Modify: `src/hooks/useBookings.ts`

- [ ] **Step 1: Append mutation hooks**

Append to `src/hooks/useBookings.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface RescheduleInput {
  bookingId: string;
  startTime: string; // ISO
  endTime?: string;  // ISO
  notifyCustomer: boolean;
  reason?: string | null;
}

export function useRescheduleBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RescheduleInput) => {
      const res = await fetch(`/api/bookings/${input.bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: input.startTime,
          endTime: input.endTime,
          notifyCustomer: input.notifyCustomer,
          reason: input.reason ?? null,
        }),
      });
      const result: ApiResponse<Booking> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Verschieben');
      }
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking'] });
      qc.invalidateQueries({ queryKey: ['customer-systems'] });
    },
  });
}

export interface CancelInput {
  bookingId: string;
  notifyCustomer: boolean;
  reason?: string | null;
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CancelInput) => {
      const res = await fetch(`/api/bookings/${input.bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifyCustomer: input.notifyCustomer,
          reason: input.reason ?? null,
        }),
      });
      const result: ApiResponse<Booking> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Stornieren');
      }
      return result.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['booking'] });
      qc.invalidateQueries({ queryKey: ['customer-systems'] });
    },
  });
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBookings.ts
git commit -m "feat(hooks): useRescheduleBooking + useCancelBooking mutations"
```

---

## Task 20: DashboardNav — add "Termine" entry

**Files:**
- Modify: `src/components/DashboardNav.tsx`

- [ ] **Step 1: Insert between "Wartungen" and "Mitarbeiter"**

In `src/components/DashboardNav.tsx`, locate the `navigation` array and edit it to:

```ts
const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Kunden', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Systeme', href: '/dashboard/systems', icon: WrenchIcon },
  { name: 'Wartungen', href: '/dashboard/wartungen', icon: WrenchIcon },
  { name: 'Termine', href: '/dashboard/termine', icon: CalendarIcon },
  { name: 'Mitarbeiter', href: '/dashboard/employees', icon: UserCogIcon, ownerOnly: true },
];
```

(`CalendarIcon` is already imported.)

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardNav.tsx
git commit -m "feat(nav): add Termine entry"
```

---

## Task 21: Page skeleton — `/dashboard/termine`

**Files:**
- Create: `src/app/dashboard/termine/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/dashboard/termine/page.tsx`:

```tsx
'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  CalendarIcon,
  ListIcon,
  PlusIcon,
  Loader2Icon,
  GlobeIcon,
  WrenchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookings, type BookingListFilters } from '@/hooks/useBookings';
import { TermineFilters } from '@/components/termine/TermineFilters';
import { TermineList } from '@/components/termine/TermineList';
import { TermineCalendar } from '@/components/termine/TermineCalendar';
import { BookingDetailsDrawer } from '@/components/termine/BookingDetailsDrawer';
import { RescheduleBookingModal } from '@/components/termine/RescheduleBookingModal';
import { CancelBookingModal } from '@/components/termine/CancelBookingModal';

type View = 'list' | 'calendar';

function parseFilters(sp: URLSearchParams): BookingListFilters {
  const statusAll = sp.getAll('status');
  return {
    range: (sp.get('range') as BookingListFilters['range']) ?? 'upcoming',
    status: statusAll.length > 0 ? (statusAll as BookingListFilters['status']) : undefined,
    assignee: sp.get('assignee') ?? undefined,
    customerId: sp.get('customerId') ?? undefined,
    systemType: (sp.get('systemType') as BookingListFilters['systemType']) ?? 'all',
    source: (sp.get('source') as BookingListFilters['source']) ?? 'all',
  };
}

function TermineInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { data: session } = useSession();
  const isOwner = session?.user?.role === 'OWNER';

  const view: View = (sp.get('view') as View) === 'calendar' ? 'calendar' : 'list';
  const filters = useMemo(() => parseFilters(sp), [sp]);

  const { data: bookings, isLoading, error } = useBookings(filters);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const setView = (next: View) => {
    const params = new URLSearchParams(sp.toString());
    params.set('view', next);
    router.replace(`/dashboard/termine?${params.toString()}`);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Termine</h1>
          <p className="text-sm text-muted-foreground">
            Alle Wartungstermine – anstehend, vergangen, storniert
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
            <button
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setView('list')}
            >
              <ListIcon className="h-4 w-4" />
              Liste
            </button>
            <button
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'calendar'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setView('calendar')}
            >
              <CalendarIcon className="h-4 w-4" />
              Kalender
            </button>
          </div>
          {isOwner && (
            <Link href="/dashboard/systems">
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-1" />
                Termin erstellen
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <TermineFilters isOwner={isOwner} />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <GlobeIcon className="h-3.5 w-3.5 text-primary" />
          Cal.com
        </span>
        <span className="inline-flex items-center gap-1.5">
          <WrenchIcon className="h-3.5 w-3.5 text-muted-foreground" />
          Manuell
        </span>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive p-8">
          Fehler beim Laden: {error.message}
        </div>
      ) : view === 'list' ? (
        <TermineList
          bookings={bookings ?? []}
          isOwner={isOwner}
          onOpenDetails={setDetailId}
          onReschedule={setRescheduleId}
          onCancel={setCancelId}
        />
      ) : (
        <TermineCalendar
          filters={filters}
          onOpenDetails={setDetailId}
        />
      )}

      {/* Drawer + modals */}
      {detailId && (
        <BookingDetailsDrawer
          bookingId={detailId}
          isOwner={isOwner}
          onClose={() => setDetailId(null)}
          onReschedule={(id) => {
            setDetailId(null);
            setRescheduleId(id);
          }}
          onCancel={(id) => {
            setDetailId(null);
            setCancelId(id);
          }}
        />
      )}
      {rescheduleId && (
        <RescheduleBookingModal
          bookingId={rescheduleId}
          onClose={() => setRescheduleId(null)}
        />
      )}
      {cancelId && (
        <CancelBookingModal
          bookingId={cancelId}
          onClose={() => setCancelId(null)}
        />
      )}
    </div>
  );
}

export default function TerminePage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2Icon className="h-6 w-6 animate-spin" /></div>}>
      <TermineInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Commit (the imported components don't exist yet — page will error at build; that's intentional, fixed in Tasks 22-29)**

```bash
git add src/app/dashboard/termine/page.tsx
git commit -m "feat(termine): page shell with URL-driven view toggle"
```

---

## Task 22: `TermineFilters` component

**Files:**
- Create: `src/components/termine/TermineFilters.tsx`

- [ ] **Step 1: Create the filter bar**

Create `src/components/termine/TermineFilters.tsx`:

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomers } from '@/hooks/useCustomers';
import { useEmployees } from '@/hooks/useEmployees';
import { FilterIcon } from 'lucide-react';

interface TermineFiltersProps {
  isOwner: boolean;
}

const RANGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'upcoming', label: 'Anstehend' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'month', label: 'Dieser Monat' },
  { value: 'past', label: 'Vergangen' },
  { value: 'all', label: 'Alle' },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Aktiv (Standard)' },
  { value: 'CONFIRMED', label: 'Bestätigt' },
  { value: 'RESCHEDULED', label: 'Verschoben' },
  { value: 'CANCELLED', label: 'Storniert' },
];

const SYSTEM_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Alle Anlagen' },
  { value: 'HEATING', label: 'Heizung' },
  { value: 'AC', label: 'Klima' },
  { value: 'WATER_TREATMENT', label: 'Wasser' },
  { value: 'ENERGY_STORAGE', label: 'Energiespeicher' },
];

const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Alle Quellen' },
  { value: 'cal', label: 'Cal.com' },
  { value: 'manual', label: 'Manuell' },
];

export function TermineFilters({ isOwner }: TermineFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const { data: customers = [] } = useCustomers();
  const { data: employees = [] } = useEmployees({ activeOnly: true });

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString());
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
    router.replace(`/dashboard/termine?${params.toString()}`);
  };

  const selectClass =
    'w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
        <FilterIcon className="h-4 w-4 text-muted-foreground" />
        Filter
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        <select
          className={selectClass}
          value={sp.get('range') ?? 'upcoming'}
          onChange={(e) => setParam('range', e.target.value)}
          aria-label="Zeitraum"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={sp.get('status') ?? ''}
          onChange={(e) => setParam('status', e.target.value || null)}
          aria-label="Status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {isOwner ? (
          <select
            className={selectClass}
            value={sp.get('assignee') ?? ''}
            onChange={(e) => setParam('assignee', e.target.value || null)}
            aria-label="Techniker"
          >
            <option value="">Alle Techniker</option>
            <option value="unassigned">Nicht zugewiesen</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        ) : (
          <div className="px-2.5 py-1.5 text-sm text-muted-foreground italic">
            Meine Termine
          </div>
        )}

        <select
          className={selectClass}
          value={sp.get('customerId') ?? ''}
          onChange={(e) => setParam('customerId', e.target.value || null)}
          aria-label="Kunde"
        >
          <option value="">Alle Kunden</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={sp.get('systemType') ?? 'all'}
          onChange={(e) => setParam('systemType', e.target.value === 'all' ? null : e.target.value)}
          aria-label="Anlage"
        >
          {SYSTEM_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={sp.get('source') ?? 'all'}
          onChange={(e) => setParam('source', e.target.value === 'all' ? null : e.target.value)}
          aria-label="Quelle"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/termine/TermineFilters.tsx
git commit -m "feat(termine): URL-driven filter bar"
```

---

## Task 23: `TermineList` component

**Files:**
- Create: `src/components/termine/TermineList.tsx`

- [ ] **Step 1: Create the list component**

Create `src/components/termine/TermineList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MoreHorizontalIcon,
  GlobeIcon,
  WrenchIcon,
  CalendarIcon,
  UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Booking } from '@/hooks/useBookings';

interface TermineListProps {
  bookings: Booking[];
  isOwner: boolean;
  onOpenDetails: (id: string) => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
}

function isManual(b: Booking) {
  return b.triggerEvent === 'BOOKING_MANUAL';
}

function statusBadge(status: Booking['status']) {
  switch (status) {
    case 'CONFIRMED':
      return <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-status-ok-bg text-success border border-success/30">Bestätigt</span>;
    case 'RESCHEDULED':
      return <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-status-info-bg text-status-info-text border border-status-info-border">Verschoben</span>;
    case 'CANCELLED':
      return <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-status-overdue-bg text-status-overdue-text border border-status-overdue-border">Storniert</span>;
  }
}

export function TermineList({
  bookings,
  isOwner,
  onOpenDetails,
  onReschedule,
  onCancel,
}: TermineListProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Keine Termine mit diesen Filtern.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
      {bookings.map((b) => {
        const systemLabel = b.system
          ? [b.system.catalog.manufacturer, b.system.catalog.name].filter(Boolean).join(' ')
          : '–';
        const isPast = new Date(b.startTime) < new Date();

        return (
          <div
            key={b.id}
            className={`flex items-center gap-3 p-3 lg:p-4 hover:bg-muted/40 cursor-pointer transition-colors ${isPast ? 'opacity-70' : ''}`}
            onClick={() => onOpenDetails(b.id)}
          >
            {/* Source icon */}
            <div className="shrink-0" title={isManual(b) ? 'Manuell' : 'Cal.com'}>
              {isManual(b) ? (
                <WrenchIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <GlobeIcon className="h-4 w-4 text-primary" />
              )}
            </div>

            {/* Date/time */}
            <div className="shrink-0 w-36 lg:w-44">
              <div className="text-sm font-medium text-foreground">
                {format(new Date(b.startTime), 'EE, dd.MM.yyyy', { locale: de })}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(b.startTime), "HH:mm 'Uhr'", { locale: de })}
              </div>
            </div>

            {/* Customer */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {b.customer?.name ?? b.attendeeName ?? 'Unbekannt'}
              </div>
              <div className="text-xs text-muted-foreground truncate">{systemLabel}</div>
            </div>

            {/* Assignee (desktop/OWNER only) */}
            {isOwner && (
              <div className="hidden lg:flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground w-32">
                <UserIcon className="h-3.5 w-3.5" />
                <span className="truncate">{b.assignedTo?.name ?? '–'}</span>
              </div>
            )}

            {/* Status */}
            <div className="shrink-0 hidden sm:block">{statusBadge(b.status)}</div>

            {/* Actions */}
            <div
              className="relative shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === b.id ? null : b.id);
              }}
            >
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Aktionen"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </button>
              {openMenu === b.id && (
                <div className="absolute right-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg z-10 py-1">
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(null);
                      onOpenDetails(b.id);
                    }}
                  >
                    Details
                  </button>
                  {b.status === 'CONFIRMED' && isOwner && (
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(null);
                        onReschedule(b.id);
                      }}
                    >
                      Umplanen
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(null);
                        onCancel(b.id);
                      }}
                    >
                      Stornieren
                    </button>
                  )}
                  {b.customer && (
                    <>
                      <div className="my-1 border-t border-border" />
                      <Link
                        href={`/dashboard/customers/${b.customer.id}`}
                        className="block px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Zum Kunden
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/termine/TermineList.tsx
git commit -m "feat(termine): list view with row actions"
```

---

## Task 24: `BookingDetailsDrawer` component

**Files:**
- Create: `src/components/termine/BookingDetailsDrawer.tsx`

- [ ] **Step 1: Create drawer**

Create `src/components/termine/BookingDetailsDrawer.tsx`:

```tsx
'use client';

import Link from 'next/link';
import {
  XIcon,
  Loader2Icon,
  GlobeIcon,
  WrenchIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/hooks/useBookings';

interface Props {
  bookingId: string;
  isOwner: boolean;
  onClose: () => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
}

export function BookingDetailsDrawer({
  bookingId,
  isOwner,
  onClose,
  onReschedule,
  onCancel,
}: Props) {
  const { data: booking, isLoading, error } = useBooking(bookingId);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <aside
        className="w-full sm:max-w-md bg-background border-l border-border h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Termin-Details</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error || !booking ? (
          <div className="p-6 text-sm text-destructive">
            {error?.message || 'Termin nicht gefunden'}
          </div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Termin */}
            <section>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Termin</h3>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {format(new Date(booking.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })} ·{' '}
                {format(new Date(booking.startTime), "HH:mm 'Uhr'", { locale: de })}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Status: {booking.status === 'CONFIRMED' ? 'Bestätigt' : booking.status === 'RESCHEDULED' ? 'Verschoben' : 'Storniert'}
              </div>
              {booking.rescheduledFromUid && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Verschoben von Termin <code className="font-mono">{booking.rescheduledFromUid.slice(0, 8)}</code>
                  {booking.rescheduledAt && ` am ${format(new Date(booking.rescheduledAt), 'dd.MM.yyyy')}`}
                </div>
              )}
              {booking.status === 'CANCELLED' && booking.cancelledAt && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Storniert am {format(new Date(booking.cancelledAt), 'dd.MM.yyyy')}
                  {booking.cancelReason && ` · Grund: ${booking.cancelReason}`}
                </div>
              )}
            </section>

            {/* Kunde */}
            {booking.customer && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Kunde</h3>
                <Link
                  href={`/dashboard/customers/${booking.customer.id}`}
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  {booking.customer.name}
                </Link>
                {booking.customer.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    <a href={`tel:${booking.customer.phone}`} className="hover:text-foreground">
                      {booking.customer.phone}
                    </a>
                  </div>
                )}
                {booking.customer.email && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MailIcon className="h-3.5 w-3.5" />
                    <a href={`mailto:${booking.customer.email}`} className="hover:text-foreground">
                      {booking.customer.email}
                    </a>
                  </div>
                )}
              </section>
            )}

            {/* System */}
            {booking.system && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Anlage</h3>
                <div className="text-sm text-foreground">
                  {[booking.system.catalog.manufacturer, booking.system.catalog.name].filter(Boolean).join(' ')}
                </div>
                {booking.system.serialNumber && (
                  <div className="text-xs text-muted-foreground">
                    Serien-Nr.: {booking.system.serialNumber}
                  </div>
                )}
              </section>
            )}

            {/* Assignee */}
            {isOwner && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Zugewiesen</h3>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  {booking.assignedTo?.name ?? 'Nicht zugewiesen'}
                </div>
              </section>
            )}

            {/* Source */}
            <section>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Quelle</h3>
              <div className="flex items-center gap-2 text-sm">
                {booking.triggerEvent === 'BOOKING_MANUAL' ? (
                  <>
                    <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                    Manuell eingetragen
                  </>
                ) : (
                  <>
                    <GlobeIcon className="h-4 w-4 text-primary" />
                    Cal.com
                  </>
                )}
              </div>
            </section>

            {/* Actions */}
            {booking.status === 'CONFIRMED' && (
              <div className="flex gap-2 pt-3 border-t border-border">
                {isOwner && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onReschedule(booking.id)}
                  >
                    Umplanen
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onCancel(booking.id)}
                >
                  Stornieren
                </Button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/termine/BookingDetailsDrawer.tsx
git commit -m "feat(termine): booking details drawer"
```

---

## Task 25: Confirm `date-fns` dependency (no new install needed)

**Files:**
- None (verification only)

- [ ] **Step 1: Verify `date-fns` is installed**

Run:
```bash
node -e "console.log(require('date-fns/package.json').version)"
```
Expected: prints a version (package is already a direct dep per `package.json` — `"date-fns": "^4.1.0"`).

- [ ] **Step 2: No commit (verification only)**

Continue to Task 26.

---

## Task 26: `TermineCalendar` monthly grid component

**Files:**
- Create: `src/components/termine/TermineCalendar.tsx`

- [ ] **Step 1: Create the calendar view**

Create `src/components/termine/TermineCalendar.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { useBookings, type BookingListFilters, type Booking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';

interface TermineCalendarProps {
  filters: BookingListFilters;
  onOpenDetails: (id: string) => void;
}

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function TermineCalendar({ filters, onOpenDetails }: TermineCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const monthFilters: BookingListFilters = useMemo(
    () => ({
      ...filters,
      range: 'all',
      from: gridStart.toISOString(),
      to: gridEnd.toISOString(),
      limit: 500,
    }),
    [filters, gridStart, gridEnd]
  );

  const { data: bookings = [], isLoading } = useBookings(monthFilters);

  const bookingsByDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = format(new Date(b.startTime), 'yyyy-MM-dd');
      const arr = m.get(key) ?? [];
      arr.push(b);
      m.set(key, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return m;
  }, [bookings]);

  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted"
            onClick={() => setCursor(subMonths(cursor, 1))}
            aria-label="Vorheriger Monat"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-foreground min-w-[160px] text-center">
            {format(cursor, 'MMMM yyyy', { locale: de })}
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted"
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Nächster Monat"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
          Heute
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_HEADERS.map((wd) => (
          <div key={wd} className="p-2 text-xs font-medium text-muted-foreground text-center">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const past = day < new Date() && !isSameDay(day, new Date());
            const expanded = expandedDay === key;

            return (
              <div
                key={key}
                className={`min-h-[100px] p-1.5 transition-colors ${
                  inMonth ? 'bg-card' : 'bg-muted/30'
                } ${past ? 'opacity-70' : ''} ${
                  isToday(day) ? 'ring-2 ring-primary ring-inset' : ''
                }`}
                onClick={() => setExpandedDay(expanded ? null : key)}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {(expanded ? dayBookings : dayBookings.slice(0, 3)).map((b) => {
                    const sysLabel = b.system
                      ? b.system.catalog.manufacturer
                      : '';
                    return (
                      <button
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(b.id);
                        }}
                        className={`w-full text-left text-[11px] px-1.5 py-0.5 rounded truncate ${
                          b.status === 'CANCELLED'
                            ? 'bg-status-overdue-bg text-status-overdue-text line-through'
                            : b.status === 'RESCHEDULED'
                            ? 'bg-status-info-bg text-status-info-text'
                            : 'bg-status-ok-bg text-success'
                        }`}
                        title={`${format(new Date(b.startTime), 'HH:mm')} · ${b.customer?.name ?? b.attendeeName ?? ''}`}
                      >
                        {format(new Date(b.startTime), 'HH:mm')} · {b.customer?.name ?? sysLabel}
                      </button>
                    );
                  })}
                  {!expanded && dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      + {dayBookings.length - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/termine/TermineCalendar.tsx
git commit -m "feat(termine): monthly calendar grid view"
```

---

## Task 27: Calendar — make sure the day-expansion popover is usable

**Files:**
- Modify: `src/components/termine/TermineCalendar.tsx`

- [ ] **Step 1: Refinement — add click-outside to collapse expanded day**

Edit `TermineCalendar.tsx` to add a `useEffect` that resets `expandedDay` when the user clicks outside the grid. Add the import:

```tsx
import { useEffect, useRef } from 'react';
```

Add a ref and effect inside the component body (just after `const [expandedDay, setExpandedDay] = useState<string | null>(null);`):

```tsx
  const gridRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!expandedDay) return;
    const onClick = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setExpandedDay(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [expandedDay]);
```

And attach the ref to the grid wrapper:

```tsx
<div ref={gridRef} className="grid grid-cols-7 divide-x divide-y divide-border">
```

- [ ] **Step 2: Commit**

```bash
git add src/components/termine/TermineCalendar.tsx
git commit -m "feat(termine): click-outside collapses expanded calendar day"
```

---

## Task 28: `RescheduleBookingModal`

**Files:**
- Create: `src/components/termine/RescheduleBookingModal.tsx`

- [ ] **Step 1: Create the modal**

Create `src/components/termine/RescheduleBookingModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarIcon, Loader2Icon, XIcon, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useBooking, useRescheduleBooking } from '@/hooks/useBookings';

interface Props {
  bookingId: string;
  onClose: () => void;
}

export function RescheduleBookingModal({ bookingId, onClose }: Props) {
  const { data: booking, isLoading } = useBooking(bookingId);
  const reschedule = useRescheduleBooking();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState('60');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isManual = booking?.triggerEvent === 'BOOKING_MANUAL';
  const hasEmail = !!booking?.customer?.email;
  const unsubscribed = false; // customer emailOptIn is not included on the booking drawer; check in API. Use API truth.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !booking) return;
    setErrorMsg(null);
    try {
      const startTime = new Date(`${date}T${time}:00`).toISOString();
      const endTime = isManual
        ? new Date(
            new Date(`${date}T${time}:00`).getTime() + parseInt(duration, 10) * 60 * 1000
          ).toISOString()
        : undefined;

      await reschedule.mutateAsync({
        bookingId: booking.id,
        startTime,
        endTime,
        notifyCustomer: notifyCustomer && hasEmail,
        reason: reason.trim() || null,
      });
      toast.success('Termin verschoben');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verschieben fehlgeschlagen');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Termin verschieben</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !booking ? (
          <div className="flex items-center justify-center h-32">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Aktueller Termin
              </div>
              <div className="text-foreground">
                {format(new Date(booking.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </div>
              <div className="text-muted-foreground">
                {format(new Date(booking.startTime), "HH:mm 'Uhr'", { locale: de })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Neues Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className={`grid ${isManual ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Uhrzeit</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {isManual && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Dauer</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="30">30 Min.</option>
                    <option value="60">1 Stunde</option>
                    <option value="90">1,5 Stunden</option>
                    <option value="120">2 Stunden</option>
                    <option value="180">3 Stunden</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Grund (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Dem Kunden mitgeteilter Grund"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyCustomer && hasEmail && !unsubscribed}
                disabled={!hasEmail || unsubscribed}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Kunden per E-Mail benachrichtigen
                {!hasEmail && (
                  <span className="block text-xs text-muted-foreground">
                    Kein E-Mail-Kontakt hinterlegt — Benachrichtigung nicht möglich.
                  </span>
                )}
              </span>
            </label>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={reschedule.isPending || !date}>
                {reschedule.isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                Termin verschieben
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/termine/RescheduleBookingModal.tsx
git commit -m "feat(termine): reschedule booking modal (manual + Cal.com)"
```

---

## Task 29: `CancelBookingModal`

**Files:**
- Create: `src/components/termine/CancelBookingModal.tsx`

- [ ] **Step 1: Create the modal**

Create `src/components/termine/CancelBookingModal.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircleIcon, Loader2Icon, XIcon, XCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useBooking, useCancelBooking } from '@/hooks/useBookings';

interface Props {
  bookingId: string;
  onClose: () => void;
}

export function CancelBookingModal({ bookingId, onClose }: Props) {
  const { data: booking, isLoading } = useBooking(bookingId);
  const cancel = useCancelBooking();

  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasEmail = !!booking?.customer?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setErrorMsg(null);
    try {
      await cancel.mutateAsync({
        bookingId: booking.id,
        notifyCustomer: notifyCustomer && hasEmail,
        reason: reason.trim() || null,
      });
      toast.success('Termin storniert');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Stornieren fehlgeschlagen');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <XCircleIcon className="h-4 w-4 text-destructive" />
            <h2 className="text-base font-semibold text-foreground">Termin stornieren</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !booking ? (
          <div className="flex items-center justify-center h-32">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
              <div className="text-xs text-destructive uppercase tracking-wide mb-1">
                Wird storniert
              </div>
              <div className="text-foreground">
                {format(new Date(booking.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </div>
              <div className="text-muted-foreground">
                {format(new Date(booking.startTime), "HH:mm 'Uhr'", { locale: de })} ·{' '}
                {booking.customer?.name ?? '—'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Grund (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Dem Kunden mitgeteilter Grund"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyCustomer && hasEmail}
                disabled={!hasEmail}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Kunden per E-Mail benachrichtigen
                {!hasEmail && (
                  <span className="block text-xs text-muted-foreground">
                    Kein E-Mail-Kontakt hinterlegt — Benachrichtigung nicht möglich.
                  </span>
                )}
              </span>
            </label>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Zurück
              </Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={cancel.isPending}>
                {cancel.isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                Termin stornieren
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/termine/CancelBookingModal.tsx
git commit -m "feat(termine): cancel booking modal (manual + Cal.com)"
```

---

## Task 30: Dashboard — "Alle Termine anzeigen →" link

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add link under "Gebuchte Termine" tile**

Open `src/app/dashboard/page.tsx` and locate the block that renders `upcomingBookings` (the "Gebuchte Termine" card). At the bottom of that card/section, add:

```tsx
<div className="pt-3 border-t border-border mt-3">
  <Link
    href="/dashboard/termine"
    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
  >
    Alle Termine anzeigen
    <ArrowRightIcon className="h-3.5 w-3.5" />
  </Link>
</div>
```

(`Link` and `ArrowRightIcon` are already imported.)

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): link from Gebuchte Termine preview to /dashboard/termine"
```

---

## Task 31: Customer detail — rename "Cal.com Buchungen" → "Termine" with source icons

**Files:**
- Modify: `src/app/dashboard/customers/[id]/page.tsx`

- [ ] **Step 1: Update the bookings section**

In `src/app/dashboard/customers/[id]/page.tsx`, locate the block that renders `bookings` (currently labelled "Cal.com Buchungen"). Replace that section's heading + item template with:

```tsx
<div className="flex items-center justify-between mb-3">
  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
    <CalendarCheckIcon className="h-4 w-4 text-primary" />
    Termine
  </h2>
  <Link
    href={`/dashboard/termine?customerId=${customerId}`}
    className="text-xs text-primary hover:underline"
  >
    Alle Termine zu diesem Kunden →
  </Link>
</div>
```

Inside the row renderer, swap the existing leading icon for a conditional source icon:

```tsx
{booking.triggerEvent === 'BOOKING_MANUAL' ? (
  <WrenchIcon className="h-3.5 w-3.5 text-muted-foreground" title="Manuell" />
) : (
  <CalendarIcon className="h-3.5 w-3.5 text-primary" title="Cal.com" />
)}
```

(If `WrenchIcon` isn't imported in this file, add it to the `lucide-react` import at the top.)

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/customers/[id]/page.tsx
git commit -m "feat(customer): rename booking section + add source icons + link to filtered Termine"
```

---

## Task 32: Close-out — tests, typecheck, backlog update

**Files:**
- Modify: `docs/BACKLOG.md`

- [ ] **Step 1: Run the full test suite**

Run:
```bash
npm run test:run
```
Expected: all tests pass (cal-com client + webhook route tests green; no regressions elsewhere).

- [ ] **Step 2: Run the full typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Update `docs/BACKLOG.md`**

Read the current BACKLOG. Perform the following changes:

1. Move **#58 Cal.com webhook HMAC fail-open** from Open → Completed with `Resolved: 2026-04-23`.
2. Move **#45 Cal.com cancellation flow verify** from Open → Completed (now fully implemented end-to-end) with `Resolved: 2026-04-23`.
3. Move **#37 Technician calendar view** from Open → Completed *partially* (note: "Monthly calendar + filters shipped; vacation/availability + auto-rebook remain deferred") with `Resolved: 2026-04-23 (partial)`.
4. Add a new Open item `#NN Drag-and-drop rescheduling on calendar view — Priority Low — Found 2026-04-23`.
5. Add a new Open item `#NN Weekly/daily calendar modes — Priority Low — Found 2026-04-23`.
6. Add a new Open item `#NN Deploy CAL_COM_API_KEY to Vercel (prod + preview + dev) — Priority High — Found 2026-04-23`.

Use the established `| # | Area | Description | Priority | Found |` format.

- [ ] **Step 4: Final commit**

```bash
git add docs/BACKLOG.md
git commit -m "docs(backlog): resolve #58 #45; partial #37; add follow-ups for Termine v2"
```

- [ ] **Step 5: Confirm clean tree**

Run:
```bash
git status
```
Expected: `nothing to commit, working tree clean`.

- [ ] **Step 6: Done**

The Termine page ships end-to-end: schema + webhook + API + hooks + UI + emails + filters + calendar. Manual rescheduling/cancellation works without CAL_COM_API_KEY; Cal.com rescheduling/cancellation works once the key is deployed to Vercel.

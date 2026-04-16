# Account & Settings Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/dashboard/account` settings page with 4 independent sections: profile, password, notification preferences, and manual email actions — linked from the sidebar avatar chip.

**Architecture:** Single scrolling page composed of 4 self-contained card components, each owning its own form and API mutation. A `useUser` React Query hook centralises all server state. Three new API routes under `/api/user/` follow the established `requireAuth` + Zod + Prisma pattern.

**Tech Stack:** Next.js 14 App Router, React Query (TanStack Query v5), shadcn/ui, React Hook Form, Zod, Prisma, bcryptjs, Resend (React Email)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Add `companyName` and `emailWeeklySummary` to `User` |
| Modify | `src/lib/validations.ts` | Add 3 new Zod schemas for user API endpoints |
| Create | `src/app/api/user/profile/route.ts` | `GET` + `PATCH` profile fields |
| Create | `src/app/api/user/password/route.ts` | `PATCH` password change |
| Create | `src/app/api/user/preferences/route.ts` | `PATCH` notification preferences |
| Create | `src/app/api/user/send-weekly-summary/route.ts` | `POST` manual summary trigger |
| Modify | `src/lib/email/templates/ReminderEmail.tsx` | Add `companyName` prop + display in footer |
| Modify | `src/lib/email/service.tsx` | Pass `companyName` to template; guard `sendWeeklySummary` on preference |
| Create | `src/hooks/useUser.ts` | React Query hook: fetch profile + 3 mutations |
| Create | `src/components/account/ProfileCard.tsx` | Section 1: name, email, phone, company |
| Create | `src/components/account/PasswordCard.tsx` | Section 2: change password |
| Create | `src/components/account/NotificationsCard.tsx` | Section 3: weekly summary toggle |
| Create | `src/components/account/EmailActionsCard.tsx` | Section 4: manual send button |
| Create | `src/app/dashboard/account/page.tsx` | Page: assembles the 4 cards |
| Modify | `src/components/DashboardNav.tsx` | Wrap user chip in `<Link href="/dashboard/account">` |

---

## Task 1: Prisma Schema — Add `companyName` and `emailWeeklySummary` to User

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add two fields to the User model**

Open `prisma/schema.prisma`. After the `phone String?` line (line 23), add:

```prisma
  companyName        String?
  emailWeeklySummary Boolean  @default(true)
```

The updated User model block should look like:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  phone         String?
  companyName        String?
  emailWeeklySummary Boolean  @default(true)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  customers     Customer[]
  heaters       Heater[]
  maintenances  Maintenance[]
  sessions      Session[]
  bookings      Booking[]

  @@map("users")
}
```

- [ ] **Step 2: Run migration**

```bash
cd c:/Users/y.dorth/Documents/torqr_app/torqr_app
npx prisma migrate dev --name add_user_account_fields
```

Expected: migration file created, applied to local DB, Prisma client regenerated.

- [ ] **Step 3: Verify TypeScript build still passes**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add companyName and emailWeeklySummary fields to User model"
```

---

## Task 2: Zod Schemas for User API Endpoints

**Files:**
- Modify: `src/lib/validations.ts`

- [ ] **Step 1: Add 3 new schemas to the USER SCHEMAS section**

Open `src/lib/validations.ts`. After the closing `});` of `userUpdateSchema` (around line 106), append:

```ts
/**
 * User profile update schema (account page — profile card)
 */
export const userProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name zu lang')
    .trim()
    .optional(),
  email: emailSchema.optional(),
  phone: optionalPhoneSchema.optional(),
  companyName: z
    .string()
    .max(100, 'Firmenname zu lang')
    .trim()
    .optional()
    .or(z.literal('')),
});

/**
 * Password change schema (account page — password card)
 */
export const userPasswordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: passwordSchema,
});

/**
 * User preferences update schema (account page — notifications card)
 */
export const userPreferencesUpdateSchema = z.object({
  emailWeeklySummary: z.boolean(),
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations.ts
git commit -m "feat: add Zod schemas for user profile, password, and preferences endpoints"
```

---

## Task 3: API Route — GET + PATCH `/api/user/profile`

**Files:**
- Create: `src/app/api/user/profile/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { userProfileUpdateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, companyName: true, emailWeeklySummary: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = userProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabe', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, phone, companyName } = parsed.data;

    // Check email uniqueness if changing email
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Diese E-Mail-Adresse wird bereits verwendet' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone === '' ? null : phone }),
        ...(companyName !== undefined && { companyName: companyName === '' ? null : companyName }),
      },
      select: { name: true, email: true, phone: true, companyName: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/profile/route.ts
git commit -m "feat: add GET+PATCH /api/user/profile endpoint"
```

---

## Task 4: API Route — PATCH `/api/user/password`

**Files:**
- Create: `src/app/api/user/password/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/user/password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { userPasswordUpdateSchema } from '@/lib/validations';
import { verifyPassword, hashPassword } from '@/lib/password';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = userPasswordUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabe', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Aktuelles Passwort ist falsch' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/password/route.ts
git commit -m "feat: add PATCH /api/user/password endpoint"
```

---

## Task 5: API Route — PATCH `/api/user/preferences`

**Files:**
- Create: `src/app/api/user/preferences/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { userPreferencesUpdateSchema } from '@/lib/validations';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = userPreferencesUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabe', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { emailWeeklySummary: parsed.data.emailWeeklySummary },
      select: { emailWeeklySummary: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/preferences/route.ts
git commit -m "feat: add PATCH /api/user/preferences endpoint"
```

---

## Task 6: API Route — POST `/api/user/send-weekly-summary`

**Files:**
- Create: `src/app/api/user/send-weekly-summary/route.ts`

> This is a separate auth-protected endpoint for the manual trigger — distinct from the cron GET endpoint which requires `CRON_SECRET`. It calls the same `sendWeeklySummary()` function.

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/user/send-weekly-summary/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { sendWeeklySummary } from '@/lib/email/service';

export async function POST() {
  try {
    const { userId } = await requireAuth();
    const { emailsSent } = await sendWeeklySummary(userId);

    if (emailsSent === 0) {
      return NextResponse.json({
        success: true,
        message: 'Wochenzusammenfassung ist deaktiviert. Aktiviere sie in den Benachrichtigungseinstellungen.',
      });
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/send-weekly-summary/route.ts
git commit -m "feat: add POST /api/user/send-weekly-summary manual trigger endpoint"
```

---

## Task 7: Email Template — Add `companyName` to Reminder Email

**Files:**
- Modify: `src/lib/email/templates/ReminderEmail.tsx`
- Modify: `src/lib/email/service.tsx`

- [ ] **Step 1: Add `companyName` prop to `ReminderEmailProps` interface**

In `src/lib/email/templates/ReminderEmail.tsx`, add `companyName` to the interface and destructure it:

```ts
export interface ReminderEmailProps {
  customerName: string;
  maintenanceDate: string;
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  weeksUntil: 4 | 1;
  calComUrl: string;
  maxPhone: string;
  maxEmail: string;
  maxName: string;
  maxCompanyName: string | null;   // ← add this
  unsubscribeUrl: string;
}
```

Add `maxCompanyName` to the destructured props in the function signature:

```ts
export function ReminderEmail({
  customerName,
  maintenanceDate,
  heaterManufacturer,
  heaterModel,
  heaterSerialNumber,
  weeksUntil,
  calComUrl,
  maxPhone,
  maxEmail,
  maxName,
  maxCompanyName,   // ← add this
  unsubscribeUrl,
}: ReminderEmailProps) {
```

- [ ] **Step 2: Display `companyName` in the sign-off section**

Find the sign-off block (after the second `<Hr />`) and replace it with:

```tsx
          {/* Sign-off */}
          <Text style={{ color: '#374151', fontSize: '14px', margin: '0' }}>
            Mit freundlichen Grüßen,
          </Text>
          <Text style={{ color: '#111827', fontSize: '14px', fontWeight: '600', margin: '4px 0 0' }}>
            {maxName}
          </Text>
          {maxCompanyName && (
            <Text style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>
              {maxCompanyName}
            </Text>
          )}
```

- [ ] **Step 3: Update `sendReminder` in `service.tsx` to fetch and pass `companyName`**

In `src/lib/email/service.tsx`, find the `include` block inside `sendReminder`:

```ts
      user: { select: { name: true, email: true, phone: true } },
```

Replace with:

```ts
      user: { select: { name: true, email: true, phone: true, companyName: true } },
```

Then in the `React.createElement(ReminderEmail, {...})` call, add `maxCompanyName`:

```ts
      maxCompanyName: user?.companyName ?? null,
```

The full `React.createElement` call becomes:

```ts
  const html = await render(
    React.createElement(ReminderEmail, {
      customerName: customer.name,
      maintenanceDate,
      heaterManufacturer: heater.manufacturer,
      heaterModel: heater.model,
      heaterSerialNumber: heater.serialNumber,
      weeksUntil,
      calComUrl: CAL_COM_URL
        ? `${CAL_COM_URL}?metadata[customerId]=${customer.id}&metadata[userId]=${heater.userId}`
        : CAL_COM_URL,
      maxPhone: user?.phone ?? '',
      maxEmail: user?.email ?? '',
      maxName: user?.name ?? '',
      maxCompanyName: user?.companyName ?? null,
      unsubscribeUrl: buildUnsubscribeUrl(customer.id),
    })
  );
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/templates/ReminderEmail.tsx src/lib/email/service.tsx
git commit -m "feat: add companyName to reminder email footer"
```

---

## Task 8: Email Service — Update `sendWeeklySummary` to Accept `userId` + Check Preference

**Files:**
- Modify: `src/lib/email/service.tsx`

- [ ] **Step 1: Update `sendWeeklySummary` signature and logic**

Find the `sendWeeklySummary` function. Replace the entire function with:

```ts
/**
 * Send the weekly summary email to a user.
 * If userId provided (manual trigger): looks up user by ID.
 * If no userId (cron): falls back to SUMMARY_RECIPIENT_EMAIL env var.
 * Respects the user's emailWeeklySummary preference — returns { emailsSent: 0 } if disabled.
 */
export async function sendWeeklySummary(userId?: string): Promise<{ emailsSent: number }> {
  let user;

  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`No user found for userId: ${userId}`);
  } else {
    const recipientEmail = process.env.SUMMARY_RECIPIENT_EMAIL;
    if (!recipientEmail) throw new Error('SUMMARY_RECIPIENT_EMAIL is not set');
    user = await prisma.user.findUnique({ where: { email: recipientEmail } });
    if (!user) throw new Error(`No user found for SUMMARY_RECIPIENT_EMAIL: ${recipientEmail}`);
  }

  if (!user.emailWeeklySummary) {
    return { emailsSent: 0 };
  }

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
    to: user.email,
    subject: `Wochenübersicht ${weekLabel}`,
    html,
  });

  if (error) throw new Error(`Resend error for weekly summary: ${JSON.stringify(error)}`);

  return { emailsSent: 1 };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/service.tsx
git commit -m "feat: sendWeeklySummary accepts userId param and respects emailWeeklySummary preference"
```

---

## Task 9: `useUser` React Query Hook

**Files:**
- Create: `src/hooks/useUser.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/useUser.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  emailWeeklySummary: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/user/profile');
  const result: ApiResponse<UserProfile> = await res.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Fehler beim Laden des Profils');
  }
  return result.data;
}

export function useUser() {
  const queryClient = useQueryClient();

  const query = useQuery<UserProfile>({
    queryKey: ['user'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });

  const updateProfile = useMutation({
    mutationFn: async (fields: Partial<Pick<UserProfile, 'name' | 'email' | 'phone' | 'companyName'>>) => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result: ApiResponse<UserProfile> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Speichern');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (fields: { currentPassword: string; newPassword: string }) => {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Ändern des Passworts');
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (fields: { emailWeeklySummary: boolean }) => {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result: ApiResponse<{ emailWeeklySummary: boolean }> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Speichern');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const sendWeeklySummary = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/send-weekly-summary', { method: 'POST' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Senden');
      return result;
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile,
    updatePassword,
    updatePreferences,
    sendWeeklySummary,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUser.ts
git commit -m "feat: add useUser React Query hook"
```

---

## Task 10: `ProfileCard` Component

**Files:**
- Create: `src/components/account/ProfileCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/account/ProfileCard.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, UserProfile } from '@/hooks/useUser';

type ProfileFormValues = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
};

export function ProfileCard() {
  const { data, updateProfile } = useUser();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    defaultValues: { name: '', email: '', phone: '', companyName: '' },
  });

  // Populate form once data loads
  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        email: data.email,
        phone: data.phone ?? '',
        companyName: data.companyName ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(values);
      toast.success('Profil erfolgreich gespeichert');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Vollständiger Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name ist erforderlich', minLength: { value: 2, message: 'Mindestens 2 Zeichen' } })}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'E-Mail ist erforderlich' })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input id="phone" type="tel" placeholder="Optional" {...register('phone')} />
              <p className="text-xs text-muted-foreground">Erscheint in Wartungserinnerungen</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname</Label>
              <Input id="companyName" placeholder="Optional" {...register('companyName')} />
              <p className="text-xs text-muted-foreground">Erscheint in Wartungserinnerungen</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
            {updateProfile.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/account/ProfileCard.tsx
git commit -m "feat: add ProfileCard component for account page"
```

---

## Task 11: `PasswordCard` Component

**Files:**
- Create: `src/components/account/PasswordCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/account/PasswordCard.tsx
'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/useUser';

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function PasswordCard() {
  const { updatePassword } = useUser();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await updatePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Passwort erfolgreich geändert');
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passwort ändern</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register('currentPassword', { required: 'Aktuelles Passwort ist erforderlich' })}
            />
            {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword', {
                required: 'Neues Passwort ist erforderlich',
                minLength: { value: 8, message: 'Mindestens 8 Zeichen' },
                pattern: { value: /[A-Z]/, message: 'Mindestens ein Großbuchstabe erforderlich' },
              })}
            />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: 'Bitte Passwort bestätigen',
                validate: (value) => value === newPassword || 'Passwörter stimmen nicht überein',
              })}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={updatePassword.isPending}>
            {updatePassword.isPending ? 'Wird gespeichert…' : 'Passwort ändern'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/account/PasswordCard.tsx
git commit -m "feat: add PasswordCard component for account page"
```

---

## Task 12: `NotificationsCard` Component

**Files:**
- Create: `src/components/account/NotificationsCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/account/NotificationsCard.tsx
'use client';

import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/useUser';

export function NotificationsCard() {
  const { data, updatePreferences } = useUser();

  const handleToggle = async (checked: boolean) => {
    try {
      await updatePreferences.mutateAsync({ emailWeeklySummary: checked });
      toast.success('Einstellung gespeichert');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benachrichtigungen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="weekly-summary" className="text-base font-medium">
              Wochenzusammenfassung
            </Label>
            <p className="text-sm text-muted-foreground">
              Wöchentliche E-Mail mit offenen Wartungen und Buchungsübersicht erhalten
            </p>
          </div>
          <Switch
            id="weekly-summary"
            checked={data?.emailWeeklySummary ?? true}
            onCheckedChange={handleToggle}
            disabled={updatePreferences.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/account/NotificationsCard.tsx
git commit -m "feat: add NotificationsCard component for account page"
```

---

## Task 13: `EmailActionsCard` Component

**Files:**
- Create: `src/components/account/EmailActionsCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/account/EmailActionsCard.tsx
'use client';

import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SendIcon } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export function EmailActionsCard() {
  const { sendWeeklySummary } = useUser();

  const handleSendSummary = async () => {
    try {
      const result = await sendWeeklySummary.mutateAsync();
      if ('message' in result && result.message) {
        toast.info(result.message as string);
      } else {
        toast.success('Wochenzusammenfassung wurde gesendet');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden. Bitte erneut versuchen.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manuelle E-Mail-Aktionen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Wochenzusammenfassung</p>
            <p className="text-sm text-muted-foreground">
              Wochenzusammenfassung jetzt manuell an deine E-Mail-Adresse senden
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendSummary}
            disabled={sendWeeklySummary.isPending}
            className="shrink-0"
          >
            <SendIcon className="mr-2 h-4 w-4" />
            {sendWeeklySummary.isPending ? 'Wird gesendet…' : 'Jetzt senden'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/account/EmailActionsCard.tsx
git commit -m "feat: add EmailActionsCard component for account page"
```

---

## Task 14: Account Page

**Files:**
- Create: `src/app/dashboard/account/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/dashboard/account/page.tsx
import { ProfileCard } from '@/components/account/ProfileCard';
import { PasswordCard } from '@/components/account/PasswordCard';
import { NotificationsCard } from '@/components/account/NotificationsCard';
import { EmailActionsCard } from '@/components/account/EmailActionsCard';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Konto & Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-1">{session.user.email}</p>
      </div>

      {/* Independent card sections */}
      <ProfileCard />
      <PasswordCard />
      <NotificationsCard />
      <EmailActionsCard />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/account/page.tsx
git commit -m "feat: add /dashboard/account page"
```

---

## Task 15: Update DashboardNav — Avatar Chip Links to Account Page

**Files:**
- Modify: `src/components/DashboardNav.tsx`

- [ ] **Step 1: Wrap the user section div in a Link**

In `src/components/DashboardNav.tsx`, find the user section inside the bottom area (around line 143):

```tsx
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold shrink-0">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-sidebar-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
```

Replace the outer `<div className={...flex items-center...}>` with a `<Link>` that wraps the avatar + name block (but NOT the logout button — logout stays as-is). The new structure:

```tsx
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Link
              href="/dashboard/account"
              className={`flex items-center gap-3 min-w-0 flex-1 rounded-lg hover:bg-sidebar-accent/60 transition-colors ${collapsed ? 'justify-center p-1' : 'p-1'}`}
              title="Konto & Einstellungen"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold shrink-0">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-sidebar-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center w-8 h-8 rounded-md text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent transition-colors shrink-0"
                title="Abmelden"
              >
                <LogOutIcon className="h-4 w-4" />
              </button>
            )}
          </div>
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Run the dev server and verify the link works**

```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard`, click the avatar chip at the bottom-left — should navigate to `/dashboard/account`. Verify all 4 cards render and the page header shows correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/DashboardNav.tsx
git commit -m "feat: link sidebar avatar chip to /dashboard/account"
```

---

## Self-Review Checklist

- [x] Spec §Section 1 (Profil): ProfileCard + PATCH /api/user/profile — Task 3 + 10
- [x] Spec §Section 2 (Passwort): PasswordCard + PATCH /api/user/password — Task 4 + 11
- [x] Spec §Section 3 (Benachrichtigungen): NotificationsCard + PATCH /api/user/preferences — Task 5 + 12
- [x] Spec §Section 4 (E-Mail-Aktionen): EmailActionsCard + POST /api/user/send-weekly-summary — Task 6 + 13
- [x] Spec §Data Model: companyName + emailWeeklySummary on User — Task 1
- [x] Spec §Sidebar Link: DashboardNav avatar chip → /dashboard/account — Task 15
- [x] Spec §Email Impact: companyName in reminder email footer — Task 7; emailWeeklySummary guard in cron — Task 8
- [x] Spec §useUser hook — Task 9
- [x] All API routes use `requireAuth()` — consistent with established pattern
- [x] All mutations invalidate `['user']` query key after success
- [x] `sendWeeklySummary` backward-compatible: optional `userId` param, falls back to `SUMMARY_RECIPIENT_EMAIL` for cron
- [x] No cross-tenant data: all DB queries scoped to authenticated `userId`
- [x] Logout button preserved as standalone button, not inside the Link wrapper

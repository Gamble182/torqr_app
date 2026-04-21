# Sprint 19 — Email Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rethink the weekly summary email into an actionable weekly plan, add user-customizable reminder email wording, and write comprehensive email system documentation.

**Architecture:** Three independent deliverables. (1) Rewrite `sendWeeklySummary()` with 7 new queries and completely rewrite `WeeklySummaryEmail.tsx` with section-based layout. (2) Add two nullable fields to User model for reminder customization, extend profile API and account page. (3) Write `docs/EMAIL-SYSTEM.md` as living reference. All changes follow existing patterns — Prisma, Zod, React Email, React Hook Form, React Query.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma, Zod, React Email, React Hook Form, TanStack Query, shadcn/ui, Tailwind CSS, sonner.

**Spec:** `docs/superpowers/specs/2026-04-21-sprint19-email-rework-design.md`

---

## Task 1: Prisma Migration — Add Reminder Template Fields to User

**Files:**
- Modify: `prisma/schema.prisma:13-32` (User model)
- Create: `prisma/migrations/[timestamp]_add_reminder_template_fields/migration.sql` (auto-generated)

- [ ] **Step 1: Add fields to User model in schema.prisma**

In `prisma/schema.prisma`, add two fields after `emailWeeklySummary`:

```prisma
model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  passwordHash       String
  name               String
  phone              String?
  companyName        String?
  emailWeeklySummary Boolean   @default(true)
  reminderGreeting   String?
  reminderBody       String?
  emailVerified      DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  customers       Customer[]
  customerSystems CustomerSystem[]
  maintenances    Maintenance[]
  sessions        Session[]
  bookings        Booking[]

  @@map("users")
}
```

- [ ] **Step 2: Generate and apply migration**

Run:
```bash
npx prisma migrate dev --name add_reminder_template_fields
```

Expected: Migration created and applied. Two nullable `text` columns added to `users` table.

- [ ] **Step 3: Generate Prisma client**

Run:
```bash
npx prisma generate
```

Expected: Prisma client updated with `reminderGreeting` and `reminderBody` on `User` type.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add reminderGreeting and reminderBody fields to User model"
```

---

## Task 2: Zod Validation — Add Reminder Template Fields

**Files:**
- Modify: `src/lib/validations.ts:111-126` (userProfileUpdateSchema)

- [ ] **Step 1: Extend userProfileUpdateSchema**

In `src/lib/validations.ts`, add `reminderGreeting` and `reminderBody` to the `userProfileUpdateSchema`:

```typescript
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
  reminderGreeting: z
    .string()
    .max(200, 'Begrüßung zu lang (max. 200 Zeichen)')
    .trim()
    .optional()
    .nullable(),
  reminderBody: z
    .string()
    .max(1000, 'Nachrichtentext zu lang (max. 1000 Zeichen)')
    .trim()
    .optional()
    .nullable(),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations.ts
git commit -m "feat: add reminderGreeting/reminderBody to profile validation schema"
```

---

## Task 3: API — Extend Profile Route for Template Fields

**Files:**
- Modify: `src/app/api/user/profile/route.ts`

- [ ] **Step 1: Update GET handler to return new fields**

In the `GET` handler, add `reminderGreeting` and `reminderBody` to the `select`:

```typescript
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        companyName: true,
        emailWeeklySummary: true,
        reminderGreeting: true,
        reminderBody: true,
      },
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
```

- [ ] **Step 2: Update PATCH handler to accept and persist new fields**

In the `PATCH` handler, destructure and persist the new fields:

```typescript
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

    const { name, email, phone, companyName, reminderGreeting, reminderBody } = parsed.data;

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
        ...(reminderGreeting !== undefined && { reminderGreeting: reminderGreeting === '' ? null : reminderGreeting }),
        ...(reminderBody !== undefined && { reminderBody: reminderBody === '' ? null : reminderBody }),
      },
      select: {
        name: true,
        email: true,
        phone: true,
        companyName: true,
        reminderGreeting: true,
        reminderBody: true,
      },
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

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/user/profile/route.ts
git commit -m "feat: extend profile API to read/write reminder template fields"
```

---

## Task 4: Update useUser Hook — Add Template Fields to Type

**Files:**
- Modify: `src/hooks/useUser.ts`

- [ ] **Step 1: Extend UserProfile interface and updateProfile mutation**

```typescript
export interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  emailWeeklySummary: boolean;
  reminderGreeting: string | null;
  reminderBody: string | null;
}
```

Update the `updateProfile` mutation type to include the new fields:

```typescript
const updateProfile = useMutation({
  mutationFn: async (fields: Partial<Pick<UserProfile, 'name' | 'email' | 'phone' | 'companyName' | 'reminderGreeting' | 'reminderBody'>>) => {
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUser.ts
git commit -m "feat: add reminderGreeting/reminderBody to useUser hook"
```

---

## Task 5: ReminderEmail Template — Support Custom Greeting & Body

**Files:**
- Modify: `src/lib/email/templates/ReminderEmail.tsx`

- [ ] **Step 1: Add new props and render custom text**

Add `customGreeting` and `customBody` to the props interface. These arrive already placeholder-replaced from the service layer.

```typescript
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
  maxCompanyName: string | null;
  unsubscribeUrl: string;
  customGreeting?: string;
  customBody?: string;
}
```

In the component body, replace the hardcoded greeting and body paragraphs. Find these lines:

```tsx
<Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>
  Guten Tag {customerName},
</Text>
<Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>
  die letzte Wartung Ihrer Heizungsanlage liegt in{' '}
  <strong style={{ color: '#1A1A1A' }}>{weeksUntil} {weekWord}</strong> genau ein Jahr zurück.
</Text>
<Text style={{ color: '#5C5C5C', margin: '0 0 24px', lineHeight: '1.7' }}>
  Wir empfehlen, jetzt rechtzeitig einen neuen Wartungstermin zu buchen — regelmäßige
  Wartungen sichern den effizienten Betrieb Ihrer Anlage und beugen teuren Reparaturen vor.
</Text>
```

Replace with:

```tsx
<Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>
  {customGreeting ?? `Guten Tag ${customerName},`}
</Text>
{customBody ? (
  customBody.split('\n').filter(Boolean).map((paragraph, i) => (
    <Text key={i} style={{ color: '#5C5C5C', margin: i === customBody!.split('\n').filter(Boolean).length - 1 ? '0 0 24px' : '0 0 8px', lineHeight: '1.7' }}>
      {paragraph}
    </Text>
  ))
) : (
  <>
    <Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>
      die letzte Wartung Ihrer Heizungsanlage liegt in{' '}
      <strong style={{ color: '#1A1A1A' }}>{weeksUntil} {weekWord}</strong> genau ein Jahr zurück.
    </Text>
    <Text style={{ color: '#5C5C5C', margin: '0 0 24px', lineHeight: '1.7' }}>
      Wir empfehlen, jetzt rechtzeitig einen neuen Wartungstermin zu buchen — regelmäßige
      Wartungen sichern den effizienten Betrieb Ihrer Anlage und beugen teuren Reparaturen vor.
    </Text>
  </>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/templates/ReminderEmail.tsx
git commit -m "feat: support customGreeting/customBody in ReminderEmail template"
```

---

## Task 6: Service Layer — Pass Custom Fields to sendReminder

**Files:**
- Modify: `src/lib/email/service.tsx:17-92` (sendReminder function)

- [ ] **Step 1: Add reminderGreeting and reminderBody to user select and template props**

In `sendReminder()`, the user is already fetched via `system.user`. Extend the user select to include the new fields:

```typescript
user: { select: { name: true, email: true, phone: true, companyName: true, reminderGreeting: true, reminderBody: true } },
```

Before the `React.createElement(ReminderEmail, ...)` call, add placeholder replacement:

```typescript
const customGreeting = user?.reminderGreeting
  ? user.reminderGreeting.replace('{customerName}', customer.name)
  : undefined;
const customBody = user?.reminderBody
  ? user.reminderBody.replace('{customerName}', customer.name)
  : undefined;
```

Add the two new props to the `React.createElement` call:

```typescript
customGreeting,
customBody,
```

Place them after `unsubscribeUrl: buildUnsubscribeUrl(customer.id),`.

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/service.tsx
git commit -m "feat: pass user's custom reminder greeting/body to ReminderEmail template"
```

---

## Task 7: EmailTemplateCard — Account Page UI Component

**Files:**
- Create: `src/components/account/EmailTemplateCard.tsx`

- [ ] **Step 1: Create the EmailTemplateCard component**

Follow the exact same pattern as `ProfileCard.tsx` — React Hook Form, useUser hook, Card from shadcn/ui.

```typescript
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/hooks/useUser';

type TemplateFormValues = {
  reminderGreeting: string;
  reminderBody: string;
};

const DEFAULT_GREETING = 'Guten Tag {customerName},';
const DEFAULT_BODY = `die letzte Wartung Ihrer Heizungsanlage liegt bald ein Jahr zurück.\n\nWir empfehlen, jetzt rechtzeitig einen neuen Wartungstermin zu buchen — regelmäßige Wartungen sichern den effizienten Betrieb Ihrer Anlage und beugen teuren Reparaturen vor.`;

export function EmailTemplateCard() {
  const { data, updateProfile } = useUser();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<TemplateFormValues>({
    defaultValues: { reminderGreeting: '', reminderBody: '' },
  });

  useEffect(() => {
    if (data) {
      reset({
        reminderGreeting: data.reminderGreeting ?? '',
        reminderBody: data.reminderBody ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: TemplateFormValues) => {
    try {
      await updateProfile.mutateAsync({
        reminderGreeting: values.reminderGreeting || null,
        reminderBody: values.reminderBody || null,
      });
      toast.success('E-Mail-Vorlage gespeichert');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-Mail-Vorlage</CardTitle>
        <CardDescription>
          Passen Sie den Text Ihrer Wartungserinnerungen an. Leer lassen für Standardtext.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminderGreeting">Begrüßung</Label>
            <Input
              id="reminderGreeting"
              placeholder={DEFAULT_GREETING}
              className="text-base h-11"
              maxLength={200}
              {...register('reminderGreeting')}
            />
            <p className="text-xs text-muted-foreground">
              Verfügbarer Platzhalter: <code className="bg-muted px-1 rounded">{'{customerName}'}</code>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderBody">Nachrichtentext</Label>
            <Textarea
              id="reminderBody"
              placeholder={DEFAULT_BODY}
              className="text-base min-h-[120px]"
              maxLength={1000}
              {...register('reminderBody')}
            />
            <p className="text-xs text-muted-foreground">
              Verfügbarer Platzhalter: <code className="bg-muted px-1 rounded">{'{customerName}'}</code> · Zeilenumbrüche werden übernommen
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!isDirty || updateProfile.isPending} className="h-11 sm:h-9 w-full sm:w-auto">
            {updateProfile.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Verify the Textarea component exists in shadcn/ui**

Run:
```bash
ls src/components/ui/textarea.tsx
```

If it doesn't exist, generate it:
```bash
npx shadcn-ui@latest add textarea
```

- [ ] **Step 3: Add EmailTemplateCard to account page**

In `src/app/dashboard/account/page.tsx`, add the import and render the card after `<NotificationsCard />`:

```typescript
import { EmailTemplateCard } from '@/components/account/EmailTemplateCard';
```

In the JSX, after `<EmailActionsCard />`:

```tsx
<ProfileCard />
<PasswordCard />
<NotificationsCard />
<EmailTemplateCard />
<EmailActionsCard />
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/account/EmailTemplateCard.tsx src/app/dashboard/account/page.tsx
git commit -m "feat: add EmailTemplateCard to account page for customizing reminder email"
```

---

## Task 8: Weekly Summary Email — Rewrite Template

**Files:**
- Modify: `src/lib/email/templates/WeeklySummaryEmail.tsx` (complete rewrite)

- [ ] **Step 1: Replace the entire WeeklySummaryEmail component**

Rewrite `src/lib/email/templates/WeeklySummaryEmail.tsx` with the new section-based design:

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components';

// -- Prop types --

export interface BookingItem {
  customerName: string;
  systemInfo: string;
  dateTime: string;
}

export interface DueUnbookedItem {
  customerName: string;
  systemInfo: string;
  dueDate: string;
}

export interface OverdueItem {
  customerName: string;
  systemInfo: string;
  daysOverdue: number;
}

export interface WeeklySummaryEmailProps {
  userName: string;
  weekLabel: string;
  bookingsThisWeek: BookingItem[];
  bookingsThisWeekMore?: number;
  dueUnbooked: DueUnbookedItem[];
  dueUnbookedMore?: number;
  overdue: OverdueItem[];
  overdueMore?: number;
  retro: {
    maintenancesCompleted: number;
    bookingsAttended: number;
    remindersSent: number;
  };
  totals: {
    customers: number;
    systems: number;
  };
}

// -- Shared styles --

const sectionLabel = {
  fontSize: '11px' as const,
  fontWeight: 600 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 10px',
};

const listItemName = {
  margin: '0',
  fontWeight: 500 as const,
  color: '#1A1A1A',
  fontSize: '14px',
};

const listItemDetail = {
  margin: '2px 0 0',
  fontSize: '12px',
};

// -- Component --

export function WeeklySummaryEmail({
  userName,
  weekLabel,
  bookingsThisWeek,
  bookingsThisWeekMore,
  dueUnbooked,
  dueUnbookedMore,
  overdue,
  overdueMore,
  retro,
  totals,
}: WeeklySummaryEmailProps) {
  const hasRetroActivity =
    retro.maintenancesCompleted > 0 ||
    retro.bookingsAttended > 0 ||
    retro.remindersSent > 0;

  return (
    <Html lang="de">
      <Head />
      <Body
        style={{
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          backgroundColor: '#F7F7F7',
          padding: '20px',
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E0E0E0',
          }}
        >
          {/* Brand Header */}
          <Section style={{ backgroundColor: '#008000', padding: '20px 28px' }}>
            <Text
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#FFFFFF',
                margin: '0',
                letterSpacing: '-0.5px',
              }}
            >
              torqr
            </Text>
            <Text
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.65)',
                margin: '2px 0 0',
                textTransform: 'uppercase' as const,
                letterSpacing: '1px',
              }}
            >
              Wartungsmanagement
            </Text>
          </Section>

          <Section style={{ padding: '28px' }}>
            {/* Greeting */}
            <Heading
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1A1A1A',
                margin: '0 0 4px',
                letterSpacing: '-0.3px',
              }}
            >
              Wochenübersicht
            </Heading>
            <Text style={{ color: '#5C5C5C', margin: '0 0 4px', lineHeight: '1.7' }}>
              Guten Tag {userName},
            </Text>
            <Text style={{ color: '#9A9A9A', margin: '0 0 24px', fontSize: '14px' }}>
              {weekLabel}
            </Text>

            {/* Section 1: Bookings this week */}
            <Section
              style={{
                backgroundColor: '#E6F2E6',
                borderLeft: '3px solid #008000',
                borderRadius: '6px',
                padding: '14px 16px',
                margin: '0 0 16px',
              }}
            >
              <Text style={{ ...sectionLabel, color: '#006600' }}>
                Termine diese Woche
              </Text>
              {bookingsThisWeek.length === 0 ? (
                <Text style={{ margin: '0', color: '#5C5C5C', fontSize: '14px' }}>
                  Keine Termine diese Woche gebucht.
                </Text>
              ) : (
                <>
                  {bookingsThisWeek.map((item, i) => (
                    <Section key={i} style={{ marginBottom: i < bookingsThisWeek.length - 1 ? '8px' : '0' }}>
                      <Text style={listItemName}>{item.customerName}</Text>
                      <Text style={{ ...listItemDetail, color: '#5C5C5C' }}>
                        {item.systemInfo} · {item.dateTime}
                      </Text>
                    </Section>
                  ))}
                  {bookingsThisWeekMore && bookingsThisWeekMore > 0 && (
                    <Text style={{ margin: '8px 0 0', color: '#9A9A9A', fontSize: '12px' }}>
                      … und {bookingsThisWeekMore} weitere
                    </Text>
                  )}
                </>
              )}
            </Section>

            {/* Section 2: Due but unbooked */}
            <Section
              style={{
                backgroundColor: '#FEF3C7',
                borderLeft: '3px solid #D97706',
                borderRadius: '6px',
                padding: '14px 16px',
                margin: '0 0 16px',
              }}
            >
              <Text style={{ ...sectionLabel, color: '#92400E' }}>
                Wartungen fällig — noch nicht gebucht
              </Text>
              {dueUnbooked.length === 0 ? (
                <Text style={{ margin: '0', color: '#5C5C5C', fontSize: '14px' }}>
                  Alle fälligen Wartungen sind terminiert.
                </Text>
              ) : (
                <>
                  {dueUnbooked.map((item, i) => (
                    <Section key={i} style={{ marginBottom: i < dueUnbooked.length - 1 ? '8px' : '0' }}>
                      <Text style={listItemName}>{item.customerName}</Text>
                      <Text style={{ ...listItemDetail, color: '#92400E' }}>
                        {item.systemInfo} · Fällig: {item.dueDate}
                      </Text>
                    </Section>
                  ))}
                  {dueUnbookedMore && dueUnbookedMore > 0 && (
                    <Text style={{ margin: '8px 0 0', color: '#9A9A9A', fontSize: '12px' }}>
                      … und {dueUnbookedMore} weitere
                    </Text>
                  )}
                </>
              )}
            </Section>

            {/* Section 3: Overdue (hidden if empty) */}
            {overdue.length > 0 && (
              <Section
                style={{
                  backgroundColor: '#FEE2E2',
                  borderLeft: '3px solid #DC2626',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  margin: '0 0 16px',
                }}
              >
                <Text style={{ ...sectionLabel, color: '#991B1B' }}>
                  Überfällige Wartungen
                </Text>
                {overdue.map((item, i) => (
                  <Section key={i} style={{ marginBottom: i < overdue.length - 1 ? '8px' : '0' }}>
                    <Text style={listItemName}>{item.customerName}</Text>
                    <Text style={{ ...listItemDetail, color: '#991B1B' }}>
                      {item.systemInfo} · {item.daysOverdue} Tage überfällig
                    </Text>
                  </Section>
                ))}
                {overdueMore && overdueMore > 0 && (
                  <Text style={{ margin: '8px 0 0', color: '#9A9A9A', fontSize: '12px' }}>
                    … und {overdueMore} weitere
                  </Text>
                )}
              </Section>
            )}

            {/* Section 4: Retro */}
            <Section
              style={{
                backgroundColor: '#F3F4F6',
                borderLeft: '3px solid #9CA3AF',
                borderRadius: '6px',
                padding: '14px 16px',
                margin: '0 0 16px',
              }}
            >
              <Text style={{ ...sectionLabel, color: '#4B5563' }}>
                Rückblick letzte Woche
              </Text>
              <Text style={{ margin: '0', color: '#5C5C5C', fontSize: '14px' }}>
                {hasRetroActivity
                  ? `${retro.maintenancesCompleted} Wartungen durchgeführt · ${retro.bookingsAttended} Termine wahrgenommen · ${retro.remindersSent} Erinnerungen versendet`
                  : 'Keine Aktivitäten letzte Woche.'}
              </Text>
            </Section>

            {/* Totals line */}
            <Hr style={{ margin: '8px 0 12px', borderColor: '#E0E0E0' }} />
            <Text
              style={{
                color: '#9A9A9A',
                fontSize: '12px',
                margin: '0',
                textAlign: 'center' as const,
              }}
            >
              Gesamt: {totals.customers} Kunden · {totals.systems} Anlagen
            </Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: '#F7F7F7',
              borderTop: '1px solid #E0E0E0',
              padding: '14px 28px',
            }}
          >
            <Text
              style={{
                color: '#9A9A9A',
                fontSize: '11px',
                textAlign: 'center' as const,
                margin: '0',
              }}
            >
              torqr · Automatisch generiert
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/templates/WeeklySummaryEmail.tsx
git commit -m "feat: rewrite WeeklySummaryEmail with section-based actionable layout"
```

---

## Task 9: Service Layer — Rewrite sendWeeklySummary Queries

**Files:**
- Modify: `src/lib/email/service.tsx:163-231` (sendWeeklySummary function)

- [ ] **Step 1: Rewrite the query block and data mapping**

Replace the entire `sendWeeklySummary` function body (keeping the signature) with:

```typescript
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

  const LIST_LIMIT = 10;

  // All queries in parallel
  const [
    bookingsRaw,
    dueSystemsRaw,
    overdueRaw,
    completedMaintenances,
    reminderLogs,
    customerCount,
    systemCount,
  ] = await Promise.all([
    // Confirmed bookings this week
    prisma.booking.findMany({
      where: {
        userId: user.id,
        status: 'CONFIRMED',
        startTime: { gte: now, lte: weekEnd },
      },
      include: {
        customer: { select: { name: true } },
        system: { include: { catalog: true } },
      },
      orderBy: { startTime: 'asc' },
    }),
    // Systems due this week
    prisma.customerSystem.findMany({
      where: {
        userId: user.id,
        nextMaintenance: { gte: now, lte: weekEnd },
      },
      include: {
        catalog: true,
        customer: { select: { name: true } },
        bookings: {
          where: { status: 'CONFIRMED', startTime: { gte: now } },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { nextMaintenance: 'asc' },
    }),
    // Overdue systems
    prisma.customerSystem.findMany({
      where: {
        userId: user.id,
        nextMaintenance: { lt: now },
      },
      include: {
        catalog: true,
        customer: { select: { name: true } },
      },
      orderBy: { nextMaintenance: 'asc' },
    }),
    // Maintenances completed last week
    prisma.maintenance.findMany({
      where: { userId: user.id, date: { gte: weekAgo, lte: now } },
      select: { id: true },
    }),
    // Reminders sent last week
    prisma.emailLog.count({
      where: {
        sentAt: { gte: weekAgo, lte: now },
        type: { in: ['REMINDER_4_WEEKS', 'REMINDER_1_WEEK'] },
        customer: { userId: user.id },
      },
    }),
    // Total customers
    prisma.customer.count({ where: { userId: user.id } }),
    // Total systems
    prisma.customerSystem.count({ where: { userId: user.id } }),
  ]);

  // Bookings attended last week (past confirmed bookings)
  const bookingsAttendedLastWeek = await prisma.booking.count({
    where: {
      userId: user.id,
      status: 'CONFIRMED',
      startTime: { gte: weekAgo, lte: now },
    },
  });

  // Filter due systems: only those WITHOUT a future confirmed booking
  const dueUnbookedAll = dueSystemsRaw.filter((s) => s.bookings.length === 0);

  // Map to email props with limits
  const bookingsThisWeek = bookingsRaw.slice(0, LIST_LIMIT).map((b) => ({
    customerName: b.customer?.name ?? 'Unbekannt',
    systemInfo: b.system
      ? [b.system.catalog.manufacturer, b.system.catalog.name].filter(Boolean).join(' ')
      : '–',
    dateTime: `${format(b.startTime, 'EE, dd.MM.', { locale: de })} · ${format(b.startTime, "HH:mm 'Uhr'", { locale: de })}`,
  }));

  const dueUnbooked = dueUnbookedAll.slice(0, LIST_LIMIT).map((s) => ({
    customerName: s.customer?.name ?? 'Unbekannt',
    systemInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
    dueDate: s.nextMaintenance ? format(s.nextMaintenance, 'dd.MM.yyyy') : '–',
  }));

  const overdue = overdueRaw.slice(0, LIST_LIMIT).map((s) => ({
    customerName: s.customer?.name ?? 'Unbekannt',
    systemInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
    daysOverdue: s.nextMaintenance ? differenceInDays(now, s.nextMaintenance) : 0,
  }));

  const weekLabel = `${format(now, 'dd.MM.')} – ${format(weekEnd, 'dd.MM.yyyy')}`;

  const html = await render(
    React.createElement(WeeklySummaryEmail, {
      userName: user.name,
      weekLabel,
      bookingsThisWeek,
      bookingsThisWeekMore: bookingsRaw.length > LIST_LIMIT ? bookingsRaw.length - LIST_LIMIT : undefined,
      dueUnbooked,
      dueUnbookedMore: dueUnbookedAll.length > LIST_LIMIT ? dueUnbookedAll.length - LIST_LIMIT : undefined,
      overdue,
      overdueMore: overdueRaw.length > LIST_LIMIT ? overdueRaw.length - LIST_LIMIT : undefined,
      retro: {
        maintenancesCompleted: completedMaintenances.length,
        bookingsAttended: bookingsAttendedLastWeek,
        remindersSent: reminderLogs,
      },
      totals: {
        customers: customerCount,
        systems: systemCount,
      },
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

Note: The import of `WeeklySummaryEmail` at the top of the file stays the same. The new template uses different prop types, so the old import still resolves correctly once the template is rewritten (Task 8).

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/service.tsx
git commit -m "feat: rewrite sendWeeklySummary with actionable section-based data queries"
```

---

## Task 10: Email System Documentation

**Files:**
- Create: `docs/EMAIL-SYSTEM.md`

- [ ] **Step 1: Write the comprehensive documentation**

Create `docs/EMAIL-SYSTEM.md` with the following content. This is a living reference document. It covers the complete email system as it exists after Sprint 19.

```markdown
# Email System — Torqr

> Living reference document. Last updated: 2026-04-21 (Sprint 19).

---

## Overview

Torqr sends automated emails to customers (maintenance reminders, booking confirmations) and to the shop owner (weekly summary). All emails are in German. Sending is handled by [Resend](https://resend.com) via React Email templates.

---

## Email Types

| Type | Trigger | Recipient | Template | Subject Pattern |
|------|---------|-----------|----------|-----------------|
| `REMINDER_4_WEEKS` | Daily cron — system's `nextMaintenance` is 28 days away | Customer | `ReminderEmail.tsx` | `Wartungserinnerung – Ihre Anlage: Termin in 4 Wochen` |
| `REMINDER_1_WEEK` | Daily cron — system's `nextMaintenance` is 7 days away | Customer | `ReminderEmail.tsx` | `Wartungserinnerung – Ihre Anlage: Termin in 1 Woche` |
| `BOOKING_CONFIRMATION` | Manual booking created via `BookingFormModal` | Customer | `BookingConfirmationEmail.tsx` | `Ihr Wartungstermin am {date}` |
| `WEEKLY_SUMMARY` | Weekly cron (Mon 07:00 UTC) or manual trigger from account page | Shop owner (User) | `WeeklySummaryEmail.tsx` | `Wochenübersicht {weekLabel}` |
| `OPT_IN_CONFIRMATION` | (Planned, not yet implemented) | Customer | — | — |

---

## Sending Infrastructure

| Setting | Value |
|---------|-------|
| Provider | Resend |
| Client | Singleton in `src/lib/email/client.ts` |
| FROM address | `RESEND_FROM_EMAIL` env var (default: `noreply@torqr.de`) |
| Domain | `torqr.de` — DNS records (SPF, DKIM) configured in Cloudflare |

---

## Cron Jobs

### Daily Reminders

- **Route:** `POST /api/cron/daily-reminders`
- **Schedule:** Daily at 06:00 UTC (`vercel.json`)
- **Auth:** `Authorization: Bearer {CRON_SECRET}`
- **Logic:**
  1. For each reminder type (`REMINDER_4_WEEKS`, `REMINDER_1_WEEK`):
     - Find systems where `nextMaintenance` falls within ±1 day of the target window (28 or 7 days from now)
     - Exclude systems whose customer has `emailOptIn != CONFIRMED` or no email
     - Exclude systems where a reminder of the same type was already sent in the last 30 days (deduplication)
  2. Send reminder for each eligible system via `sendReminder(systemId, type)`
  3. Log results to `CronRun`

### Weekly Summary

- **Route:** `POST /api/cron/weekly-summary`
- **Schedule:** Monday at 07:00 UTC (`vercel.json`)
- **Auth:** `Authorization: Bearer {CRON_SECRET}`
- **Logic:**
  1. Resolve user via `SUMMARY_RECIPIENT_EMAIL` env var (cron) or `userId` param (manual trigger)
  2. Check `user.emailWeeklySummary` preference — skip if disabled
  3. Query 7 data sets in parallel (bookings, due/unbooked, overdue, completed, reminders sent, totals)
  4. Render `WeeklySummaryEmail` template and send via Resend
  5. Log results to `CronRun`

---

## Data Flow

```
┌─────────────┐     ┌──────────────────────┐     ┌───────────────┐
│ Vercel Cron  │────▶│ /api/cron/daily-     │────▶│ sendReminder()│
│ (06:00 UTC)  │     │ reminders            │     │               │
└─────────────┘     └──────────────────────┘     └───────┬───────┘
                                                          │
                    ┌──────────────────────┐              ▼
                    │ getEligibleSystemIds()│     ┌───────────────┐
                    │ - nextMaintenance     │     │ ReminderEmail  │
                    │ - emailOptIn check    │     │ (React Email)  │
                    │ - deduplication       │     └───────┬───────┘
                    └──────────────────────┘              │
                                                          ▼
┌─────────────┐     ┌──────────────────────┐     ┌───────────────┐
│ Vercel Cron  │────▶│ /api/cron/weekly-    │────▶│ Resend API    │
│ (Mon 07:00)  │     │ summary              │     │ (send email)  │
└─────────────┘     └──────────────────────┘     └───────┬───────┘
                                                          │
┌─────────────┐     ┌──────────────────────┐              ▼
│ Office-side  │────▶│ sendBooking-         │     ┌───────────────┐
│ BookingModal │     │ Confirmation()       │     │ EmailLog      │
└─────────────┘     └──────────────────────┘     │ (DB record)   │
                                                  └───────────────┘
```

---

## Opt-in / Unsubscribe Flow

### Customer Email Opt-in Status

The `Customer.emailOptIn` field tracks consent:

| Status | Meaning |
|--------|---------|
| `NONE` | No email address or no consent given |
| `PENDING` | Opt-in email sent, awaiting confirmation |
| `CONFIRMED` | Customer has confirmed — eligible for reminders |
| `UNSUBSCRIBED` | Customer has opted out — no further emails |

### Unsubscribe Tokens

- Stateless HMAC-SHA256 tokens — no DB lookup needed for verification
- Generated by `buildUnsubscribeUrl(customerId)` in `src/lib/email/unsubscribe-token.ts`
- Included in every reminder email footer
- Verified at `GET/POST /api/email/unsubscribe/[token]`
- On unsubscribe: sets `Customer.emailOptIn = UNSUBSCRIBED` and `Customer.unsubscribedAt`

### Suppression

The daily cron query filters on `emailOptIn = CONFIRMED`. Customers with `NONE`, `PENDING`, or `UNSUBSCRIBED` status never receive reminders. Additionally, the `Customer.email` field must be non-null.

---

## Template Architecture

All templates live in `src/lib/email/templates/` as React Email components.

| Template | File | Customizable (Sprint 19) |
|----------|------|--------------------------|
| Reminder | `ReminderEmail.tsx` | Yes — greeting and body text via user settings |
| Booking Confirmation | `BookingConfirmationEmail.tsx` | No |
| Weekly Summary | `WeeklySummaryEmail.tsx` | No |

### Fixed sections (all templates)
- Brand header (green torqr bar)
- Footer

### Reminder email structure
1. Brand header
2. **Greeting** (customizable) — default: "Guten Tag {customerName},"
3. **Body text** (customizable) — default: maintenance reminder paragraphs
4. System info card (manufacturer, model, serial, due date)
5. CTA button ("Termin jetzt buchen" — links to Cal.com with pre-filled metadata)
6. Contact section (technician phone + email from user profile)
7. Sign-off (name + company from user profile)
8. Unsubscribe footer

### Weekly summary structure (Sprint 19 rework)
1. Brand header
2. Greeting + week label
3. Termine diese Woche (confirmed bookings — green)
4. Wartungen fällig — noch nicht gebucht (due but unbooked — amber)
5. Überfällige Wartungen (overdue — red, hidden if empty)
6. Rückblick letzte Woche (retro — gray)
7. Kurzstatistik (total customers + systems)
8. Footer

### Placeholder system
- `{customerName}` — replaced at render time via simple string `.replace()`
- Applied to `reminderGreeting` and `reminderBody` fields from User model
- When fields are null, hardcoded defaults are used

---

## Logging

### EmailLog

Every email send creates an `EmailLog` record:

| Field | Description |
|-------|-------------|
| `customerId` | Which customer received the email |
| `type` | `EmailType` enum value |
| `sentAt` | Timestamp |
| `resendId` | Resend message ID (for tracking) |
| `error` | Error JSON if send failed |
| `opened` / `openedAt` | (Available but not yet tracked) |
| `clicked` / `clickedAt` | (Available but not yet tracked) |

### CronRun

Every cron execution creates a `CronRun` record:

| Field | Description |
|-------|-------------|
| `jobType` | `daily_reminders` or `weekly_summary` |
| `startedAt` / `completedAt` | Execution window |
| `status` | `RUNNING`, `SUCCESS`, or `FAILED` |
| `emailsSent` | Count of successfully sent emails |
| `errors` | JSON array of error messages |

---

## Configuration

### Required Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key | `src/lib/email/client.ts` |
| `RESEND_FROM_EMAIL` | Sender address (default: `noreply@torqr.de`) | `src/lib/email/client.ts` |
| `CRON_SECRET` | Bearer token for cron route auth | `daily-reminders`, `weekly-summary` routes |
| `SUMMARY_RECIPIENT_EMAIL` | Fallback email for weekly summary (cron mode) | `sendWeeklySummary()` |
| `CAL_COM_URL` | Cal.com booking page URL | `sendReminder()` |
| `APP_URL` | Base URL for unsubscribe links | `buildUnsubscribeUrl()` |
| `UNSUBSCRIBE_SECRET` | HMAC secret for unsubscribe tokens | `unsubscribe-token.ts` |

### Vercel Cron Configuration

In `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-reminders", "schedule": "0 6 * * *" },
    { "path": "/api/cron/weekly-summary", "schedule": "0 7 * * 1" }
  ]
}
```

---

## Customization (Sprint 19)

Users can customize the reminder email wording via the account page ("E-Mail-Vorlage" card).

| Field | DB Column | Max Length | Default |
|-------|-----------|-----------|---------|
| Greeting | `User.reminderGreeting` | 200 chars | "Guten Tag {customerName}," |
| Body | `User.reminderBody` | 1000 chars | Standard reminder text |

- Empty/null = use defaults
- `{customerName}` placeholder supported in both fields
- Saved via `PATCH /api/user/profile`
- Applied at render time in `sendReminder()` before passing to `ReminderEmail` template
```

- [ ] **Step 2: Commit**

```bash
git add docs/EMAIL-SYSTEM.md
git commit -m "docs: add comprehensive email system documentation"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Full TypeScript check**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Run existing tests**

Run:
```bash
npx vitest run
```

Expected: All existing tests pass. No new tests required — the changes are service layer + template rewrites with no new business logic that benefits from unit testing beyond what TypeScript catches.

- [ ] **Step 3: Visual check — start dev server and verify account page**

Run:
```bash
npm run dev
```

Navigate to `/dashboard/account` and verify:
- The "E-Mail-Vorlage" card renders after Notifications card
- Both fields (Begrüßung, Nachrichtentext) show placeholders
- Save button works and persists values

- [ ] **Step 4: Final commit if any fixes needed**

If any TypeScript or runtime issues were found and fixed:
```bash
git add -A
git commit -m "fix: resolve Sprint 19 integration issues"
```

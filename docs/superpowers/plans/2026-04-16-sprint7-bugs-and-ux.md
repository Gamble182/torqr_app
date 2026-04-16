# Sprint 7 — Bugs & UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two React Query cache-miss bugs (customer/heater not visible after creation), implement three form validation improvements, add a manual reminder email trigger button on the customer detail page, and improve customer quick-actions layout.

**Architecture:** All bug fixes are pure React Query mutations — add `queryClient.invalidateQueries` in `onSuccess` where missing and navigate only after invalidation. The manual reminder feature adds one new API route (`POST /api/customers/[id]/send-reminder`) and a button + loading state in the customer detail sidebar. Form validation changes are purely client-side additions to existing `validateForm()` functions.

**Tech Stack:** Next.js 14 App Router, React Query (TanStack Query v5), TypeScript, Tailwind CSS, shadcn/ui, Resend via existing `sendReminder` email service.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/dashboard/customers/new/page.tsx` | Modify | Use `useCreateCustomer` hook (fixes #16 cache invalidation), make email required (#19) |
| `src/components/HeaterFormModal.tsx` | Modify | Call `invalidateQueries(['heaters'])` after save — fixes #17 |
| `src/components/MaintenanceFormModal.tsx` | Modify | Make `notes` field required (#21) |
| `src/app/api/customers/[id]/send-reminder/route.ts` | Create | `POST` — sends manual reminder email for a customer (#12) |
| `src/app/dashboard/customers/[id]/page.tsx` | Modify | Add "Erinnerung senden" button + loading state in sidebar (#12), improve quick-actions spacing (#22) |

---

## Task 1: Fix #16 — Customer not shown after creation

**Root cause:** `customers/new/page.tsx` uses a raw `fetch` + manual `router.push` instead of the `useCreateCustomer` hook. The hook already calls `queryClient.invalidateQueries({ queryKey: ['customers'] })` in `onSuccess`, but the page bypasses it entirely.

**Fix:** Replace the raw fetch with the `useCreateCustomer` mutation, then navigate to the customer list in `onSuccess`.

**Files:**
- Modify: `src/app/dashboard/customers/new/page.tsx`

- [ ] **Step 1: Replace the raw fetch in `handleSubmit` with `useCreateCustomer`**

Replace the `handleSubmit` function and remove the manual `fetch('/api/customers', ...)` block. The full updated section:

```tsx
// At the top of the component, add the hook:
const createCustomer = useCreateCustomer();

// Replace handleSubmit entirely:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;

  createCustomer.mutate(
    {
      name: formData.name,
      street: formData.street,
      zipCode: formData.zipCode,
      city: formData.city,
      phone: formData.phone,
      email: formData.email || undefined,
      suppressEmail: formData.suppressEmail,
      heatingType: formData.heatingType,
      additionalEnergySources: formData.additionalEnergySources,
      energyStorageSystems: formData.energyStorageSystems,
      notes: formData.notes || undefined,
    },
    {
      onSuccess: () => {
        router.push('/dashboard/customers');
      },
      onError: (error: Error) => {
        toast.error(`Fehler: ${error.message}`);
      },
    }
  );
};
```

Also update the `disabled` check on the submit button:

```tsx
// Replace: disabled={loading}
// With:
disabled={createCustomer.isPending}

// Replace: {loading && <Loader2Icon ... />}
// With:
{createCustomer.isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}

// Replace: {loading ? 'Wird erstellt...' : 'Kunde erstellen'}
// With:
{createCustomer.isPending ? 'Wird erstellt...' : 'Kunde erstellen'}
```

Also update the "Abbrechen" button:
```tsx
// Replace: disabled={loading}
// With:
disabled={createCustomer.isPending}
```

Remove the `useState` for `loading` and the `setLoading` calls. Remove the manual `toast.success` call (the hook already fires it). Remove the `useState` import of `loading` from the destructure.

- [ ] **Step 2: Verify the import of `useCreateCustomer`**

The hook is in `src/hooks/useCustomers.ts`. Add to imports at top of file:

```tsx
import { useCreateCustomer } from '@/hooks/useCustomers';
```

- [ ] **Step 3: Manual test**

Start dev server (`npm run dev`), navigate to `/dashboard/customers/new`, create a customer. Verify the customer list page shows the new customer immediately without a page reload.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/customers/new/page.tsx
git commit -m "fix: use useCreateCustomer hook to invalidate cache after customer creation (#16)"
```

---

## Task 2: Fix #17 — Heater not shown after creation

**Root cause:** `HeaterFormModal.tsx` calls `onSuccess()` after a successful `fetch`, but `onSuccess` in `customer/[id]/page.tsx` calls `refetch()` and `refetchHeaters()` — which are `useQuery` refetch functions, not `invalidateQueries`. Other pages (e.g., heater list) that depend on the `['heaters']` query key will not update. More importantly, the `queryClient` is never touched inside `HeaterFormModal`, so the cache for `['heaters', { customerId }]` is stale after creation.

**Fix:** Import `useQueryClient` in `HeaterFormModal` and call `invalidateQueries` on all `['heaters']` keys after success.

**Files:**
- Modify: `src/components/HeaterFormModal.tsx`

- [ ] **Step 1: Add `useQueryClient` to the HeaterFormModal**

Add to imports:

```tsx
import { useQueryClient } from '@tanstack/react-query';
```

Add inside the component (top of function body, before state declarations):

```tsx
const queryClient = useQueryClient();
```

- [ ] **Step 2: Invalidate queries after successful save**

Inside the `if (result.success)` block (around line 168), before calling `onSuccess()`:

```tsx
if (result.success) {
  await queryClient.invalidateQueries({ queryKey: ['heaters'] });
  toast.success(heater ? 'Heizsystem aktualisiert!' : 'Heizsystem hinzugefügt!');
  onSuccess();
}
```

This invalidates all `['heaters', ...]` query variants (list, filtered by customerId, etc.) — TanStack Query v5 matches by prefix by default.

- [ ] **Step 3: Manual test**

Navigate to a customer detail page, click "Heizsystem hinzufügen", fill in the modal, submit. The heater list on the customer detail page should update immediately without page reload.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeaterFormModal.tsx
git commit -m "fix: invalidate heaters query cache after create/update in HeaterFormModal (#17)"
```

---

## Task 3: Fix #19 — Customer email field required

**Root cause:** In `customers/new/page.tsx` the label reads "E-Mail (optional)" and `validateForm()` only checks format if email is non-empty. Per backlog #19, email must be required.

**Files:**
- Modify: `src/app/dashboard/customers/new/page.tsx`

- [ ] **Step 1: Update `validateForm` to require email**

In the `validateForm` function, replace the email validation block:

```tsx
// Old:
if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Ungültige E-Mail-Adresse';

// New:
if (!formData.email.trim()) {
  newErrors.email = 'E-Mail-Adresse ist erforderlich';
} else if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  newErrors.email = 'Ungültige E-Mail-Adresse';
}
```

- [ ] **Step 2: Update the label text and hint text**

In the JSX, replace:

```tsx
// Old:
<Label htmlFor="email" className="mb-1.5 block text-sm">E-Mail (optional)</Label>
// And helper text:
<p className="mt-1 text-xs text-muted-foreground">Für automatische Wartungserinnerungen</p>

// New:
<Label htmlFor="email" className="mb-1.5 block text-sm">
  E-Mail <span className="text-destructive">*</span>
</Label>
// And helper text:
<p className="mt-1 text-xs text-muted-foreground">Für automatische Wartungserinnerungen (erforderlich)</p>
```

Also remove the conditional `{formData.email && (...)}` wrapper around the suppressEmail checkbox — the checkbox should always be visible once email is a required field (simplify to always show it):

```tsx
// Replace:
{formData.email && (
  <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
    ...
  </label>
)}

// With (always visible):
<label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
  <input
    type="checkbox"
    checked={formData.suppressEmail}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, suppressEmail: e.target.checked }))
    }
    className="h-4 w-4 rounded border-input"
  />
  <span className="text-xs text-muted-foreground">
    Keine E-Mail-Erinnerungen senden
  </span>
</label>
```

- [ ] **Step 3: Also update the edit customer page**

Check `src/app/dashboard/customers/[id]/edit/page.tsx` for the same email field and apply identical changes: required label asterisk, updated `validateForm`, always-visible suppressEmail checkbox.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/customers/new/page.tsx src/app/dashboard/customers/[id]/edit/page.tsx
git commit -m "feat: make customer email field required with validation (#19)"
```

---

## Task 4: Fix #21 — Maintenance notes field required

**Root cause:** In `MaintenanceFormModal.tsx`, `validateForm()` only checks `date`. Notes is currently optional. Per backlog #21, notes must be mandatory.

**Files:**
- Modify: `src/components/MaintenanceFormModal.tsx`

- [ ] **Step 1: Update `validateForm` to require notes**

In `validateForm()` (line ~89), add after the date check:

```tsx
if (!formData.notes.trim()) {
  newErrors.notes = 'Notizen sind erforderlich';
}
```

- [ ] **Step 2: Update the notes label**

In the JSX (around line 197), replace:

```tsx
// Old:
<Label htmlFor="notes" className="mb-1.5 block text-sm">Notizen (optional)</Label>

// New:
<Label htmlFor="notes" className="mb-1.5 block text-sm">
  Notizen <span className="text-destructive">*</span>
</Label>
```

- [ ] **Step 3: Add error display for notes**

After the `<Textarea>` element for notes, add the error message (same pattern as date field):

```tsx
{errors.notes && (
  <p className="mt-1 text-xs text-destructive">{errors.notes}</p>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MaintenanceFormModal.tsx
git commit -m "feat: make maintenance notes field required (#21)"
```

---

## Task 5: Fix #22 — Customer quick-actions spacing

**Root cause:** The "Schnellaktionen" card in the customer detail sidebar has `space-y-2` between buttons, which is too tight.

**Files:**
- Modify: `src/app/dashboard/customers/[id]/page.tsx`

- [ ] **Step 1: Increase button gap in quick-actions card**

Find the "Schnellaktionen" card (around line 638). Replace `space-y-2` with `space-y-3`:

```tsx
// Old:
<div className="space-y-2">

// New:
<div className="space-y-3">
```

Also increase button padding by changing `size="sm"` buttons in this card to use a slightly larger target area. Add `py-2.5` to each button's className:

```tsx
// First button (Kunde bearbeiten):
<Button variant="outline" className="w-full justify-start py-2.5" size="sm">

// Second button (Heizsystem hinzufügen):
<Button variant="outline" className="w-full justify-start py-2.5" size="sm"
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/customers/[id]/page.tsx
git commit -m "ux: improve quick-actions button spacing on customer detail page (#22)"
```

---

## Task 6: Feature #12 — Manual reminder email trigger

This is the largest task. It requires a new API route and a new button in the customer detail sidebar.

### 6a: API Route

**Files:**
- Create: `src/app/api/customers/[id]/send-reminder/route.ts`

- [ ] **Step 1: Create the API route file**

```typescript
// src/app/api/customers/[id]/send-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { sendReminder } from '@/lib/email/service';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireAuth();
    const customerId = params.id;

    // Verify customer belongs to this user
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, userId: true, email: true, name: true },
    });

    if (!customer || customer.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    if (!customer.email) {
      return NextResponse.json(
        { success: false, error: 'Dieser Kunde hat keine E-Mail-Adresse hinterlegt' },
        { status: 400 }
      );
    }

    // Find the first heater for this customer that belongs to this user
    const heater = await prisma.heater.findFirst({
      where: { customerId, userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!heater) {
      return NextResponse.json(
        { success: false, error: 'Dieser Kunde hat noch keine Heizsysteme' },
        { status: 400 }
      );
    }

    await sendReminder(heater.id, 'REMINDER_1_WEEK');

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit the API route**

```bash
git add src/app/api/customers/[id]/send-reminder/route.ts
git commit -m "feat: add POST /api/customers/[id]/send-reminder endpoint (#12)"
```

### 6b: UI — Button in customer detail sidebar

**Files:**
- Modify: `src/app/dashboard/customers/[id]/page.tsx`

- [ ] **Step 3: Add sending state and handler**

Inside `CustomerDetailPage`, add state and handler (after the existing state declarations):

```tsx
const [sendingReminder, setSendingReminder] = useState(false);

const handleSendReminder = async () => {
  if (!customer?.email) {
    toast.error('Dieser Kunde hat keine E-Mail-Adresse hinterlegt');
    return;
  }
  if (!confirm(`Erinnerungs-E-Mail an ${customer.email} senden?`)) return;

  setSendingReminder(true);
  try {
    const res = await fetch(`/api/customers/${customerId}/send-reminder`, {
      method: 'POST',
    });
    const result = await res.json();
    if (result.success) {
      toast.success('Erinnerungs-E-Mail wurde gesendet');
    } else {
      toast.error(`Fehler: ${result.error}`);
    }
  } catch {
    toast.error('Fehler beim Senden der E-Mail');
  } finally {
    setSendingReminder(false);
  }
};
```

- [ ] **Step 4: Add the button to the Schnellaktionen card**

Inside the "Schnellaktionen" card (after the "Heizsystem hinzufügen" button), add:

```tsx
{customer.email && (
  <Button
    variant="outline"
    className="w-full justify-start py-2.5"
    size="sm"
    onClick={handleSendReminder}
    disabled={sendingReminder}
  >
    {sendingReminder
      ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
      : <MailIcon className="h-3.5 w-3.5" />}
    Erinnerung senden
  </Button>
)}
```

`MailIcon` and `Loader2Icon` are already imported in this file.

- [ ] **Step 5: Manual test**

Navigate to a customer detail page. Verify the "Erinnerung senden" button only appears if the customer has an email. Click the button, confirm the dialog, verify a toast success appears and no error in the network tab.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/customers/[id]/page.tsx
git commit -m "feat: add manual reminder email button to customer detail page (#12)"
```

---

## Task 7: Update Backlog

- [ ] **Step 1: Mark resolved items in BACKLOG.md**

In `docs/BACKLOG.md`, remove items #16, #17, #19, #21, #22, and #12 from the Open Items table and add them to the Completed section under a new Sprint 7 heading:

```markdown
### Sprint 7 — Bugs & UX Fixes (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 16 | Bug | Customer not shown after creation — fixed via useCreateCustomer hook in new/page.tsx | 2026-04-16 |
| 17 | Bug | Heater not shown after creation — fixed by invalidating ['heaters'] cache in HeaterFormModal | 2026-04-16 |
| 19 | Feature | Customer email field made required with asterisk and validation | 2026-04-16 |
| 21 | Feature | Maintenance notes field made required with asterisk and error message | 2026-04-16 |
| 22 | UX | Customer quick-actions spacing improved (space-y-3, py-2.5 buttons) | 2026-04-16 |
| 12 | Feature | Manual reminder email trigger added to customer detail page sidebar | 2026-04-16 |
```

- [ ] **Step 2: Commit**

```bash
git add docs/BACKLOG.md
git commit -m "chore: mark Sprint 7 items resolved in BACKLOG.md"
```

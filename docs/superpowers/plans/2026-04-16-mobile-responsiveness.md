# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all dashboard pages and modals fully usable on mobile (375px+), with particular focus on the maintenance entry workflow used by technicians in the field.

**Architecture:** Pure Tailwind CSS class additions/corrections across 12 files. No new components, no architectural changes. The DashboardNav and layout are already mobile-ready. Changes are isolated per file — each task is independent.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui components.

---

## Cross-cutting rules (reference for every task)
- All `<input>`, `<select>`, `<textarea>`: add `text-base` class → prevents iOS auto-zoom (font-size must be ≥16px)
- All primary action buttons: `min-h-[44px]` or `h-11` → Apple HIG touch target
- All icon-only buttons: `w-10 h-10` minimum
- Button rows: `flex-col-reverse sm:flex-row` so Submit is on top on mobile (more prominent), Cancel below

---

## Task 1: MaintenanceFormModal — Critical mobile fix

**Files:**
- Modify: `src/components/MaintenanceFormModal.tsx`

- [ ] **Step 1: Fix date input — add `text-base` and `h-11`**

Find:
```tsx
<Input
  id="date" name="date" type="date" value={formData.date}
  onChange={handleChange} max={new Date().toISOString().split('T')[0]}
  className={errors.date ? 'border-destructive' : ''}
/>
```
Replace with:
```tsx
<Input
  id="date" name="date" type="date" value={formData.date}
  onChange={handleChange} max={new Date().toISOString().split('T')[0]}
  className={`h-11 text-base${errors.date ? ' border-destructive' : ''}`}
/>
```

- [ ] **Step 2: Fix notes textarea — add `text-base` and `min-h-[120px]`**

Find:
```tsx
<Textarea
  id="notes" name="notes" value={formData.notes} onChange={handleChange}
  rows={4} placeholder="z.B. Filter gewechselt, Druck geprüft..."
  className={`resize-none${errors.notes ? ' border-destructive' : ''}`}
/>
```
Replace with:
```tsx
<Textarea
  id="notes" name="notes" value={formData.notes} onChange={handleChange}
  rows={4} placeholder="z.B. Filter gewechselt, Druck geprüft..."
  className={`resize-none text-base min-h-[120px]${errors.notes ? ' border-destructive' : ''}`}
/>
```

- [ ] **Step 3: Fix photo thumbnails — increase height and make remove button always visible on mobile**

Find:
```tsx
<img
  src={URL.createObjectURL(photo)}
  alt={`Foto ${index + 1}`}
  className="w-full h-24 object-cover rounded-lg border border-border"
/>
<Button
  type="button" variant="outline" size="sm"
  onClick={() => removePhoto(index)}
  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
>
```
Replace with:
```tsx
<img
  src={URL.createObjectURL(photo)}
  alt={`Foto ${index + 1}`}
  className="w-full h-28 object-cover rounded-lg border border-border"
/>
<Button
  type="button" variant="outline" size="sm"
  onClick={() => removePhoto(index)}
  className="absolute top-1 right-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 w-8 h-8 p-0"
>
```

- [ ] **Step 4: Fix upload area height for touch**

Find:
```tsx
<label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
```
Replace with:
```tsx
<label className="flex items-center justify-center w-full h-16 sm:h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
```

- [ ] **Step 5: Fix close button size**

Find:
```tsx
<Button variant="ghost" size="icon-sm" onClick={onClose} disabled={loading}>
  <XIcon className="h-4 w-4" />
</Button>
```
Replace with:
```tsx
<Button variant="ghost" size="icon-sm" onClick={onClose} disabled={loading} className="w-10 h-10">
  <XIcon className="h-4 w-4" />
</Button>
```

- [ ] **Step 6: Fix submit/cancel button row — full-width stacked on mobile**

Find:
```tsx
<div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
  <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
    Abbrechen
  </Button>
  <Button type="submit" disabled={loading || uploadingPhotos}>
```
Replace with:
```tsx
<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
  <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-11 sm:h-9">
    Abbrechen
  </Button>
  <Button type="submit" disabled={loading || uploadingPhotos} className="h-11 sm:h-9">
```

- [ ] **Step 7: Commit**

```bash
git add src/components/MaintenanceFormModal.tsx
git commit -m "feat(mobile): improve MaintenanceFormModal touch targets and iOS input fix"
```

---

## Task 2: HeaterFormModal — touch targets and iOS fix

**Files:**
- Modify: `src/components/HeaterFormModal.tsx`

- [ ] **Step 1: Fix close button size**

Find (around line 197–200):
```tsx
<h2 className="text-xl font-semibold text-foreground">
```
The close button is just above this. Find:
```tsx
className="hidden lg:flex flex-col fixed
```
No — find the close/X button in HeaterFormModal. Read the file to confirm exact line. The close button pattern is:

Find in the modal header area (search for `XIcon` in HeaterFormModal):
```tsx
<button
```
The X-close button — add `w-10 h-10` to it. Read the exact JSX from the file and replace the close button class to include `w-10 h-10 flex items-center justify-center`.

Actually, the HeaterFormModal close button at the top of the card:

Find:
```tsx
<div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold text-foreground">
```

The full header section in HeaterFormModal — find the close button:
```tsx
onClick={() => onClose()}
```
and add `className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted"` or equivalent.

Since the exact markup varies, search for the `XIcon` button in HeaterFormModal and ensure it has `w-10 h-10`.

- [ ] **Step 2: Fix submit/cancel button row**

Find the actions row at the bottom of HeaterFormModal (search for `type="submit"`). The pattern will be:
```tsx
<div className="flex justify-end gap-3 ...">
  <Button ... onClick={onClose}>Abbrechen</Button>
  <Button type="submit" ...>
```
Replace the wrapper div class:
```tsx
<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 ...">
```
And add `className="h-11 sm:h-9"` to both buttons.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeaterFormModal.tsx
git commit -m "feat(mobile): improve HeaterFormModal touch targets"
```

---

## Task 3: Customer Detail Page — heater action buttons and booking layout

**Files:**
- Modify: `src/app/dashboard/customers/[id]/page.tsx`

- [ ] **Step 1: Fix heater card action buttons — allow wrapping**

Find:
```tsx
<div className="flex gap-1.5 shrink-0">
  <Button
    size="sm"
    onClick={() => { setSelectedHeater(heater); setShowMaintenanceForm(true); }}
    className="bg-success hover:bg-success/90 text-success-foreground"
  >
    <CheckCircle2Icon className="h-3.5 w-3.5" />
    Erledigt
  </Button>
  <Button variant="outline" size="icon-sm" onClick={() => handleEditHeater(heater)}>
    <PencilIcon className="h-3.5 w-3.5" />
  </Button>
  <Button
    variant="outline" size="icon-sm"
    onClick={() => handleDeleteHeater(heater.id, heater.model)}
    disabled={deleteHeater.isPending}
    className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
  >
    {deleteHeater.isPending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <TrashIcon className="h-3.5 w-3.5" />}
  </Button>
</div>
```
Replace with:
```tsx
<div className="flex flex-wrap gap-1.5 shrink-0">
  <Button
    size="sm"
    onClick={() => { setSelectedHeater(heater); setShowMaintenanceForm(true); }}
    className="bg-success hover:bg-success/90 text-success-foreground h-9 min-w-[44px]"
  >
    <CheckCircle2Icon className="h-3.5 w-3.5" />
    Erledigt
  </Button>
  <Button variant="outline" size="icon-sm" onClick={() => handleEditHeater(heater)} className="w-9 h-9">
    <PencilIcon className="h-3.5 w-3.5" />
  </Button>
  <Button
    variant="outline" size="icon-sm"
    onClick={() => handleDeleteHeater(heater.id, heater.model)}
    disabled={deleteHeater.isPending}
    className="w-9 h-9 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
  >
    {deleteHeater.isPending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <TrashIcon className="h-3.5 w-3.5" />}
  </Button>
</div>
```

- [ ] **Step 2: Fix header action buttons (Bearbeiten / Löschen)**

Find:
```tsx
<div className="flex gap-2">
  <Link href={`/dashboard/customers/${customerId}/edit`}>
    <Button variant="outline" size="sm">
```
Replace with:
```tsx
<div className="flex flex-wrap gap-2">
  <Link href={`/dashboard/customers/${customerId}/edit`}>
    <Button variant="outline" size="sm" className="h-9 min-w-[44px]">
```

- [ ] **Step 3: Fix Cal.com booking time display — allow line break**

Find:
```tsx
<p className="text-xs text-muted-foreground">
  {new Date(booking.startTime).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  })}
  {', '}
  {new Date(booking.startTime).toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit',
  })}
```
Replace with:
```tsx
<p className="text-xs text-muted-foreground">
  <span className="block sm:inline">
    {new Date(booking.startTime).toLocaleDateString('de-DE', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    })}
  </span>
  <span className="sm:inline">{', '}</span>
  <span className="block sm:inline">
    {new Date(booking.startTime).toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit',
    })}
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/dashboard/customers/[id]/page.tsx"
git commit -m "feat(mobile): fix customer detail heater buttons and booking layout"
```

---

## Task 4: Customer List Page — search bar and controls

**Files:**
- Modify: `src/app/dashboard/customers/page.tsx`

- [ ] **Step 1: Fix search input — add `text-base` and `h-11`**

Find:
```tsx
className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
```
Replace with:
```tsx
className="w-full pl-10 pr-4 py-2.5 bg-muted border-0 rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-11"
```

- [ ] **Step 2: Fix view toggle buttons — ensure `w-10 h-10`**

Find:
```tsx
<Button
  variant={viewMode === 'grid' ? 'default' : 'ghost'}
  size="icon-sm"
  onClick={() => setViewMode('grid')}
>
  <LayoutGridIcon className="h-4 w-4" />
</Button>
<Button
  variant={viewMode === 'list' ? 'default' : 'ghost'}
  size="icon-sm"
  onClick={() => setViewMode('list')}
>
  <LayoutListIcon className="h-4 w-4" />
</Button>
```
Replace with:
```tsx
<Button
  variant={viewMode === 'grid' ? 'default' : 'ghost'}
  size="icon-sm"
  onClick={() => setViewMode('grid')}
  className="w-10 h-10"
>
  <LayoutGridIcon className="h-4 w-4" />
</Button>
<Button
  variant={viewMode === 'list' ? 'default' : 'ghost'}
  size="icon-sm"
  onClick={() => setViewMode('list')}
  className="w-10 h-10"
>
  <LayoutListIcon className="h-4 w-4" />
</Button>
```

- [ ] **Step 3: Fix filter selects — add `text-base`**

Find (both occurrences):
```tsx
className="px-2.5 py-1.5 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
```
Replace both with:
```tsx
className="px-2.5 py-1.5 bg-muted border-0 rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring h-10"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/customers/page.tsx
git commit -m "feat(mobile): fix customer list search input and filter controls"
```

---

## Task 5: Customer New and Edit Forms — iOS fix and button layout

**Files:**
- Modify: `src/app/dashboard/customers/new/page.tsx`
- Modify: `src/app/dashboard/customers/[id]/edit/page.tsx`

- [ ] **Step 1: Fix all inputs in `new/page.tsx` — add `text-base`**

In `src/app/dashboard/customers/new/page.tsx`, all `<Input>` components need `text-base`. The inputs use a `className` prop already (for error styling). Update each input's className to include `text-base`:

For inputs that currently have `className={errors.X ? 'border-destructive' : ''}`:
```tsx
className={`text-base${errors.X ? ' border-destructive' : ''}`}
```

Apply this to: `name`, `phone`, `email`, `street`, `zipCode`, `city` inputs. Replace each occurrence of `className={errors.X ? 'border-destructive' : ''}` with `className={\`text-base\${errors.X ? ' border-destructive' : ''}\`}`.

- [ ] **Step 2: Fix submit/cancel button row in `new/page.tsx`**

Find:
```tsx
<div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
  <Link href="/dashboard/customers">
    <Button type="button" variant="outline" disabled={createCustomer.isPending}>Abbrechen</Button>
  </Link>
  <Button type="submit" disabled={createCustomer.isPending}>
    {createCustomer.isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
    {createCustomer.isPending ? 'Wird erstellt...' : 'Kunde erstellen'}
  </Button>
</div>
```
Replace with:
```tsx
<div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-border">
  <Link href="/dashboard/customers" className="w-full sm:w-auto">
    <Button type="button" variant="outline" disabled={createCustomer.isPending} className="w-full sm:w-auto h-11 sm:h-9">Abbrechen</Button>
  </Link>
  <Button type="submit" disabled={createCustomer.isPending} className="w-full sm:w-auto h-11 sm:h-9">
    {createCustomer.isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
    {createCustomer.isPending ? 'Wird erstellt...' : 'Kunde erstellen'}
  </Button>
</div>
```

- [ ] **Step 3: Fix all inputs in `edit/page.tsx` — add `text-base`**

Same as Step 1 but for `src/app/dashboard/customers/[id]/edit/page.tsx`. Apply `text-base` to all `<Input>` elements that use className for error styling.

- [ ] **Step 4: Fix submit/cancel button row in `edit/page.tsx`**

Find:
```tsx
<div className="flex items-center justify-end gap-4 pt-6 border-t">
  <Link href="/dashboard/customers">
    <Button type="button" variant="outline" disabled={loading}>
      Abbrechen
    </Button>
  </Link>
  <Button type="submit" disabled={loading}>
    {loading ? (
      <>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        Wird gespeichert...
      </>
    ) : (
      'Änderungen speichern'
    )}
  </Button>
</div>
```
Replace with:
```tsx
<div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t">
  <Link href="/dashboard/customers" className="w-full sm:w-auto">
    <Button type="button" variant="outline" disabled={loading} className="w-full sm:w-auto h-11 sm:h-9">
      Abbrechen
    </Button>
  </Link>
  <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11 sm:h-9">
    {loading ? (
      <>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        Wird gespeichert...
      </>
    ) : (
      'Änderungen speichern'
    )}
  </Button>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/customers/new/page.tsx "src/app/dashboard/customers/[id]/edit/page.tsx"
git commit -m "feat(mobile): fix customer form inputs (iOS zoom) and button layout"
```

---

## Task 6: Dashboard Page — time-range select and Erledigt button

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Fix time-range select — add `text-base` and `h-10`**

Find:
```tsx
className="px-3 py-1.5 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
```
Replace with:
```tsx
className="px-3 py-1.5 bg-muted border-0 rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring h-10"
```

- [ ] **Step 2: Ensure Erledigt button has sufficient touch target**

Find:
```tsx
<Button
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    setSelectedHeater({ id: maintenance.id, model: maintenance.model });
  }}
  className="bg-success hover:bg-success/90 text-success-foreground shrink-0"
>
  <CheckCircle2Icon className="h-3.5 w-3.5" />
  <span className="hidden sm:inline">Erledigt</span>
</Button>
```
Replace with:
```tsx
<Button
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    setSelectedHeater({ id: maintenance.id, model: maintenance.model });
  }}
  className="bg-success hover:bg-success/90 text-success-foreground shrink-0 h-10 min-w-[44px]"
>
  <CheckCircle2Icon className="h-3.5 w-3.5" />
  <span className="hidden sm:inline">Erledigt</span>
</Button>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(mobile): fix dashboard time-range select and Erledigt button touch target"
```

---

## Task 7: Wartungen Page — export buttons hidden on mobile, filter select fix

**Files:**
- Modify: `src/app/dashboard/wartungen/page.tsx`

- [ ] **Step 1: Hide export buttons on mobile**

Find:
```tsx
{heaters.length > 0 && (
  <div className="flex gap-2">
    <Button variant="outline" size="sm" onClick={exportToCSV}>
      <DownloadIcon className="h-4 w-4" />
      CSV
    </Button>
    <Button variant="outline" size="sm" onClick={exportToPDF}>
      <FileTextIcon className="h-4 w-4" />
      PDF
    </Button>
  </div>
)}
```
Replace with:
```tsx
{heaters.length > 0 && (
  <div className="hidden sm:flex gap-2">
    <Button variant="outline" size="sm" onClick={exportToCSV}>
      <DownloadIcon className="h-4 w-4" />
      CSV
    </Button>
    <Button variant="outline" size="sm" onClick={exportToPDF}>
      <FileTextIcon className="h-4 w-4" />
      PDF
    </Button>
  </div>
)}
```

- [ ] **Step 2: Fix stats card buttons touch target — add `min-h-[44px]` to each**

Find the four stat-card buttons (they all have `className={...bg-card rounded-xl border px-4 py-3...}`). Add `min-h-[44px]` to each:

```tsx
// Example — apply to all 4 stat buttons:
className={`bg-card rounded-xl border px-4 py-3 min-h-[44px] text-left hover:shadow-md transition-all cursor-pointer ${...}`}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/wartungen/page.tsx
git commit -m "feat(mobile): hide export buttons on mobile, fix wartungen stat card touch targets"
```

---

## Task 8: Heaters List Page — search input iOS fix

**Files:**
- Modify: `src/app/dashboard/heaters/page.tsx`

- [ ] **Step 1: Fix search input — add `text-base` and `h-11`**

Find:
```tsx
className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
```
Replace with:
```tsx
className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-11"
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/heaters/page.tsx
git commit -m "feat(mobile): fix heaters list search input iOS zoom"
```

---

## Task 9: Heater Detail Page — action buttons

**Files:**
- Modify: `src/app/dashboard/heaters/[id]/page.tsx`

- [ ] **Step 1: Find and fix header action buttons**

Read the header area of `src/app/dashboard/heaters/[id]/page.tsx` to find the action buttons row. The pattern will be similar to other detail pages — a row with Save/Delete/Edit buttons. Ensure:
- The button row div has `flex flex-wrap gap-2`
- Each button has `min-h-[44px]` or `h-9` at minimum

Find the div containing the main action buttons (look for `SaveIcon` or `TrashIcon` or `EditIcon` usage in button elements in the JSX return). Add `flex-wrap` to their container and ensure `min-h-[44px]`.

- [ ] **Step 2: Fix any `<input>` or `<select>` in edit mode — add `text-base`**

The heater detail page has inline editing. Find all `<input` and `<select` elements in the JSX and add `text-base` to their className.

- [ ] **Step 3: Commit**

```bash
git add "src/app/dashboard/heaters/[id]/page.tsx"
git commit -m "feat(mobile): fix heater detail action buttons and input iOS zoom"
```

---

## Task 10: Heater New Page — input fixes

**Files:**
- Modify: `src/app/dashboard/heaters/new/page.tsx`

- [ ] **Step 1: Fix all inputs — add `text-base`**

Read `src/app/dashboard/heaters/new/page.tsx` and find all `<input` and `<select` elements. Add `text-base` to their className. The page has many inputs for: customerId, serialNumber, installationDate, maintenanceInterval, lastMaintenance, requiredParts, and cascading dropdowns.

Pattern: for every `className="... text-sm ..."` on an input/select, replace `text-sm` with `text-base`. For inputs without explicit className, add `className="text-base"`.

- [ ] **Step 2: Fix submit button row**

Find the submit/cancel button row at the bottom of the form and apply `flex-col-reverse sm:flex-row` with `h-11 sm:h-9` on buttons.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/heaters/new/page.tsx
git commit -m "feat(mobile): fix heater new page input iOS zoom and button layout"
```

---

## Task 11: Account Page — input and button fixes

**Files:**
- Modify: `src/components/account/ProfileCard.tsx`
- Modify: `src/components/account/PasswordCard.tsx`

- [ ] **Step 1: Fix ProfileCard — all inputs get `text-base` and `h-11`**

In `src/components/account/ProfileCard.tsx`, the `<Input>` components use react-hook-form `register`. Add className to each:

Find:
```tsx
<Input
  id="name"
  {...register('name', { required: 'Name ist erforderlich', minLength: { value: 2, message: 'Mindestens 2 Zeichen' } })}
/>
```
Replace with:
```tsx
<Input
  id="name"
  className="text-base h-11"
  {...register('name', { required: 'Name ist erforderlich', minLength: { value: 2, message: 'Mindestens 2 Zeichen' } })}
/>
```

Apply `className="text-base h-11"` to all 4 inputs: `name`, `email`, `phone`, `companyName`.

- [ ] **Step 2: Fix ProfileCard — Save button touch target**

Find:
```tsx
<Button type="submit" disabled={!isDirty || updateProfile.isPending}>
  {updateProfile.isPending ? 'Wird gespeichert…' : 'Speichern'}
</Button>
```
Replace with:
```tsx
<Button type="submit" disabled={!isDirty || updateProfile.isPending} className="h-11 sm:h-9 w-full sm:w-auto">
  {updateProfile.isPending ? 'Wird gespeichert…' : 'Speichern'}
</Button>
```

- [ ] **Step 3: Fix PasswordCard — all inputs get `text-base h-11`**

In `src/components/account/PasswordCard.tsx`, add `className="text-base h-11"` to all 3 `<Input>` elements (`currentPassword`, `newPassword`, `confirmPassword`).

- [ ] **Step 4: Fix PasswordCard — Save button**

Find:
```tsx
<Button type="submit" disabled={updatePassword.isPending}>
  {updatePassword.isPending ? 'Wird gespeichert…' : 'Passwort ändern'}
</Button>
```
Replace with:
```tsx
<Button type="submit" disabled={updatePassword.isPending} className="h-11 sm:h-9 w-full sm:w-auto">
  {updatePassword.isPending ? 'Wird gespeichert…' : 'Passwort ändern'}
</Button>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/account/ProfileCard.tsx src/components/account/PasswordCard.tsx
git commit -m "feat(mobile): fix account page input iOS zoom and button touch targets"
```

---

## Task 12: Update Backlog

**Files:**
- Modify: `docs/BACKLOG.md`

- [ ] **Step 1: Move #6 from Open Items to Completed**

Remove from Open Items:
```
| 6 | UX | Full mobile responsiveness — all pages must feel native on mobile. Audit and rework layouts, touch targets, typography, spacing across entire app | High | 2026-04-14 |
```

Add to Completed under a new Sprint 8 heading:
```markdown
### Sprint 8 — Mobile Responsiveness (2026-04-16)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 6 | UX | Full mobile responsiveness — all pages, modals, forms. iOS auto-zoom fix, 44px touch targets, responsive button rows. | 2026-04-16 |
```

- [ ] **Step 2: Commit**

```bash
git add docs/BACKLOG.md
git commit -m "chore: mark Sprint 8 mobile responsiveness resolved in BACKLOG.md"
```

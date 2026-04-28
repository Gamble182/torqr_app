# Wartungsteile Phase A — Manual Verification Checklist

> **Purpose:** Walk through 13 user-facing steps to validate Phase A end-to-end before the destructive migration (Task 36) and the Sprint 28 sign-off (Task 37). Each step covers an OWNER or TECHNICIAN flow that the automated test suite cannot reach.
>
> **Generated:** 2026-04-27, end of Session 12 (Tasks 32–34 complete, build green).
> **Source:** Spec §"Manual verification checklist (pre-merge)", lines 757–771.
> **Branch:** `feature/wartungsteile-phase-a` at SHA `e9d37f0` (Task 33 audit FK guards).

---

## Prerequisites

Before starting:

1. **Working tree:** clean on `feature/wartungsteile-phase-a`.
2. **Tests baseline:** `npm test` → 323/323, `npx tsc --noEmit` clean, `npm run build` green (verified end of Session 12).
3. **Two user accounts available** in the same `Company`:
   - **OWNER:** existing dev OWNER account
   - **TECHNICIAN:** create one if missing via `/dashboard/employees` → "Mitarbeiter hinzufügen" (OWNER-only)
4. **Test customer + system:** at least one `Customer` with one `CustomerSystem` whose `catalog` matches a manufacturer/model you'll use for the MaintenanceSet (e.g. Grünbeck "GSX 10").
5. **Dev server:** `npm run dev` (Next.js 14 on port 3000 by default). For local Resend testing, ensure `.env` has a working `RESEND_API_KEY` + `EMAIL_FROM` + `SUMMARY_RECIPIENT_EMAIL` (check with `npx dotenv-cli` or open `.env`).
6. **Browser print preview** for step 10 — modern Chromium-based browser recommended.

---

## Step 1 — OWNER creates a MaintenanceSet (Grünbeck "GSX 10", 3 items)

**Pre:** Logged in as OWNER. A `SystemCatalog` row for `GSX 10` exists. An `InventoryItem` exists (e.g. articleNumber `187628e`, description "Injektor", `currentStock: 5 Stck`).

**Action:**
1. Navigate to `/dashboard/wartungssets`.
2. Click "+ Neues Wartungsset" (or equivalent button).
3. Pick the catalog "Grünbeck GSX 10" from the picker (grouped by SystemType → Hersteller).
4. Set is created → automatically navigated to `/dashboard/wartungssets/[id]`.
5. Click "+ Teil hinzufügen" three times, creating:
   - **Item 1:** `SPARE_PART`, description "Injektor", quantity `1`, unit `Stck`, **inventoryItemId set to your InventoryItem `187628e`**, `required: true`
   - **Item 2:** `SPARE_PART`, description "Untracked Spare", quantity `1`, unit `Stck`, **no inventoryItemId**, `required: false`
   - **Item 3:** `TOOL`, description "Drehmomentschlüssel 10–60 Nm", quantity `1`, unit `Stk`, **inventoryItemId clears automatically** (Item Form layer #1 of TOOL-clear)

**Expected:**
- Set list at `/dashboard/wartungssets` shows the new set with badge `3 Teile`.
- Detail page shows the 3 items in `sortOrder` ascending order.
- Item 1 row shows the `Injektor (Bestand 5 Stck)` link (or similar).
- Item 3 (TOOL) has `inventoryItemId: null` — even if the user attempts to set one in the form, server-side `.strict()` Zod refine rejects it.

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 2 — `/dashboard/systems/[id]` shows Standard-Set preview + empty overrides

**Pre:** A `CustomerSystem` exists whose `catalogId` matches the GSX 10 set.

**Action:**
1. Navigate to `/dashboard/systems/[id]` for that customer system.
2. Locate the "Wartungsteile" / `PartsListCard` section.

**Expected:**
- **Section 1 "Standard-Wartungsset"** lists all 3 items from Step 1, in `sortOrder`.
- **Section 2 "Anpassungen"** is empty (no Hinzugefügt rows, no Ausgeschlossen rows).
- **Section 3 "Effektive Liste"** is collapsed by default; expanding it shows the same 3 items as Section 1 (no overrides yet).
- OWNER actions visible: "+ Teil hinzufügen", "+ Standard ausschließen", "Set bearbeiten".

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 3 — Add ADD + EXCLUDE override, effective list updates

**Pre:** Same system from Step 2.

**Action:**
1. Click "+ Teil hinzufügen" → fill: description "Zusatzschlauch 2 m", quantity `1`, unit `Stck`, `category: SPARE_PART`, no `inventoryItemId`, `required: false` → Save.
2. Click "+ Standard ausschließen" → pick Item 2 ("Untracked Spare") from the EXCLUDE picker → Save.
3. Re-expand "Effektive Liste".

**Expected:**
- **Anpassungen → Hinzugefügt** has 1 row: "Zusatzschlauch 2 m".
- **Anpassungen → Ausgeschlossen** has 1 row: "Untracked Spare".
- **Effektive Liste** has 3 items: Injektor + Drehmomentschlüssel + Zusatzschlauch (NO "Untracked Spare").
- Each row's `source` indicator: `DEFAULT` for Injektor + Drehmomentschlüssel; `OVERRIDE_ADD` for Zusatzschlauch.

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 4 — TECHNICIAN login: nav scoping

**Pre:** Logout OWNER. Login as TECHNICIAN of the same Company. A booking is assigned to this TECHNICIAN.

**Action:**
1. Open the dashboard sidebar.

**Expected:**
- "Wartungssets" nav item **NOT visible** (OWNER-only — `DashboardNav.tsx` `isOwner` gate).
- "Lager" nav item **visible** (read access — Decision §6).
- "Lager" badge **NOT shown** for TECHNICIAN even if low-stock items exist (`isOwner ? lowStockItems?.length : 0`).
- Dashboard `LowStockDashboardCard` **NOT visible** for TECHNICIAN (OWNER-gated card).

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 5 — TECHNICIAN starts maintenance, Step 2.5 effective parts

**Pre:** Same TECHNICIAN. Booking exists for the system from Step 3, status `CONFIRMED`, assignee = this TECHNICIAN.

**Action:**
1. Navigate to `/dashboard/termine` → click the booking → click "Wartung starten" (or equivalent).
2. Step through the `MaintenanceChecklistModal`: Step 1 (Notes) → Step 2 (Photos) → **Step 3 (Teileverbrauch)**.

**Expected:**
- Step 3 lists the 3 effective parts from Step 3:
  - **Hauptliste (verwendet):** Injektor (linked, `Bestand 5 Stck`), Zusatzschlauch (untracked, no Bestand)
  - **Werkzeug (read-only):** Drehmomentschlüssel — checkbox-only, never persisted
- "+ Zusatzteil erfassen" button visible.
- Header reads "Schritt 3 von 4".

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 6 — TECHNICIAN confirms parts + adds AD_HOC, save completes

**Pre:** Same checklist modal at Step 3.

**Action:**
1. Tick **verwendet** for Injektor (quantity stays at default 1).
2. Tick **verwendet** for Zusatzschlauch (quantity stays at default 1).
3. Click "+ Zusatzteil erfassen" → fill: description "Spontandichtung", quantity `1`, unit `Stck`, no inventoryItem → Add.
4. Click "Weiter" → Step 4 ("Abschließen") → click "Wartung speichern".
5. Wait for save to complete.

**Expected:**
- Save succeeds without error toast.
- Modal closes, returns to bookings/system list.
- Database side-effects (verifiable via DB inspector or Step 7):
  - `Maintenance` row created with `partsUsed` snapshot in `checklistData.partsUsed` (3 entries: 2 effective + 1 AD_HOC).
  - 1 `InventoryMovement` row of `reason: 'MAINTENANCE_USE'`, `quantityChange: -1` for Injektor's `inventoryItemId`.
  - `InventoryItem.currentStock` for Injektor: `5 → 4 Stck`.
  - No movement rows for Zusatzschlauch / Spontandichtung (untracked).

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 7 — `/dashboard/lager` reflects stock decrement + drawer history

**Pre:** Logged in as OWNER (or stay as TECHNICIAN — read access works for both).

**Action:**
1. Navigate to `/dashboard/lager`.
2. Click the Injektor row.

**Expected:**
- Injektor row shows `currentStock: 4 Stck` (was 5 in Step 1).
- Drawer opens, top section shows current stock = 4.
- Bewegungshistorie shows the new movement:
  - Date `dd.MM.yy HH:mm` (recent)
  - User name (= TECHNICIAN's name from Step 6)
  - Badge "Wartung" (German label for `MAINTENANCE_USE`)
  - Quantity `-1` in `text-destructive` (red)
  - Note empty or auto-generated

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 8 — Negative-stock scenario: warning toast + "leer" badge

**Pre:** Pick an `InventoryItem` with low `currentStock` (e.g. `currentStock: 2`). Either reuse Injektor (now at 4 — adjust if needed) or set up a fresh item via `/dashboard/lager` → "+ Neues Lagerteil" → set `currentStock` via a `RESTOCK` movement.

For this step, set Injektor `currentStock` to `2` (via OWNER `+ Bewegung` → `CORRECTION` → `quantityChange: -2` so 4 → 2).

**Action (TECHNICIAN):**
1. Start a fresh maintenance on a system whose effective list includes Injektor.
2. At Step 3, tick **verwendet** for Injektor and set quantity to `10`.
3. Continue → save.

**Expected:**
- Save **succeeds** (N3 policy — negative stock allowed).
- Toast appears: "Lager für „Injektor 187628e" unterschritten — Bestand -8" (or similar; German „..." quotes).
- Database side-effects:
  - `InventoryItem.currentStock` for Injektor: `2 → -8 Stck`.
  - Movement `MAINTENANCE_USE` with `quantityChange: -10`.
- Switch to OWNER → `/dashboard/lager`: Injektor row shows red `<Badge variant="destructive">Leer</Badge>` (`InventoryStatusBadge` rule: `currentStock <= 0` → "Leer").

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 9 — OWNER deletes maintenance: dialog + R1 reversal

**Pre:** OWNER logged in. Note the `id` of the maintenance from Step 6 (or Step 8 if you want to test reversal of negative stock).

**Action:**
1. Navigate to `/dashboard/wartungen` (or the system detail page where maintenances are listed).
2. Click delete on the Step 6 maintenance.
3. Confirmation dialog appears.
4. Click "Wartung löschen".

**Expected:**
- Dialog text mentions reversal of stock movements (e.g. "1 Lagerbewegung wird rückgebucht" or similar).
- After confirm:
  - Maintenance row deleted.
  - For Step 6 maintenance: a CORRECTION movement is created with `quantityChange: +1` (reverses the original `-1`); German note `"Rückbuchung: Wartung gelöscht"`.
  - `InventoryItem.currentStock` for Injektor: `2 → 3` (or `-8 → -7` if testing Step 8 reversal — depends on which maintenance you delete).
  - Drawer history at `/dashboard/lager` for Injektor now shows the original `MAINTENANCE_USE` row AND the `CORRECTION` reversal row.
  - `MaintenanceUploadedPhoto` / `Maintenance.photos` files removed from storage (post-transaction cleanup).

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 10 — Packing-list print view from BookingDetailsDrawer

**Pre:** A booking exists with status `CONFIRMED`, system from Step 3 attached.

**Action:**
1. Navigate to `/dashboard/termine`.
2. Click the booking → drawer opens.
3. Click "Packliste drucken" (full-width button above the Umplanen/Stornieren row — visible only when `booking.system && booking.status === 'CONFIRMED'`).
4. New tab opens to `/dashboard/termine/[id]/packliste`.
5. Click the "Drucken" button at the top of the print view (calls `window.print()`), or press `Ctrl + P`.

**Expected:**
- Print preview shows:
  - Customer name, system catalog name, booking date/time.
  - Effective parts list grouped by category, with per-row stock badges (Vorhanden / Niedrig / Leer / nicht verknüpft).
  - Bottom of page: signature line / technician notes (per template).
- Print preview does NOT include the dashboard sidebar (note: per Session 11 carry-forward, sidebar bleed-through IS a known issue, but it's a Phase B fix — accept for Phase A).
- "Drucken" button hidden in the print preview (`.no-print` rule).
- PDF export works: print → save as PDF → file is readable.

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 11 — `LowStockDashboardCard` on `/dashboard` for OWNER

**Pre:** OWNER logged in. After Step 8, Injektor is at `currentStock: -8` and Item 1's `minStock` (set during creation) is presumably `> 0`, so it's below min-stock.

**Action:**
1. Navigate to `/dashboard`.

**Expected:**
- A card appears in the dashboard grid, sibling to the `unassignedSystemsCount` card.
- Card visual:
  - Border + bg in `border-status-overdue-border bg-status-overdue-bg` (red theme — count ≥ 5 items below min-stock; if only 1–4 items, amber via `border-status-due-border bg-status-due-bg`).
  - 9×9 icon tile (`Package2Icon`).
  - Title: "Lagerbestand niedrig" or similar.
  - Bold count: `<text-2xl font-bold>` showing number of items below min-stock.
  - Right side: `ArrowRightIcon` indicating it's a link.
- Click → navigates to `/dashboard/lager?filter=low` (or just `/dashboard/lager` — confirm).
- Switch to TECHNICIAN: card **NOT visible** (OWNER-gated).

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 12 — Weekly summary email — OWNER has Lager section, TECHNICIAN does not

**Pre:** Both OWNER + TECHNICIAN have `emailWeeklySummary: true` in their User profile (`/dashboard/account` → Benachrichtigungen toggle). At least one inventory item has `currentStock < minStock`.

**Action:** Trigger the cron endpoint manually via curl (PowerShell or Git Bash):

```bash
# PowerShell
$env:CRON_SECRET = "<your-cron-secret-from-env>"
curl.exe -H "Authorization: Bearer $env:CRON_SECRET" http://localhost:3000/api/cron/weekly-summary
```

Or in Git Bash:

```bash
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2 | tr -d '"')
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-summary
```

**Expected:**
- HTTP 200 + JSON body `{ ok: true, emailsSent: N, errors: [] }` where N = number of users with `emailWeeklySummary: true`.
- OWNER receives an email at their inbox (or `SUMMARY_RECIPIENT_EMAIL` if `EMAIL_FORWARD_TO` is set):
  - Section "Lagerbestand niedrig" between Overdue (Section 3) and Retro (Section 4).
  - Amber color scheme (`#FEF3C7` / `#D97706` / `#92400E`).
  - Top 5 items below min-stock, sorted by deficit descending.
  - Each row: description, articleNumber, "Bestand `<currentStock>` `<unit>` (min `<minStock>`)".
- TECHNICIAN receives the same email **without** the Lager section (template guard `lowStockItems && lowStockItems.length > 0` short-circuits when `lowStockItems` is `undefined` for non-OWNER).
- Empty-inventory case: OWNER with no low-stock items → Lager section absent.

**☐ Pass / ☐ Fail** — _Notes:_

---

## Step 13 — Legacy data migration: requiredParts text appears as ADD override

**Pre:**
- A `CustomerSystem` exists with non-null `requiredParts` text (e.g. "Filtereinsatz, Dichtung 1/2 Zoll").
- The script `scripts/migrate-required-parts.ts` (Task 32, SHA `6ac66a4`) has been run via `npx tsx scripts/migrate-required-parts.ts`.

**Action:**

1. Run the migration script LOCALLY first against the dev DB:
   ```bash
   npx tsx scripts/migrate-required-parts.ts
   ```
   Expected console output: `Found N customer systems with legacy requiredParts.` then `Migrated: X created, Y skipped.`

2. Re-run the script — must be idempotent:
   ```bash
   npx tsx scripts/migrate-required-parts.ts
   ```
   Expected: `Migrated: 0 created, X skipped.` (all rows skipped via marker note).

3. Navigate to `/dashboard/systems/[id]` for the system that previously had `requiredParts` text.

**Expected:**
- `PartsListCard` → **Anpassungen → Hinzugefügt** section contains a row with:
  - Description = original `requiredParts` text (e.g. "Filtereinsatz, Dichtung 1/2 Zoll")
  - Quantity `1 Stck`
  - Note: "Aus Altdaten übernommen (ehem. requiredParts)"
- **Effektive Liste** includes this row alongside the standard set items.
- No data lost.

**☐ Pass / ☐ Fail** — _Notes:_

---

## After all 13 steps PASS

### Production migration sequence (Task 32 + Task 36 prerequisites)

Once all 13 manual checks pass on dev, run the data migration on the production Supabase project:

1. **Backup first** — Supabase dashboard → Project `hwagqyywixhhorhjtydt` → Backups → trigger on-demand backup. Wait for completion.
2. **Switch `.env` temporarily to production** OR use a separate `.env.production` file:
   ```bash
   DATABASE_URL=<prod pool URL>
   DIRECT_URL=<prod direct URL>
   ```
   _Be very careful here — this is the production database._
3. Run the migration script against production:
   ```bash
   npx tsx scripts/migrate-required-parts.ts
   ```
   Verify console output: `Migrated: N created, 0 skipped.` (assuming first run on prod).
4. Spot-check: open any production OWNER's dashboard → confirm at least one system with legacy `requiredParts` now shows the migrated ADD override.
5. **Restore `.env` to dev settings.**
6. **Now Task 36 is unblocked** — proceed with the column drop migration.

### Task 36 (drop column) — only after step above succeeds

```bash
# Edit prisma/schema.prisma — remove `requiredParts String?` line from CustomerSystem
npx prisma migrate dev --name drop_customer_systems_required_parts --config config/prisma.config.ts
```

Verify the generated SQL contains:
```sql
ALTER TABLE "customer_systems" DROP COLUMN "requiredParts";
```

Add the SQL NOTE comment above the drift line in the original additive migration (`prisma/migrations/20260424082431_add_maintenance_sets_and_inventory/migration.sql`):

```sql
-- NOTE: The line below is unrelated drift from `company_multi_user`,
--       not part of the Wartungsteile feature. See runbook Decision §1.
ALTER TABLE "companies" ALTER COLUMN "updatedAt" DROP DEFAULT;
```

Then run:
```bash
npm test && npm run build
grep -rn "requiredParts" src/ scripts/ 2>&1   # expect: zero matches
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore(db): drop CustomerSystem.requiredParts — legacy data migrated to overrides"
```

### Task 37 sign-off (after Task 36 commit)

Add the entries from the plan (lines 3395–3434) to `docs/BACKLOG.md`:

- **Maybe / Future:** N-1 through N-11 (verbatim from plan).
- **Completed / Resolved → Sprint 28:** Wartungsteile Phase A entry (use today's date).

Commit:
```bash
git add docs/BACKLOG.md
git commit -m "docs(backlog): add Wartungsteile Phase B+ items (N-1..N-11); mark Phase A complete"
```

### Update the runbook + finishing-a-development-branch

```bash
# Edit the runbook: mark Tasks 35, 36, 37 ✅ in the Task Progress table; add Session 13 block.
git add docs/superpowers/plans/2026-04-24-wartungsteile-execution-runbook.md
git commit -m "docs(runbook): session 13 progress — Tasks 35 through 37 complete"
```

Then invoke `superpowers:finishing-a-development-branch` to merge `feature/wartungsteile-phase-a` → `main`.

---

## Sign-off

Verified by: ____________________
Date: ____________________
All 13 steps passed: ☐ Yes / ☐ No (note exceptions above)

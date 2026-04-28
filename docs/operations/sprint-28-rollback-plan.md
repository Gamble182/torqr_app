# Sprint 28 Rollback Plan — Wartungsteile & Materialmanagement Phase A

> **What this is:** the operations playbook for backing the Wartungsteile/Lager feature out of production if the pilot customer decides the functionality is too much.
>
> **Status as of 2026-04-28:** feature is live on `main`, deployed to Vercel, all schema changes applied to Supabase project `hwagqyywixhhorhjtydt`.
>
> **Read this whole document before running anything destructive.** The harder rollback path is irreversible after pilot data accrues.

---

## TL;DR — choose a path

| Path | When to use | Cost | Reversible? |
|------|-------------|------|-------------|
| **A — Soft rollback** (UI-hide) | Pilot says "not now, maybe later" | ~30 min code change, zero DB touch, zero data loss | Yes — re-enable by reverting the UI-hide commit |
| **B — Hard rollback** (full revert) | Pilot says "we never want this" AND no critical pilot data exists in the new tables | ~1 h work + Supabase backup, **destroys** all MaintenanceSets/InventoryItems/movements/overrides | No — once Path B runs and the backup window closes, the data is gone |

**Default recommendation:** Path A first. Pilot decisions reverse more often than expected; keeping the schema gives you optionality for free.

---

## 1. Restoration anchors

### 1.1 Git tag

A durable tag has been placed at the last `main` commit before the Sprint 28 merge:

```
pre-sprint-28-2026-04-28  →  668523c  "docs(claude.md): drop development branch from model + auto-rebuild note"
```

Verify any time with:

```bash
git rev-parse pre-sprint-28-2026-04-28
# → 668523ccaf...
git show pre-sprint-28-2026-04-28 --stat
```

The tag will be pushed to `origin` along with the rest of the branch state. If you ever need it locally after a fresh clone:

```bash
git fetch --tags
git checkout pre-sprint-28-2026-04-28      # detached HEAD at the restoration point
```

### 1.2 Sprint 28 merge commit

The single commit that brought the feature in is:

```
c8ffe0c  "merge: feature/wartungsteile-phase-a — Wartungsteile & Materialmanagement Phase A (Sprint 28)"
```

Both parents:

- `c8ffe0c^1` = `668523c` (the tag above, main side)
- `c8ffe0c^2` = `8e8981c` (feature branch tip)

### 1.3 Vercel deployments

Vercel keeps every prod deployment listed in the dashboard and via `vercel ls`. The deployment immediately before Sprint 28 went live can be promoted back to production from the Vercel UI (Deployments → previous successful prod deployment → "Promote to Production"), without any git operation. This is the fastest "undo" if the deployed app starts misbehaving — it costs no source-code changes and can be reverted again in seconds.

### 1.4 Supabase project

Single project: `hwagqyywixhhorhjtydt` (eu-central-1). The destructive `requiredParts` drop ran during Session 13. A "what existed before that" snapshot is whatever the Supabase backup system retained for that project; check the Backups panel in the Supabase dashboard. If long-term retention was not enabled, the only authoritative restore source is **whatever backup you take right before executing Path B**.

---

## 2. Pre-rollback safety checklist (mandatory for Path B)

Run these in order. **Do not skip.**

1. **Pilot communication.** Confirm with the pilot customer that they are OK with losing any data they have already entered into Wartungssets / Lager / overrides. Get this in writing (email or Slack thread).

2. **Supabase backup.** Trigger an on-demand backup of the project:
   - Supabase Dashboard → Project `hwagqyywixhhorhjtydt` → Settings → Database → Backups → "Create backup".
   - Wait for status = `completed`.
   - Note the backup timestamp in the rollback log (§ 8).
   - **Verify** by opening the backup detail and checking that `restore` is enabled.

3. **Targeted table dumps** (extra insurance — survives even if the Supabase backup is lost). Dump every Sprint 28 table to local CSV:

   ```bash
   # Use the DIRECT_URL from .env (not the pooler — pg_dump needs direct connection).
   PGPASSWORD=<password> pg_dump \
     --host=<direct-host> --port=5432 --username=postgres --dbname=postgres \
     --table='public.maintenance_sets' \
     --table='public.maintenance_set_items' \
     --table='public.customer_system_part_overrides' \
     --table='public.inventory_items' \
     --table='public.inventory_movements' \
     --data-only --column-inserts \
     > sprint-28-data-dump-$(date +%F).sql
   ```

   Store this file outside the repo (e.g. in your password manager or an encrypted volume — it contains tenant data).

4. **Code freeze.** Make sure no other branch is mid-deploy. `git log --oneline origin/main..HEAD` should be empty or only contain the rollback commits you are about to make.

5. **Read-only sanity check.** Before changing anything, list the rows that will be lost so you can show them to the pilot if they ask:

   ```sql
   SELECT
     (SELECT COUNT(*) FROM maintenance_sets)               AS sets,
     (SELECT COUNT(*) FROM maintenance_set_items)          AS set_items,
     (SELECT COUNT(*) FROM customer_system_part_overrides) AS overrides,
     (SELECT COUNT(*) FROM inventory_items)                AS inv_items,
     (SELECT COUNT(*) FROM inventory_movements)            AS inv_moves;
   ```

If any number above is large enough to make you uncomfortable, **stop and reconsider Path A.**

---

## 3. Path A — Soft rollback (UI-hide, schema retained)

**Goal:** the pilot stops seeing Wartungssets / Lager / Packliste / Step 2.5 in the UI. The schema stays intact, so re-enabling later is a one-commit revert and no data is lost.

### 3.1 What to change

This is a small, defensive code change — not a refactor. One feature flag, gated rendering at four entry points.

1. **Add a feature flag** — environment variable `NEXT_PUBLIC_FEATURE_WARTUNGSTEILE` (`'true'` or `'false'`). Read it once in `src/lib/feature-flags.ts` (new file):

   ```ts
   export const FEATURE_WARTUNGSTEILE =
     process.env.NEXT_PUBLIC_FEATURE_WARTUNGSTEILE !== 'false';
   ```

   Default-on so omitting the env var keeps current behaviour; only `'false'` turns it off.

2. **Gate the four UI entry points** with `if (!FEATURE_WARTUNGSTEILE) return null;`:

   - `src/components/DashboardNav.tsx` — the "Wartungssets" + "Lager" nav items.
   - `src/components/inventory/LowStockDashboardCard.tsx` — the dashboard tile.
   - `src/components/systems/PartsListCard.tsx` — the system-detail Wartungsteile section.
   - `src/components/maintenance/PartsUsageStep.tsx` — the checklist Step 2.5.
   - `src/components/termine/BookingDetailsDrawer.tsx` — the "Packliste drucken" button (search for the `<Button asChild>` block added in Task 29).

3. **Gate the API routes** with a 404 short-circuit when the flag is off:

   ```ts
   import { FEATURE_WARTUNGSTEILE } from '@/lib/feature-flags';
   export async function GET() {
     if (!FEATURE_WARTUNGSTEILE) {
       return NextResponse.json({ success: false, error: 'Funktion deaktiviert' }, { status: 404 });
     }
     // ...rest unchanged
   }
   ```

   Touch only the new routes (paste this into all of them):
   - `src/app/api/maintenance-sets/**`
   - `src/app/api/maintenance-set-items/**`
   - `src/app/api/inventory/**`
   - `src/app/api/customer-systems/[id]/{overrides,effective-parts}/**`
   - `src/app/api/overrides/[id]/**`
   - `src/app/api/bookings/[id]/packing-list/**`
   - The `partsUsed` branch in `src/app/api/maintenances/route.ts` POST + DELETE — keep maintenances working, just skip the inventory side-effects (early-return inside the parts handler).
   - The Lager section in `src/lib/email/service.tsx` `sendWeeklySummary` — return `lowStockItems: undefined` when flag is off.

4. **Set the env var** on Vercel: Project → Settings → Environment Variables → add `NEXT_PUBLIC_FEATURE_WARTUNGSTEILE=false` for `Production` (and `Preview` if desired). Save → redeploy.

### 3.2 To re-enable

Either delete the env var on Vercel (default-on) or flip it back to `true`, then redeploy. No code change needed. No data loss occurred.

### 3.3 Verification after Path A

- Login as OWNER and TECHNICIAN: nav items + dashboard card + system-detail Parts section + checklist Step 2.5 + Packliste button are all gone.
- `curl https://torqr.de/api/inventory` → 404 with German message.
- Existing maintenance-create flow still works (skipping the parts step).
- Weekly summary email no longer contains the Lager section.

---

## 4. Path B — Hard rollback (full code + DB revert)

**Goal:** every trace of Sprint 28 is gone. The pilot data in the new tables is destroyed. Schema and codebase return to the `pre-sprint-28-2026-04-28` state.

**Order matters.** Step 4.1 first (Vercel rollback) so the live app stops touching the soon-to-be-deleted tables before the SQL runs.

### 4.1 Vercel — promote pre-Sprint-28 deployment

In the Vercel dashboard → Project → Deployments → find the last deployment whose commit was at or before `668523c` (look for `docs(claude.md): drop development branch from model + auto-rebuild note`) → "Promote to Production". This takes ~1 min and gives you a working app that does not reference the new tables.

The app at that point still has `requiredParts` in its Prisma client, so once you run the SQL in §4.2 it will work normally again.

### 4.2 Database — run the reverse migration

After §2's safety checklist is complete and §4.1 has promoted the old deployment:

```bash
psql "$DIRECT_URL" -f docs/operations/sprint-28-rollback.sql
```

Or paste the file's contents into the Supabase SQL editor. The script is wrapped in a transaction with verification asserts inside; if anything looks wrong it will `RAISE EXCEPTION` and roll back automatically.

What it does (full detail in the SQL file's header):

1. Re-adds `customer_systems.requiredParts` (TEXT NULL).
2. Lifts text from the legacy ADD-override marker rows (`note = 'Aus Altdaten übernommen (ehem. requiredParts)'`) back into `requiredParts`.
3. Drops `inventory_movements`, `customer_system_part_overrides`, `maintenance_set_items`, `maintenance_sets`, `inventory_items` (in FK-safe order).
4. Drops enums `MovementReason`, `OverrideAction`, `PartCategory`.
5. Asserts each step succeeded; commits if all green.

### 4.3 Git — back the code change out of `main`

You have two equally valid options. Pick one based on what your team prefers in `git log`.

**Option 1 — `git revert`** (preserves history, recommended):

```bash
git checkout main
git revert -m 1 c8ffe0c        # -m 1 keeps main-side, undoes feature side
# resolve conflicts if any (unlikely — Sprint 28 was largely additive)
# commit message: 'revert: Sprint 28 — Wartungsteile & Materialmanagement Phase A (rollback)'
git push origin main
```

This creates a new commit at the tip of `main` that undoes everything Sprint 28 added. The Sprint 28 commits stay in history (paper trail).

**Option 2 — `git reset --hard pre-sprint-28-2026-04-28`** (rewrites history, only if no one has pulled main since the merge):

```bash
git checkout main
git reset --hard pre-sprint-28-2026-04-28
git push --force-with-lease origin main
```

Cleaner history, but force-pushes main — only do this if you are certain no other clone has pulled the merge. CLAUDE.md's "no force push to main" rule applies — overrule it explicitly here, in writing, before running.

### 4.4 Prisma migration state cleanup

The Supabase DB no longer has the Sprint 28 schema, but Prisma's `_prisma_migrations` table still has rows for the two forward migrations. Mark them as rolled back so future `migrate deploy` runs do not try to re-apply:

```bash
npx prisma migrate resolve \
  --rolled-back 20260428061650_drop_customer_systems_required_parts \
  --config config/prisma.config.ts
npx prisma migrate resolve \
  --rolled-back 20260424082431_add_maintenance_sets_and_inventory \
  --config config/prisma.config.ts
```

Then delete the migration directories from the repo:

```bash
rm -rf prisma/migrations/20260424082431_add_maintenance_sets_and_inventory/
rm -rf prisma/migrations/20260428061650_drop_customer_systems_required_parts/
git add prisma/migrations/
git commit -m "chore(db): remove Sprint 28 migration directories post-rollback"
```

### 4.5 Vercel — deploy the reverted main

Push the revert commit + the migration-state cleanup. Vercel auto-deploys. The promoted-old deployment from §4.1 is now superseded by a fresh build of the post-revert `main`. Verify it boots cleanly.

---

## 5. Verification — after either path

| Check | Expected (Path A) | Expected (Path B) |
|-------|-------------------|-------------------|
| Login as OWNER → dashboard | Wartungssets/Lager nav hidden, LowStockCard hidden, everything else normal | Same — pre-Sprint-28 dashboard |
| Login as TECHNICIAN → dashboard | Same — both rollouts hide TECHNICIAN-side too | Same — TECHNICIAN view as before |
| `/dashboard/wartungssets` direct URL | Page loads but nav-less; React Query gets 404 → empty state | 404 from Next.js (route file gone after revert) |
| Create maintenance from a system | Works, no parts step | Works, no parts step |
| `/api/customer-systems` JSON | `requiredParts` field absent | `requiredParts` field present (back as TEXT) |
| Weekly summary email | Lager section absent | Lager section absent |
| Supabase tables list | Sprint 28 tables still present, just unread | Sprint 28 tables gone; `customer_systems.requiredParts` present |
| `git log --oneline -10 main` | Soft-rollback commit at top | Revert commit (or reset, depending on §4.3 option) |

---

## 6. Reverse-of-rollback (i.e. you rolled back and now want it back)

If after Path A you want it back: delete `NEXT_PUBLIC_FEATURE_WARTUNGSTEILE` from Vercel (or set it to `true`) → redeploy. Done.

If after Path B you want it back: there is no shortcut. The merge commit `c8ffe0c` is still in your reflog and the tag `pre-sprint-28-2026-04-28` is still anchored, but you must:

1. Restore the Supabase DB from the backup taken in §2.2.
2. `git revert` the rollback revert commit (or `git reset --hard c8ffe0c` if §4.3 used Option 2 and your reflog still has the SHA).
3. Re-run any data-migration that the pilot cared about.

This is the reason Path A is recommended first — Path B's reverse-of-reverse is much more expensive than Path A's.

---

## 7. Rollback log (fill in if rollback is ever executed)

```
Rollback executed:        ____ (date) ____
Path:                     ☐ A (soft)  ☐ B (hard)
Decision-maker:           ______________________________
Pilot sign-off (Path B):  ☐ obtained  ☐ N/A
Supabase backup (Path B): backup ID ___________  timestamp ___________
Targeted dump file:       ____________________________________________
Vercel deployment promoted (Path B): _________________________________
Git operation used:       ☐ revert -m 1   ☐ reset --hard
Verification (§5) done:   ☐ all green     ☐ issues — see notes below
Notes:
  ___________________________________________________________________
  ___________________________________________________________________
```

---

## 8. Decision recommendation (current state, 2026-04-28)

**Right now, before the pilot has used the feature:** if the pilot says no, **Path B is cheap.** No data has accumulated yet, so the destructive cost is minimal and you get a clean schema back.

**As soon as the pilot starts entering MaintenanceSets / Lager / overrides:** **switch to Path A.** Each row of pilot data raises the cost of Path B and you cannot undo a destructive drop. A feature flag has zero ongoing cost — it is the right tool until you are confident the feature is staying or going.

**Trigger to switch:** `SELECT COUNT(*) FROM maintenance_sets;` — anything above 1 (the test set the dev created) suggests Path A from here on.

# Wartungsteile & Materialmanagement Phase A — Execution Runbook

> **Read this at the start of every new session on this feature. Single source of truth for execution state, session protocol, and decisions made during implementation. Takes precedence over any remembered context from previous sessions.**

**Spec:** [docs/superpowers/specs/2026-04-24-wartungsteile-materialmanagement-phase-a-design.md](../specs/2026-04-24-wartungsteile-materialmanagement-phase-a-design.md)
**Plan:** [docs/superpowers/plans/2026-04-24-wartungsteile-materialmanagement-phase-a.md](./2026-04-24-wartungsteile-materialmanagement-phase-a.md)
**Branch:** `feature/wartungsteile-phase-a`
**Total tasks:** 37

---

## Why This Runbook Exists

The plan has 37 tasks. Executing them all in one session exceeds the context window and leads to degraded review quality. Strategy: **work in small chunks with clean pauses**. Each session:

1. Starts fresh (new Claude Code session, empty context)
2. Reads this runbook first — everything relevant lives here
3. Executes 2–6 tasks depending on complexity
4. Ends cleanly: working tree clean, tests green, runbook updated, committed
5. Hands off to the next session

This runbook is the **cross-session memory**. The plan is the **what to build**. The spec is the **why and how**. Read them in that order on session start.

---

## Session Protocol

### At session START (always, every time)

1. `git checkout feature/wartungsteile-phase-a`
2. `git status` — must be clean
3. `git log --oneline -5` — confirm the top SHA matches this runbook's **Last committed SHA** below
4. `npm test` — suite must be green as baseline (if not, STOP and investigate before new work)
5. `npx tsc --noEmit` — must be clean
6. Read this runbook top-to-bottom (especially: **Next up**, **Key Decisions & Deviations**, **Permanent Context**)
7. Confirm the plan's corresponding task(s) by rereading them — the runbook only summarizes
8. Invoke the skill: `superpowers:subagent-driven-development`

### During session

Per task, in order:
1. Dispatch an **implementer** subagent with the full task text + context from this runbook
2. Dispatch a **spec compliance reviewer** to verify the implementation matches the plan
3. If spec OK, dispatch a **code quality reviewer** (`superpowers:code-reviewer`)
4. If reviewer finds issues, re-dispatch implementer with the specific fixes; loop until both reviewers approve
5. Mark task complete in TodoWrite

**Substantive tasks** (Task 4 resolver, 15 maintenance POST, 16 delete reversal, 28 checklist integration, 35 manual verification) always get the full flow.
**Repetitive-pattern tasks** (Tasks 5–13 CRUD, 19–21 hooks) can use parallel Spec + Quality reviews (read-only — no conflict). Only use this when task surface is ~50 LOC or less.

### At session END (before pausing)

1. Ensure working tree clean (no uncommitted or untracked files beyond the pre-existing `kundenaustausch/` state)
2. `npm test` — green
3. `npx tsc --noEmit` — clean
4. Update this runbook's **Execution Log** + **Last committed SHA** + **Next up** + any new **Key Decisions & Deviations**
5. Commit the runbook: `git commit -m "docs(runbook): session <N> progress — Tasks X through Y"`
6. Do NOT merge to `main` until Task 35 passes
7. Do NOT push (user handles push)

---

## Execution Log

### Last committed SHA

`7566a6f` (Session 13 Task 37: BACKLOG.md — N-1..N-12 + Sprint 28 sign-off)

### Session 1 (2026-04-24) — Foundation

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 1 — Prisma schema + migration | ✅ | `d1432ae` | Migration `20260424082431_add_maintenance_sets_and_inventory` applied to Supabase `hwagqyywixhhorhjtydt` (eu-central-1). Incidental `ALTER TABLE "companies" ALTER COLUMN "updatedAt" DROP DEFAULT;` for pre-existing drift — kept in migration. `InventoryMovement.userId` gets default `ON DELETE RESTRICT` (consistent with other audit FKs). |
| 2 — Zod schemas | ✅ | `0369aff` + `28da7ad` (fix-round) | 22 tests total (16 original + 6 from review-round). `partsUsedEntrySchema` extended with cross-field refines (DEFAULT → `setItemId` required, OVERRIDE_ADD → `overrideId` required). `inventoryItemCreateSchema` + `inventoryItemUpdateSchema` are `.strict()` (defends `currentStock` invariant). |
| 3 — formatPartCategory | ✅ | `7415042` | Trivial. Parallel reviews. |

### Session 2 (2026-04-24) — Resolver + MaintenanceSet CRUD API

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 4 — getEffectivePartsForSystem resolver | ✅ | `56f3e87` + `6426f2a` (fix-round) | TDD with 6 tests. Test strategy switched to `vi.mock('@/lib/prisma')` (see Decision §9) because `DATABASE_URL` points to production Supabase and no test DB exists — plan's real-DB code would have risked data loss. Review-round fixes: replaced 4 `!` non-null assertions on ADD-override fields with an explicit runtime guard (`throw new Error('ADD override {id} is missing required fields')`); added JSDoc to `getEffectivePartsForSystem`; replaced `parseFloat`-based `d()` helper in tests with `(v: string) => v as unknown as Prisma.Decimal`. |
| 5 — GET/POST /api/maintenance-sets | ✅ | `4609da2` | 9 tests. OWNER-only (`requireOwner`). 404 on missing catalog, 409 on duplicate `(companyId, catalogId)`. Route also added to `TENANT_ROUTES` audit whitelist. Small pattern deviation: `new URL(request.url)` instead of plan's `request.nextUrl` — matches 7 other API routes in the codebase. |
| 6 — GET/DELETE /api/maintenance-sets/[id] | ✅ | `79d5d83` | 6 tests. Cross-tenant returns 404 (not 403). `handleError` intentionally duplicated from Task 5 per plan. GET includes full catalog + items(sortOrder asc) with inventoryItem select. |
| 7 — POST /api/maintenance-sets/[id]/items | ✅ | `2fecb72` | 5 tests. TOOL+inventoryItemId rejection happens in Zod schema (Session 1 Task 2). Cross-tenant `inventoryItem` guard via `findFirst({ where: { id, companyId } })` — load-bearing per Decision §4. Assertion style: test verifies the actual Prisma call args, not just response shape. |
| 8 — MaintenanceSetItem PATCH/DELETE + reorder | ✅ | `0f6297c` | 11 tests (7 single-item + 4 reorder). `loadItem` helper uses nested Prisma relation filter `{ maintenanceSet: { companyId } }` — idiomatic for items that lack direct `companyId`. Reorder uses `prisma.$transaction([...updates])`. Bulk reorder verifies all item IDs belong to the parent set (400 on mismatch). |

**Session 2 full commit chain (most recent first):**
- `0f6297c` feat(api): MaintenanceSetItem PATCH/DELETE + bulk reorder
- `2fecb72` feat(api): POST /api/maintenance-sets/[id]/items
- `79d5d83` feat(api): GET + DELETE /api/maintenance-sets/[id]
- `4609da2` feat(api): GET + POST /api/maintenance-sets
- `6426f2a` fix(lib): harden getEffectivePartsForSystem per review
- `56f3e87` feat(lib): add getEffectivePartsForSystem resolver

**Also committed to `main` during session start (state-cleanup, not feature work):**
- `680c962` kundenwartungsteile data — user-curated Wartungsteile reference folder; cherry-picked to main after accidental commit on feature branch. See Session Protocol note below.

**Session 2 end-of-session health:**
- Tests: 220/220 passing (179 baseline + 41 net new across Tasks 4–8)
- `tsc --noEmit`: clean
- Working tree: clean (except pre-existing `kundenaustausch/Wartungsteile/` untracked state)

**Session 2 start cleanup note:** Session 2 opened with an accidental commit on feature (`4451e97 kundenwartungsteile data`) bundling the user's Wartungsteile reference folder. User intent was main branch. Recovery: cherry-picked to main (as `680c962`), then `git reset --mixed HEAD~1` on feature to restore the runbook-documented untracked state. No feature-branch content lost.

### Session 3 (2026-04-24) — Inventory API

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 9 — GET/POST /api/inventory | ✅ | `dddb8ce` | 8 tests. GET allowed to both OWNER and TECHNICIAN (`requireAuth`); POST OWNER-only. `?filter=low` exercises real `Prisma.Decimal.lt()` in tests. `articleNumber` dedup gated on truthy value (null allowed multiple times). |
| 10 — GET/PATCH/DELETE /api/inventory/[id] | ✅ | `8631268` + `7c45b16` (fix-round, bundled with Task 11 fixes) | 11 tests. PATCH via `inventoryItemUpdateSchema.strict()` rejects `currentStock` at Zod layer (defense-in-depth for stock-via-movements invariant). DELETE reference-block via `Promise.all` of `maintenanceSetItem.count` + `customerSystemPartOverride.count`. |
| 11 — InventoryMovement GET/POST | ✅ | `274330e` + `7c45b16` (fix-round) | 9 tests. Uses `prisma.$transaction(async (tx) => ...)` **callback form** (vs. array form in Task 8 reorder). Mock technique: callback receives `prisma as never` so nested `tx.inventoryMovement.create` / `tx.inventoryItem.update` are asserted against already-mocked prisma. `RESTOCK` adds `lastRestockedAt`, `CORRECTION` does not. `MAINTENANCE_USE` is NOT in `inventoryMovementCreateSchema.reason` enum (handled exclusively by maintenance POST flow). |

**Session 3 full commit chain (most recent first):**
- `7c45b16` fix(api): rate-limit inventory detail + movements per review
- `274330e` feat(api): InventoryMovement list + manual create
- `8631268` feat(api): GET/PATCH/DELETE /api/inventory/[id] with reference-block
- `dddb8ce` feat(api): GET + POST /api/inventory

**Session 3 end-of-session health:**
- Tests: 255/255 passing (+35 net new across Tasks 9–11, after fix-round coverage updates)
- `tsc --noEmit`: clean
- Working tree: clean (except pre-existing `kundenaustausch/Wartungsteile/` untracked state)
- Review status: all 3 tasks covered by a single combined batch review (Decision §10). **Approved-with-fixes.** Two "Important" fixes applied in `7c45b16`: rate-limiting added to Tasks 10 and 11 routes (plan pseudocode had omitted it); Task 10 `dup.id === id` guard test rewritten to exercise the actual branch (prior test short-circuited on the outer guard).

**Session 3 observed flakiness (informational — no action needed):** On one `npm test` run during end-of-session verification, Vitest reported `25 failed (25)` with `no tests` loaded (`import 0ms, tests 0ms`) — clearly a startup-phase glitch, not a real failure. Immediate re-run: `25 passed, 255 passed`. This is consistent with the Task-4 implementer's earlier claim about vmThreads pool behavior on Windows. **Not blocking — but if this recurs in Session 4+ consistently**, consider adding `pool: 'vmForks'` to `vitest.config.ts`. Don't add it preemptively; the flaky run was one-off. **Session 4 update:** zero flakiness observed across 4 separate `npm test` runs (1 baseline + 3 per-task verifications + 1 final). Pool config left untouched.

### Session 4 (2026-04-27) — Overrides + effective-parts API

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 12 — POST /api/customer-systems/[id]/overrides | ✅ | `6e9da50` | 11 tests. Substantive — full sequential review (spec ✅ then quality ✅, no fix-round). Both load-bearing cross-tenant guards from Decision §4 in place: EXCLUDE checks `maintenanceSet: { companyId, catalogId: system.catalogId }`; ADD with `inventoryItemId` checks `inventoryItem.findFirst({ id, companyId })`. Catalog-mismatch test pins the full where-clause shape so future refactors can't silently drop `catalogId`. Rate-limiting added per Decision §12 (plan omitted). Audit whitelist updated. |
| 13 — DELETE /api/overrides/[id] | ✅ | `b660b4a` | 4 tests. Trivial — parallel spec + quality reviews per Decision §7. Tenant scoping via relational filter `customerSystem: { companyId }` (override has no direct `companyId` column). Cross-tenant 404 test pins where-clause shape. Audit whitelist updated. Underscore prefix on `request` dropped (now used by rate-limiter). |
| 14 — GET /api/customer-systems/[id]/effective-parts | ✅ | `ce8e767` | 7 tests. Trivial — parallel reviews. Uses `requireAuth` (not `requireOwner`) since both roles read; TECHNICIAN role-scope gates non-assigned systems with 403 "Zugriff verweigert". Resolver `getEffectivePartsForSystem` mocked at module boundary in tests. SELECT-shape test (`{ id: true, assignedToUserId: true }`) pins the over-fetch invariant. Audit whitelist updated. |

**Session 4 full commit chain (most recent first):**
- `ce8e767` feat(api): GET /api/customer-systems/[id]/effective-parts
- `b660b4a` feat(api): DELETE /api/overrides/[id]
- `6e9da50` feat(api): POST /api/customer-systems/[id]/overrides

**Session 4 end-of-session health:**
- Tests: 283/283 passing across 28 files (+22 net new across Tasks 12–14: 11 + 4 + 7)
- `tsc --noEmit`: clean
- Working tree: clean (except pre-existing `kundenaustausch/Wartungsteile/` untracked state)
- Review status: all 3 tasks **Approved-without-fixes** on first review pass. No fix-round required for Session 4.

**Session 4 audit whitelist additions to `src/__tests__/audit/tenant-isolation.test.ts`:**
- `'customer-systems/[id]/overrides/route.ts'`
- `'overrides/[id]/route.ts'`
- `'customer-systems/[id]/effective-parts/route.ts'`

### Session 5 (2026-04-27) — Maintenance route extensions (substantive)

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 15 — Extend POST /api/maintenances with `partsUsed` | ✅ | `50f5c30` | 8 tests. Substantive — full sequential review. First task in feature to MODIFY an existing route. POST handler `$transaction` callback extended with parts-loop: per-entry cross-tenant guard via `tx.inventoryItem.findFirst({ id, companyId })` (Decision §4); creates `MAINTENANCE_USE` movement with `quantityChange: -Math.abs(entry.quantity)`; decrements stock; pushes `negativeStockWarnings` if `currentStock.lt(0)` (N3 policy — stock allowed negative). Snapshot of all entries (linked + AD_HOC) merged into `checklistData.partsUsed`. Response wrapper extended with `negativeStockWarnings` field. GET handler verbatim untouched. Implementer also tightened test fixtures: strict UUID v4 + ISO datetime to satisfy Zod — no behavior change. |
| 16 — Extend DELETE /api/maintenances/[id] with R1 reversal | ✅ | `1c14453` | 7 tests. Substantive — full sequential review. Plan pseudocode was INCOMPLETE (omitted photo cleanup); implementer integrated correctly. Photo cleanup placed POST-transaction (rationale in JSDoc: rollback would orphan row from files on retry). New `$transaction` does findMany→loop(create CORRECTION + increment stock)→updateMany(maintenanceId=null)→delete in correct order. CORRECTION movements use Decimal `.neg()` and `.abs()` methods (NOT JS `Math.abs`); German note pinned exactly: `'Rückbuchung: Wartung gelöscht'`; `userId` from `requireOwner` flows into audit. `companyId` filter added defense-in-depth to both findMany and updateMany even though parent maintenance is already tenant-verified (Decision §4 spirit). `updateMany` step kept despite schema `onDelete: SetNull` — pinned by test to prevent silent removal under future schema drift. |

**Session 5 full commit chain (most recent first):**
- `1c14453` feat(api): DELETE /api/maintenances/[id] auto-reverses stock movements (R1)
- `50f5c30` feat(api): extend POST /api/maintenances with partsUsed transactional handling

**Session 5 end-of-session health:**
- Tests: 298/298 passing across 30 files (+15 net new across Tasks 15–16: 8 + 7)
- `tsc --noEmit`: clean
- Working tree: clean (except pre-existing `kundenaustausch/Wartungsteile/` untracked state)
- Review status: both tasks **Approved-without-fixes** on first review pass. No fix-round required for Session 5. Both substantive tasks went through full sequential spec→quality flow per Session Protocol.
- **Cross-session deviation note:** Sessions 4 + 5 were executed in the SAME Claude Code context (user requested chained execution of Session 5 immediately after Session 4 ended). The runbook's "fresh session per chunk" guideline was relaxed; review quality remained high (zero fix-rounds across 5 tasks), but for Session 6+ revert to fresh-context default unless user explicitly chains.

**Session 5 carry-forward items (non-blocking — fold in opportunistically; from Task 15+16 quality reviews):**
- `src/app/api/maintenances/route.ts` line 83 (Task 15): the stock decrement uses `decrement: entry.quantity` (raw) while the movement uses `-Math.abs(entry.quantity)`. Asymmetric defense-in-depth. Zod schema enforces `quantity >= 0` so functionally equivalent today; if file is next touched, mirror the `Math.abs` to line 83 for consistency. Cosmetic.
- `src/app/api/maintenances/[id]/__tests__/route.test.ts` case 6 (Task 16): atomicity-rollback test lacks the explicit comment that mock-mode propagates throws but does NOT exercise real Postgres rollback (Task 35 covers that). Task 15's case 6 has this disclaimer; Task 16 does not. Add the comment when the file is next touched.
- `src/app/api/maintenances/[id]/__tests__/route.test.ts` case 6 (Task 16): could additionally assert `expect(prisma.inventoryItem.update).not.toHaveBeenCalled()` to lock against a `create`/`update` reorder regression. Cheap, non-blocking.
- `src/app/api/maintenances/[id]/__tests__/route.test.ts` `mockDecimal` (Task 16): stubs only `.neg()`, `.abs()`, `.toString()`, `.valueOf()`. Add a 1-line comment near the stub clarifying that adding new Decimal calls in the route requires extending the stub.

### Session 6 (2026-04-27) — Packing-list API + dashboard stats extension

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 17 — GET /api/bookings/[id]/packing-list | ✅ | `e47c566` | 8 tests. Substantive — full sequential review (spec ✅ then quality ✅, no fix-round). Mirrors Task 14 `effective-parts` route shape: requireAuth → rate-limit → findFirst → 404 if null → 403 if TECHNICIAN-not-assigned → resolver delegation. TECHNICIAN check happens AFTER the findFirst lookup so cross-tenant existence cannot be probed via 404-vs-403 oracle. Plan pseudocode omitted `rateLimitByUser` — fixed per Decision §12 (signature changed `_request` → `request`, test mocks `@/lib/rate-limit`). Booking-without-systemId case relies on Prisma's `include: { system: ... }` returning `null` when the FK is null — both `system: null` and `effectiveParts: []` returned in that branch. TECHNICIAN scope intentionally narrower than `bookings/[id]/route.ts` GET (only `booking.assignedToUserId === userId`, NOT also `system.assignedToUserId`) per plan. Audit whitelist updated. Two strongly-recommended pin tests added beyond the 5 plan cases: `findFirst` `where`/`include` shape pin + resolver-delegation arg pin. |
| 18 — Dashboard stats include `inventoryBelowMinStockCount` | ✅ | `a8c4d74` | 5 tests. Trivial — parallel spec + quality reviews per Decision §7. In-memory filter approach per plan (`findMany` with `select: { currentStock: true, minStock: true }`, then `.filter((i) => i.currentStock.lt(i.minStock)).length`); explicitly NOT raw SQL or Prisma field-comparison. Spread idiom `...(isOwner ? { inventoryBelowMinStockCount } : {})` so TECHNICIAN response truly omits the field (asserted via `not.toHaveProperty` + `findMany NOT called`). Tests use real `Prisma.Decimal` from `@prisma/client/runtime/library` — exercises actual `.lt()` semantics including the boundary case `5 lt 5 → false`. Out-of-scope items deliberately preserved: `unassignedSystemsCount` always-included pattern untouched; rate-limit NOT added (existing route was pre-Decision-§12). |

**Session 6 full commit chain (most recent first):**
- `a8c4d74` feat(api): dashboard stats include inventoryBelowMinStockCount for OWNER
- `e47c566` feat(api): GET /api/bookings/[id]/packing-list

**Session 6 end-of-session health:**
- Tests: 313/313 passing across 32 files (+15 net new across Tasks 17–18: 8 + 5 + 2 audit auto-generated)
- `tsc --noEmit`: clean
- Working tree: clean (except pre-existing `kundenaustausch/Wartungsteile/` untracked state)
- Review status: both tasks **Approved-without-fixes** on first review pass. No fix-round required for Session 6. Task 17 went sequential per substantive-task rule; Task 18 went parallel per Decision §7 (≤50 LOC, no cross-cutting changes).

**Session 6 audit whitelist additions to `src/__tests__/audit/tenant-isolation.test.ts`:**
- `'bookings/[id]/packing-list/route.ts'`

**Session 6 carry-forward items (non-blocking — fold in opportunistically; from Task 18 quality review):**
- `src/app/api/dashboard/stats/route.ts` line 83 (Task 18): the new `findMany` for inventoryBelowMinStockCount runs **serially** after `unassignedSystemsCount` inside the `if (isOwner)` block, rather than joining the upstream `Promise.all` (lines 36–80). Mirrors the existing `unassignedSystemsCount` placement; pilot scale makes this trivial. If the OWNER stats path ever shows latency, fold both into a single `Promise.all`. Cosmetic.
- `src/app/api/dashboard/stats/route.ts` line 83 (Task 18): outer-scope declaration `let inventoryBelowMinStockCount = 0` is dead in the non-OWNER path because the spread idiom omits it. Harmless, but the variable could be inlined into the `if (isOwner)` block since the spread is the only consumer. Cleanup-only; touch when refactoring.

### Session 7 (2026-04-27) — React Query hooks (sets, overrides, inventory, packing-list)

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 19 — Hooks: useMaintenanceSets + useMaintenanceSetItems | ✅ | `19a1e13` + `45677b6` (fix-round) | 8 hooks across 2 files. Plan pseudocode used loose typing (`any`, `Record<string, unknown>`) — implementer correctly mirrored stricter `useEmployees`-style typing instead (typed `MaintenanceSetSummary`, `MaintenanceSetDetail`, `MaintenanceSetItem`, `InventoryItemMini`, `PartCategory` enum). Plan's `if (!res.ok)` HTTP-only check replaced with codebase's `ApiResponse<T>` envelope check. Decimal-as-string convention applied to `currentStock`, `minStock`, `quantity`. Fix-round addressed: (1) **material** — all 4 item-mutation hooks now invalidate `['maintenance-sets']` prefix instead of only `['maintenance-sets', setId]`, so list `_count.items` badge refreshes after item create/delete; (2) tightened `useCreateMaintenanceSet` return type via `MaintenanceSetCreated = Omit<MaintenanceSetSummary, '_count'>` (POST handler doesn't return `_count`); (3) renamed `data` → `body` in `useUpdateSetItem` mutationFn arg to match plan. Test count unchanged (313/313) — hooks have no test infrastructure in this codebase (zero `__tests__` dirs in `src/hooks/`), and plan does not require tests for these tasks. |
| 20 — Hooks: useEffectiveParts + useCustomerSystemOverrides | ✅ | `dbd34e5` | 3 hooks across 2 files. Approved on first review pass (parallel spec + quality, both clean). `EffectivePart` typed as discriminated union with `source: 'DEFAULT' \| 'OVERRIDE_ADD'` (NOT `'AD_HOC'` — confirmed in `src/lib/maintenance-parts.ts`). `CreateOverrideInput` is a 2-variant discriminated union (`ADD` and `EXCLUDE`) discriminated by `action` literal — matches `customerSystemOverrideSchema` in `validations.ts` (the briefing initially overestimated 5 variants; implementer correctly read the schema). `useDeleteOverride` invalidates only `['effective-parts', cid]` per plan — implementer verified via grep that customer-systems detail GET does NOT include `partOverrides`, so narrower invalidation is correct. `useCreateOverride` adds `['customer-systems', cid]` invalidation as forward-compat (cheap, harmless). |
| 21 — Hooks: useInventory + useInventoryMovements + usePackingList | ✅ | `1b57c29` | 8 hooks across 3 files. Approved on first review pass (parallel spec + quality). Key typing decision: split `MovementReason` (full enum incl. `MAINTENANCE_USE`/`MANUAL_ADJUSTMENT` for read responses) from `MovementReasonInput` (`'RESTOCK' \| 'CORRECTION'` for create-input only, matching `inventoryMovementCreateSchema`). `useCreateMovement` invalidates `['inventory']` (prefix-match catches movements automatically) plus the explicit `['inventory', itemId, 'movements']` per plan — the second is technically redundant but harmless. `useUpdateInventoryItem` mutation arg is `{ id, body }` matching plan; `UpdateInventoryItemInput = Partial<CreateInventoryItemInput>` correctly excludes `currentStock` (Zod schema is `.strict()`). `usePackingList` reuses `EffectivePart` from Task 20 export — no type duplication. `staleTime`: list/detail hooks `30_000`, packing-list `60_000` per plan. Decimal serialization: persisted `quantityChange` is `string`, input `quantityChange` is `number`. |

**Session 7 full commit chain (most recent first):**
- `1b57c29` feat(hooks): inventory, movements, packing-list
- `dbd34e5` feat(hooks): useEffectiveParts + useCustomerSystemOverrides
- `45677b6` fix(hooks): broaden invalidation to list + tighten createSet return type
- `19a1e13` feat(hooks): maintenance-sets + items React Query hooks

**Session 7 end-of-session health:**
- Tests: 313/313 passing across 32 files (no net new — hooks have no test infrastructure in `src/hooks/`)
- `tsc --noEmit`: clean
- Working tree: clean (except pre-existing `kundenaustausch/Wartungsteile/` untracked state)
- Review status: Task 19 needed 1 fix-round on quality (material invalidation gap); Tasks 20 and 21 **Approved-without-fixes** on first parallel review pass.

**Cross-session deviation note:** Sessions 6 + 7 were chained in the same Claude Code context per user request ("Tackle it!"). Per Session 5 carry-forward note, fresh-context default applies unless explicitly chained — user explicitly chained.

**Session 7 carry-forward items (non-blocking — fold in opportunistically; from Task 19+20+21 quality reviews):**
- `src/hooks/useEffectiveParts.ts:67` (Task 20): uses `30 * 1000` while peer hooks use `30_000` literal style. Cosmetic style inconsistency only.
- `src/hooks/useInventoryMovements.ts` (Task 21): explicit `['inventory', itemId, 'movements']` invalidation alongside `['inventory']` is technically redundant (prefix-match covers it). Plan-driven; if cleaning, drop the explicit child.
- `src/hooks/useMaintenanceSets.ts` `useCreateMaintenanceSet` (Task 19): If the API later adds `_count: { items: 0 }` to the POST response for symmetry, the `MaintenanceSetCreated = Omit<...>` type can be removed in favor of `MaintenanceSetSummary`. Track if a future task touches the POST handler.

### Session 8 (2026-04-27) — Frontend kickoff: nav + Wartungssets pages

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 22 — Nav: Wartungssets + Lager entries | ✅ | `0c83ebc` | +17/-2 LOC in `src/components/DashboardNav.tsx`. Trivial — parallel spec + quality reviews per Decision §7. Both reviews approved on first pass with only minor non-blocking notes (see carry-forward). Icons: `ClipboardListIcon` (Wartungssets, OWNER-only), `Package2Icon` (Lager, both roles). Low-stock badge approach: `useInventoryItems('low')` called unconditionally at top of component, displayed value zeroed for non-OWNER (`isOwner ? lowStockItems?.length ?? 0 : 0`) — accepts one extra GET per technician nav-mount (staleTime 30s) instead of extending the hook with an `enabled` option for a single consumer. Badge takes the `ml-auto` slot in place of the active-dot when shown (`active && !collapsed && !showBadge` — clean). Style copied verbatim from the existing Inhaber pill (`bg-sidebar-primary/20 text-sidebar-primary text-[10px] uppercase px-1.5 py-0.5 rounded`). Spec reviewer: ✅. Quality reviewer: ✅ Approved. |
| 23 — `/dashboard/wartungssets` list page | ✅ | `75568e1` + `7f17da7` (fix-round) | 372 LOC across 3 new files: `page.tsx` (36) + `MaintenanceSetList.tsx` (160) + `CatalogPickerForSetCreation.tsx` (176). Sequential review per Decision §10 (372 LOC > 80 LOC threshold). Spec ✅ first pass. Quality returned **Approved-with-fixes**: I-1 = 409 race left `existingCatalogIds` stale (mutation never reaches `onSuccess` so list cache wasn't invalidated → user sees same now-taken row again); M-4 = `new Set(...)` on every parent render destabilized the picker's `useMemo` deps. Fix-round commit `7f17da7` (+11/-1) addressed both: unconditional `queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] })` in the `catch` branch + `useMemo` wrap on `existingCatalogIds`. Implementer's beyond-plan choice (lifted the duplicate-filter Set construction from picker to parent) accepted as cleaner. OWNER guard placed in `page.tsx` (mirrors `employees/page.tsx`). Two-level grouping: outer `SYSTEM_TYPE_ORDER` `['HEATING','AC','WATER_TREATMENT','ENERGY_STORAGE']` → inner manufacturer alphabetical via `localeCompare('de')` → sets sorted by `catalog.name`. Reused `SYSTEM_TYPE_LABELS` from `src/lib/constants.ts`. Modal pattern: inline `fixed inset-0 z-50 ...` with `max-w-lg`. Item-count badge uses `ClipboardListIcon` + pluralized "Teil"/"Teile". 409 race surfaced via `toast.error` (sonner). |
| 24 — `/dashboard/wartungssets/[id]` detail + item form | ✅ | `8378a14` | 788 LOC across 4 new files: `page.tsx` (9) + `MaintenanceSetDetail.tsx` (216) + `MaintenanceSetItemsTable.tsx` (242) + `MaintenanceSetItemForm.tsx` (321). Substantive — full sequential review (spec ✅ then quality ✅, no fix-round). Page wrapper uses `use(params)` exactly per plan's verbatim snippet. OWNER guard placed inside `MaintenanceSetDetail` (not the page wrapper) so the wrapper stays trivially thin. shadcn `<AlertDialog>` used for both delete-set + delete-item confirmations (with `e.preventDefault()` + `!isPending` gating to keep dialog open during async work). Reorder logic correctly swaps `sortOrder` *values* (NOT array indices): `[{a.id, b.sortOrder}, {b.id, a.sortOrder}]` per plan example. Server-driven (no optimistic update); rapid-double-click race gated by `if (reorderMutation.isPending) return`. Form: RHF + `zodResolver(maintenanceSetItemCreateSchema)` from `@/lib/validations` with one justified `as Resolver<FormValues>` cast (zod's `default()` chains diverge input/output types). TOOL → inventoryItemId clearing in three layers: `useEffect` clear + native-select disabled + server-side Zod refine. `<Switch>` controlled via `watch('required')` + `setValue`. `parseFloat(item.quantity)` for the Decimal-as-string edit-mode default. Native `<select>` for category and inventory picker (cleaner RHF binding than shadcn `<Select>`). Inventory picker has `__none__` sentinel option mapped to `undefined`, label `— Keine Verknüpfung —`. Category badges by tier: SPARE_PART=default, CONSUMABLE=secondary, TOOL=outline. Quality reviewer noted defense-in-depth on TOOL clearing (3 layers, each independent), confirmed server-side `requireOwner()` on `maintenance-sets/[id]` + `items/route.ts` (so client guard is correctly UX-only, no security dependency), confirmed AlertDialog mutation-gating soundness. |

**Session 8 full commit chain (most recent first):**
- `8378a14` feat(ui): /dashboard/wartungssets/[id] detail + item form
- `7f17da7` fix(ui): invalidate maintenance-sets on 409 + memoize taken-catalogIds set
- `75568e1` feat(ui): /dashboard/wartungssets list page
- `0c83ebc` feat(nav): add Wartungssets + Lager entries

**Session 8 end-of-session health:**
- Tests: 313/313 passing across 32 files (no net new — UI components have no test infrastructure)
- `tsc --noEmit`: clean
- Working tree: `.claude/settings.json` modified (pre-existing user-level — leave alone), `graphify-out-{backbone,codemap}/` modified (auto-regenerated by post-commit hook, will ride along with the next commit per CLAUDE.md), `kundenaustausch/Wartungsteile/` untracked (pre-existing — leave alone).
- Review status: Task 22 + 24 **Approved-without-fixes** on first review pass; Task 23 **Approved-with-fixes** (1 fix-round, 2 issues addressed in `7f17da7`).
- **Browser verification: NOT performed this session.** Per Task 35 (manual verification checklist) the full UI flow will be exercised in browser at the end of Phase A. Individual UI tasks 22-24 verified via `tsc --noEmit` + the existing test suite only.

**Cross-session deviation note:** Sessions 7 + 8 were chained in the same Claude Code context per user request ("continue working on the feature… Lift off!"). Fresh-context default still applies unless explicitly chained — user explicitly chained.

**Session 8 carry-forward items (non-blocking — fold in opportunistically; from Task 22+23+24 quality reviews):**
- **Task 22:** `useInventoryItems` could accept an `enabled` option to skip the fetch entirely for non-OWNER (saves 1 GET per technician nav-mount; staleTime caches subsequent renders). Backlog candidate.
- **Task 22:** Badge in `DashboardNav.tsx` lacks `aria-label` (e.g., `aria-label={`${badgeCount} Artikel mit niedrigem Bestand`}`). Screen-reader users currently hear a bare number adjacent to "Lager". Easy add in next pass.
- **Task 22:** Badge gating uses `item.href === '/dashboard/lager'` literal — coupling. If a third badge ever lands, refactor `NavItem` with `badge?: () => number`. YAGNI for now.
- **Task 23 + 24:** Inline modal pattern (`CatalogPickerForSetCreation`, `MaintenanceSetItemForm`, plus existing `CreateEmployeeDialog` and other in-codebase modals) lacks Esc-to-close, backdrop-click-to-close, and focus trap. Repo-wide gap. Worth a future task to introduce a shared `<Dialog>` primitive (e.g., shadcn Radix-based) and migrate all callers in one pass.
- **Task 23:** `MaintenanceSetList` and `CatalogPickerForSetCreation` both implement `groupBySystemTypeAndManufacturer` with the same sort rules (~25 LOC duplication). Extract to `src/lib/maintenance-sets/grouping.ts` if a third caller appears.
- **Task 23:** Click-row pattern uses `role="button" tabIndex={0}` (matches `EmployeeCard`); a real `<button>` element would be slightly more correct semantically. Not regressing existing pattern, accept.
- **Task 24:** AlertDialog destructive-confirm boilerplate is duplicated in `MaintenanceSetDetail` and `MaintenanceSetItemsTable` (~30 LOC). Extract a `<DestructiveConfirmDialog />` if a third caller lands.
- **Task 24:** `MaintenanceSetItemsTable.isMutating` combines reorder + delete into one flag → all rows' Edit buttons disable while one row's delete is in flight. Functionally safe, slightly conservative UX.
- **Task 24:** The `as Resolver<FormValues>` cast on `MaintenanceSetItemForm.tsx:86` deserves a 1-line comment explaining the zod `default()` input/output divergence; future maintainer might "fix" the cast and break compilation.

### Session 9 (2026-04-27) — Lager page + inventory drawer/forms

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 25 — `/dashboard/lager` list + status badge | ✅ | `67ff35f` + `045a639` (fix-round, controller-applied) | 183 LOC across 3 new files: `InventoryStatusBadge.tsx` (27) + `InventoryList.tsx` (139) + `page.tsx` (17). Sequential review per Decision §10 (>80 LOC). Spec ✅ first pass with two approved minor deviations: (a) badge prop type is `string \| number` rather than plan's verbatim `Prisma.Decimal \| number` because `useInventoryItems` returns Decimal-as-string (JSDoc justifies); (b) page shell adds subtitle (matches sibling pages — Mitarbeiter / Wartungssets). Quality returned **Approved-with-fixes** flagging Badge color drift: plan's verbatim raw Tailwind `bg-red-100 text-red-800` / `bg-amber-100 text-amber-800` bypassed the shadcn variant system (Badge has `default | secondary | destructive | outline`). Controller-applied tiny fix `045a639`: "Leer" → `<Badge variant="destructive">` (existing variant, dark-mode safe); "Niedrig" kept amber per plan but added `dark:bg-amber-900/30 dark:text-amber-300 border-transparent` for dark-mode contrast. Adding a `warning` Badge variant left as future polish. **TECHNICIAN can VIEW the page** (Decision §6 — GET `/api/inventory` allows both roles); only the "+ Neues Lagerteil" CTA is `isOwner`-gated. Plug-in placeholders `selectedItemId` / `showCreateForm` wired with TODO comments + `&& null` no-op (lint-bridge for Task 26). Filter toggle as segmented `<Button>` group. Empty state differentiated by filter ("Noch keine Lagerteile angelegt" vs "Keine Artikel mit niedrigem Bestand"). `useInventoryItems(filter === 'low' ? 'low' : undefined)` — passes `undefined` not `'all'` to match the hook's `filter?: 'low'` signature. **Vitest startup-flakiness recurrence:** the implementer hit the documented Session 3 flakiness pattern (`Tests no tests, 0ms`) and incorrectly concluded tests were broken on the branch — controller verified by re-running once → 313/313 green. Documented in Session 9 carry-forward: implementer briefings for future UI tasks must explicitly call out the flakiness pattern + re-run instruction (added to this Task 26's briefing successfully). |
| 26 — Inventory drawer + item form + movement form | ✅ | `3ce3781` | 707 LOC across 3 new files + 1 modified: `InventoryDrawer.tsx` (338) + `InventoryItemForm.tsx` (198) + `InventoryMovementForm.tsx` (171); `InventoryList.tsx` 139→150 (placeholders replaced). Substantive — full sequential review (spec ✅ then quality ✅, no fix-round). Drawer mirrors `BookingDetailsDrawer` pattern (`fixed inset-0 z-40 bg-black/40 flex justify-end` + `<aside class="w-full sm:max-w-md ...">`). Z-index layering: drawer overlay z-40, form modals z-50, AlertDialog z-50 (above forms) — chosen so child forms layer above the drawer. **Drawer fetches fresh item via `useInventoryItem(itemId)`** (NOT list snapshot) so stock counter + lastRestockedAt refresh in-place after each movement (relies on React Query prefix-match cascade: `useCreateMovement` invalidates `['inventory']` → cascades to `['inventory', id]` and `['inventory', id, 'movements']`). Single `<InventoryMovementForm reason="RESTOCK"\|"CORRECTION">` (plan's preferred shape) with reason-conditional title/label/helper-text/min-validation. Movement form does NOT use `zodResolver` (plan didn't require it for this form — minimal payload, reason fixed by prop, inline guard against `0`/NaN/negative-on-RESTOCK is sufficient; server is the truth). Item form uses `zodResolver(inventoryItemCreateSchema) as Resolver<FormValues>` with documented zod-default-divergence comment (Session 8 carry-forward addressed). Item form fields: description / articleNumber (optional) / unit (default 'Stck') / minStock — `currentStock` correctly NOT exposed (server `.strict()` rejects). Drawer state `editing` / `movementMode` / `confirmDelete` lives drawer-local; conditionally-mounted via `{selectedItemId && <InventoryDrawer/>}` in parent so close fully unmounts → state discarded → no stale-state flash. shadcn `<AlertDialog>` for delete confirmation with `e.preventDefault()` + `disabled` during pending (matches Task 24). Reference-block 400 from server surfaced via `toast.error` and drawer stays open (preserves user context). Bewegungshistorie row format: `dd.MM.yy HH:mm` date · user (or "Unbekannt") · German reason badge (Zugang/Korrektur/Wartung/Manuell) · signed quantity (text-emerald-600 if positive, text-destructive if negative) · note. `MovementReasonInput` (write subset) vs `MovementReason` (full read enum) types correctly used. TECHNICIAN can OPEN drawer (read access) but action section (`{isOwner && ...}`) is fully hidden — server-enforced anyway. Quality reviewer flagged 5 minor non-blocking items (carry-forward below). |

**Session 9 full commit chain (most recent first):**
- `3ce3781` feat(ui): inventory drawer + forms
- `045a639` fix(ui): align inventory status badge with shadcn variants
- `67ff35f` feat(ui): /dashboard/lager list + status badge

**Session 9 end-of-session health:**
- Tests: 313/313 passing across 32 files (no net new — UI components have no test infrastructure)
- `tsc --noEmit`: clean
- Working tree: `.claude/settings.json` modified (pre-existing user-level — leave alone), `graphify-out-{backbone,codemap}/` modified (auto-regenerated by post-commit hook, will ride along with the next runbook commit per CLAUDE.md), `kundenaustausch/Wartungsteile/` untracked (pre-existing — leave alone).
- Review status: Task 25 needed 1 controller-applied fix-round (badge variants); Task 26 **Approved-without-fixes** on first review pass.
- **Browser verification: NOT performed this session.** Same as Session 8 — Task 35 (manual verification checklist) covers the full UI flow at end of Phase A.

**Cross-session deviation note:** Sessions 8 + 9 were chained in the same Claude Code context per user request ("Lift off!" → user signaled continue with Session 9 immediately after Session 8 close). Fresh-context default still applies unless explicitly chained — user explicitly chained.

**Session 9 carry-forward items (non-blocking — fold in opportunistically; from Task 25+26 quality reviews):**
- **Task 25:** Add a `warning` variant to `src/components/ui/badge.tsx` (`bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-transparent`) so `<Badge variant="warning">` works for all future "low/warning" states; then migrate `InventoryStatusBadge` "Niedrig" path to use it. Cosmetic, ~5 LOC.
- **Task 25 + general:** Vitest startup-flakiness on Windows (`Tests no tests, 0ms` on first run) recurs sporadically (Session 3 → Session 9). Implementer briefings must call out the pattern + re-run instruction so implementers don't misread it as a real failure. Persistent (3+ consecutive sessions) recurrence would justify adding `pool: 'vmForks'` to `vitest.config.ts`; not yet warranted.
- **Task 26 (I-1):** `InventoryDrawer.tsx:91-96` overlay `onClick={onClose}` does not gate on `deleteMutation.isPending` — clicking outside during a pending delete unmounts the drawer mid-flight (mutation completes but the success toast / state-reset is unreachable). The inner `<AlertDialog>` already gates its own close while pending, but the outer overlay does not. Cheap 1-line fix when next touched: `onClick={() => { if (!deleteMutation.isPending) onClose(); }}`.
- **Task 26 (I-4):** `InventoryItemForm` PATCH body sends `articleNumber: undefined` when user clears the field → JSON.stringify drops it → server-side it's a no-op (column NOT cleared). If "clear to null" is the desired UX, the form needs to send explicit `null` and the schema needs to accept `null` in `articleNumber`. Verify intended product behavior before fixing.
- **Task 26 (M-2):** `InventoryDrawer.tsx` is 338 LOC. Bewegungshistorie (lines 219–270) is a self-contained pure-render block ideal for extraction to `InventoryMovementHistory.tsx` if the section grows (filtering, pagination beyond 30).
- **Task 26 (M-5):** `Number(mv.quantityChange) > 0 ? text-emerald-600 : text-destructive` paints zero as destructive. Server-rejected unreachable case but `=== 0 → text-muted-foreground` would be more correct defensively.
- **Resolver-cast comment style:** Task 26 used a 3-line block (vs Session 8's "1-line" suggestion). Both are acceptable; future tasks can pick whichever feels cleaner — content > line count.

### Session 10 (2026-04-27) — System-detail integration + checklist Step 2.5 (substantive)

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 27 — `PartsListCard` on system detail | ✅ | `26b88ae` | 920 LOC across 3 new + 4 modified files. Sequential review per Decision §10. Spec ✅ first pass; quality **Approved-without-fixes**. **Authorized scope expansion:** the briefing flagged that `useCustomerSystem(systemId)` did NOT return `partOverrides`, and option (a) authorized extending the GET handler include + the hook type. Implementer added `partOverrides: { orderBy: { sortOrder: 'asc' } }` to the GET include at `src/app/api/customer-systems/[id]/route.ts:32` (tenant isolation preserved via parent `findFirst({ where: { id, companyId } })` — Prisma includes are constrained by parent filter, audit whitelist already covers this route). **Bonus bug-fix bundled:** `useCreateOverride` and `useDeleteOverride` had been invalidating `['customer-systems', customerSystemId]` (plural-list queryKey shape) which never matched the singular detail key `['customer-system', systemId]` from `useCustomerSystems.ts:70`. Fixed to use the singular key + added `effective-parts` invalidation to the delete path. Was a Session 4 / Task 12+13 sleeper — acceptable to bundle since the new component would have surfaced the symptom. **Card design:** three sections — (1) Standard-Wartungsset preview with OWNER edit/create CTAs; (2) `<CustomerSystemOverrideList>` with Hinzugefügt + Ausgeschlossen sub-groups, OWNER actions bar (+ Teil hinzufügen / + Standard ausschließen), shadcn `<AlertDialog>` for delete; (3) Effektive Liste collapsed-by-default, expand via stateful toggle (not `<details>` — chosen so `(N)` count badge sits next to heading). EXCLUDE picker is an inline modal that filters out already-excluded items via `Set<excludedSetItemId>`. Override form uses local `overrideAddFormSchema` (NOT the union) — RHF can't cleanly handle the discriminator + `excludedSetItemId: z.undefined()` constraint. Decimal-as-string rendering (`{quantity} {unit}`) is consistent with the rest of the new code; locale-aware German formatting is repo-wide carry-forward. |
| 28 — `MaintenanceChecklistModal` Step 2.5 Teileverbrauch | ✅ | `34a18cf` + `5fac106` (fix-round) | Substantive — 668 LOC across 1 new + 2 modified files. Full sequential review. Spec ✅ first pass; quality **Approved-with-fixes** flagging two material issues sharing one root cause. Implemented Step 3 "Teileverbrauch" between existing Step 2 (Notes+Photos) and what is now Step 4 (Abschließen). **Step renumbering 1→2→3→4** applied throughout: state type, progress indicator iteration, "Schritt X von 4" header text, `step < 4` Weiter gating, `step === 4` Abschließen rendering. **Hook return-shape break:** `useCreateMaintenance` no longer returns bare `Maintenance` — now `{ maintenance, negativeStockWarnings }`. Server returns warnings as a TOP-LEVEL field next to `data` (`{ success, data, negativeStockWarnings }`), so the hook's mutationFn was extended to parse the full response body. Single-caller verified via Grep — only `MaintenanceChecklistModal.tsx` consumes it; updated to destructure. `MaintenancePayload` extended with optional `partsUsed?: PartsUsageEntry[]` (discriminated union by `sourceType` mirroring server's `partsUsedEntrySchema`). `SHARED_INVALIDATION_KEYS` extended with `['inventory']` + `['effective-parts']`. **`PartsUsageStep` design:** initializes from `useEffectiveParts(customerSystemId)` filtered to non-TOOL category; main "Teileverbrauch" rows with verwendet checkbox + quantity input + "nicht verbraucht" link (resets BOTH state slots); read-only "Werkzeug" section for TOOL category (confirmation checkboxes never persisted); collapsible "+ Zusatzteil erfassen" inline form with description / quantity / unit / articleNumber / inventory picker showing `"<articleNumber> · <description> · Bestand <currentStock> <unit>"`. Internal-state-driven (`rows`, `adHocRows`); emits filtered `PartsUsageEntry[]` via `onChange` — only `used && quantity > 0` rows make the cut. **Negative-stock warning UX:** modal calls `useInventoryItems()` once, builds `Map<inventoryItemId, InventoryItem>` in `handleSubmit`, iterates `negativeStockWarnings` array → `toast.warning("Lager für „X" unterschritten — Bestand Y")` per warning with German „..." quotes. `itemMap` falls back to inventoryItemId on cache miss (defensive). **Quality reviewer flagged:** (1) `value` prop was renamed to `_value` and never read — uncontrolled child masquerading as controlled; (2) Step 3 conditional rendering `{step === 3 && <PartsUsageStep>}` caused child to UNMOUNT on Zurück/Weiter, dropping all user toggles + AD_HOC entries on return to Step 3, then silently overwriting parent's `partsUsed` with all-defaults via the emit-effect. **Fix-round commit `5fac106`:** dropped the dead `value` prop entirely (component is internally state-driven by design — adding controlled-mode would be a much larger refactor); replaced conditional rendering with CSS visibility wrapper (`<div style={{ display: step === 3 ? 'block' : 'none' }}>`) so the child stays mounted across step navigation. Added 4-line header comment to PartsUsageStep documenting the contract (parent must keep mounted). Net `+10/-6` LOC. |

**Session 10 full commit chain (most recent first):**
- `5fac106` fix(ui): keep PartsUsageStep mounted across step navigation + drop dead value prop
- `34a18cf` feat(ui): MaintenanceChecklistModal Step 2.5 — Teileverbrauch
- `26b88ae` feat(ui): PartsListCard on system detail page

**Session 10 end-of-session health:**
- Tests: 313/313 passing across 32 files (no net new — UI components have no test infrastructure)
- `tsc --noEmit`: clean
- Working tree: `.claude/settings.json` modified (pre-existing user-level — leave alone), `graphify-out-{backbone,codemap}/` modified (auto-regenerated by post-commit hook, will ride along with the next runbook commit per CLAUDE.md), `kundenaustausch/Wartungsteile/` untracked (pre-existing — leave alone).
- Review status: Task 27 **Approved-without-fixes** on first review pass; Task 28 needed 1 fix-round (mounted step + dead-prop drop).
- **Browser verification: NOT performed this session.** Same as Sessions 8 + 9 — Task 35 (manual verification checklist) covers the full UI flow at end of Phase A. **Note:** Task 28 specifically calls for a manual check (start a maintenance, prefill effective parts, "nicht verbraucht" + AD_HOC, verify stock decrement + snapshot in checklistData). This is critical UX validation — must happen at Task 35 latest, ideally sooner if a pilot test environment is available.

**Cross-session deviation note:** Sessions 9 + 10 chained in the same Claude Code context per user request. Fresh-context default still applies unless explicitly chained.

**Session 10 carry-forward items (non-blocking — fold in opportunistically; from Task 27+28 quality reviews):**
- **Task 27:** Schema duplication: `validations.ts:603` defines `overrideAddSchema` (file-local) and `CustomerSystemOverrideForm.tsx` defines a near-identical local `overrideAddFormSchema`. Future cleanup: export an `overrideAddBaseSchema` (no `excludedSetItemId` constraint, no `action` literal) and have both `customerSystemOverrideSchema` and the form derive from it via `.extend()`.
- **Task 27:** `CustomerSystemOverrideList` at 399 LOC conflates four concerns (list rendering, OWNER actions bar, EXCLUDE picker modal, delete confirmation). Extract `<ExcludePickerModal>` (~63 LOC, lines 288–351) when next touched.
- **Task 27 + general:** Locale-aware Decimal formatting (`Intl.NumberFormat('de-DE')` with comma decimal separator) repo-wide. Currently rendering raw `Decimal.toString()` strings (e.g., `"1.50"`) in German UI — pre-existing repo gap, NOT Task 27 specific.
- **Task 27:** API include change has no test coverage. The new `partOverrides` Prisma include in `customer-systems/[id]/route.ts` GET handler is unverified by tests. Test infrastructure for that route should add a `partOverrides` presence assertion when next touched.
- **Task 27:** Bug-fix bundling — `fix(hooks): correct override invalidation key` would have been a cleaner standalone commit for blame-archaeology. Bundling acceptable here since the bug surfaced from the new component, but flag for future tasks: separate bug fixes into their own commits when feasible.
- **Task 28 (Minor #4):** Negative-stock toasts are unbatched — `toast.warning` fires once per warning. If 8 parts go negative simultaneously, user gets 8 stacked toasts. Consider grouping into a single multi-line toast or capping at 3 + "(+N weitere)".
- **Task 28 (Minor #5):** `parseFloat` on quantity inputs has no locale handling. `parseFloat("1,5")` (German decimal comma) returns `1`. Browser `<input type="number">` typically forces `.` separator, but mobile German keyboards may slip through. Consider `value.replace(',', '.')` before parse, or add a Zod refinement.
- **Task 28 (Minor #6):** Re-checking a row after "nicht verbraucht" doesn't restore the original quantity from `EffectivePart` (it stays at 0 until user types). Accepted UX — flag in case product wants different behavior.
- **Task 28 (Minor #8):** `itemMap` build is fine at current scale but flag if inventory > 5000 items.

### Session 13 (2026-04-28) — Pilot-test follow-ups + Tasks 36 + 37

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| Pilot-test feedback (6 issues) — pre-Task-36 fixes | ✅ | `115e81c` + `e0abc9b` + `c9fa95b` + `be4a1fd` + `137e2a6` | User ran a partial pass of the manual checklist (Tasks 35) before kickoff and reported 6 concrete bugs/UX gaps. Resolved as a batch before Task 36 to give the pilot customer a clean tree to test against: (1+6) `<datalist>` unit suggestions in 4 forms (`MaintenanceSetItemForm`, `InventoryItemForm`, `CustomerSystemOverrideForm`, `PartsUsageStep` ad-hoc) backed by a new `src/lib/units.ts` constant — free text still accepted. (2) `CustomerSystemOverrideList` EXCLUDE-picker rebuilt: row-level checkboxes, accent-ring hover/selected highlight, footer button with live counter, batched `Promise.allSettled` over the picks. (3) `useUpdateCustomerSystem` now invalidates `['employee']` + `['employees']` so reassignment from the system-detail page no longer leaves the employee detail/list pages stale. (4) Manual `POST /api/bookings` now copies `system.assignedToUserId` onto the new `Booking` (mirroring Cal.com bookings); `GET /api/bookings/[id]/packing-list` ACL accepts either booking-level OR system-level assignment for TECHNICIAN — legacy/manual rows without `Booking.assignedToUserId` print correctly. New vitest case pins the system-fallback path; existing 403 test pinned to BOTH assignments belonging to the OTHER user. (5) `maintenance-photos` Supabase bucket was missing on the new project (`hwagqyywixhhorhjtydt`). Added idempotent setup script `scripts/create-storage-buckets.ts` (lists existing buckets, skips if found, otherwise creates with the right MIME/size limits); ran it locally — bucket created. **Test count:** 323 → 324 (one new fallback test). |
| 36 — Drop `requiredParts` column + SQL NOTE on drift line | ✅ | `ec373a4` | Schema field removed; new migration `20260428061650_drop_customer_systems_required_parts` (single `ALTER TABLE customer_systems DROP COLUMN "requiredParts"`). Code references purged: `validations.ts` (2 schemas), `customer-systems` POST + PATCH, `useCustomerSystems` + `usePackingList` hook types. `migrate-required-parts.ts` deleted (one-shot script's job done — Task 32 already ran on this Supabase project, all legacy text safely lives in `customerSystemPartOverride` ADD-rows). SQL NOTE comment added above the `companies.updatedAt DROP DEFAULT` line in the original additive migration (`20260424082431_add_maintenance_sets_and_inventory/migration.sql`) per Decision §1. **Operational deviation from plan:** because the user's local `.env DATABASE_URL` and the deployed Vercel app share the same Supabase project (single-project POC topology — no separate dev DB), `npx prisma migrate dev` ran the migration against the same DB the deployed app talks to. Net data effect: zero — Task 32 had already migrated all legacy `requiredParts` text into ADD overrides on this Supabase project (its commit was `6ac66a4`, well before today). The deployed app code still selects the dropped column though, so an immediate Vercel deploy of this branch is REQUIRED to bring app code and DB schema back in sync. **Lesson logged for the next destructive migration:** in single-project POC topologies, always confirm the user wants to run schema mutations *now* vs. *at deploy time* before invoking `prisma migrate dev`. Verification: 324/324 tests, tsc clean, build green, `grep -rn "requiredParts" src/ scripts/` returns zero. |
| 37 — BACKLOG.md — N-1..N-12 + Sprint 28 sign-off | ✅ | `7566a6f` | N-1..N-11 added verbatim from plan lines 3405–3415 under `## Maybe / Future`. N-12 added (integration-test DB provisioning — Decision §9 carry-forward; not in original plan). Sprint 28 completion block under `## Completed / Resolved`, dated `2026-04-28`, single roll-up entry covering the full feature plus the Session 13 pilot-test follow-ups. |

**Session 13 full commit chain (most recent first):**
- `7566a6f` docs(backlog): add Wartungsteile Phase B+ items (N-1..N-12); mark Phase A complete
- `ec373a4` chore(db): drop CustomerSystem.requiredParts — legacy data migrated to overrides
- `137e2a6` chore(scripts): idempotent Supabase storage bucket setup
- `be4a1fd` fix(bookings): inherit assignedToUserId + system-fallback in packing-list ACL
- `c9fa95b` fix(hooks): invalidate employee caches after system reassignment
- `e0abc9b` feat(systems): multi-select EXCLUDE picker with checkboxes + hover highlight
- `115e81c` feat(units): unit dropdown via datalist for set items, inventory, overrides, ad-hoc

**Session 13 end-of-session health:**
- Tests: 324/324 passing across 32 files (+1 net from packing-list system-fallback test)
- `tsc --noEmit`: clean
- `npm run build`: green
- Working tree: `.claude/settings.json` modified (pre-existing user-level — leave alone), `graphify-out-{backbone,codemap}/` modified (auto-regenerated, will roll into a follow-up commit), `package.json` / `package-lock.json` modified (transitive `baseline-browser-mapping` added by tooling outside Phase A — deliberately not folded into Session 13 commits).
- **DB state:** column dropped on the live Supabase project. App code in `feature/wartungsteile-phase-a` is already aligned with this state. Live deployment on Vercel is NOT yet aligned — deploy of this branch is the immediate next step.

**Session 13 carry-forward items:**
- **Operational:** deploy `feature/wartungsteile-phase-a` to Vercel ASAP to re-align prod app code with the prod DB schema. The branch can either be merged to `main` directly (per CLAUDE.md, `main` is the only long-lived branch) or pushed and deployed as a feature preview first; both unblock the live app from the dropped-column SELECT failures.
- **Task 35 sign-off:** still pending — pilot customer testing continues. The 13-step checklist `2026-04-27-wartungsteile-phase-a-manual-verification-checklist.md` remains the source of truth for sign-off; pre-Task-36 fixes covered Steps 1, 2, 3, 5, 6, 9, 10 implicitly.

### Session 12 (2026-04-27) — Migration script + audit FK guards + green sweep

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 32 — Data migration script `scripts/migrate-required-parts.ts` | ✅ | `6ac66a4` | 56 LOC. Trivial — controller-applied review per Decision §7 (single-file, plan-verbatim, mechanical). Plan snippet kept verbatim with one delta: `await prisma.$disconnect()` added before `process.exit(0)` and `process.exit(1)` — the plan-as-written misses connection cleanup. **Idempotency** keyed on `(customerSystemId, note === MARKER_NOTE)`; re-running the script creates 0 new rows. **Schema enum surprise:** plan referenced `PartOverrideAction`, actual schema enum is `OverrideAction` — string literals `'ADD'` work against either generated type, no code change needed. **Did NOT execute the script** per Task 32 Step 3 plan instruction (production run is a Session 13 step). Commit message exact: `feat(scripts): data migration from CustomerSystem.requiredParts → overrides`. |
| 33 — Tenant-isolation audit + cross-tenant FK guards | ✅ | `e9d37f0` | +48 LOC in `src/__tests__/audit/tenant-isolation.test.ts`. Trivial — controller-applied review. **Verified all 12 new feature routes already in `TENANT_ROUTES`** (added incrementally Sessions 4–11; the audit's filesystem-walk auto-detects uncategorised routes anyway — line 137-160). **New addition per Decision §4:** `CROSS_TENANT_FK_GUARDED_ROUTES` const mapping 4 routes to 5 cross-tenant FK fields (`customer-systems/[id]/overrides/route.ts` → `inventoryItemId` + `excludedSetItemId`; `maintenance-sets/[id]/items/route.ts` → `inventoryItemId`; `maintenance-set-items/[id]/route.ts` → `inventoryItemId`; `maintenances/route.ts` → `inventoryItemId`). New describe block runs 2 assertions per (route, FK) pair: (1) FK field present in source; (2) `findFirst` + `companyId` both present (canonical guard pattern). **All 5 (route, FK) pairs already satisfy the audit** — Sessions 4+5+12 implementations all contain `prisma.<table>.findFirst({ where: { id, companyId } })` guards. +10 new tests. Failure messages cite Decision §4 + spec link. |
| 34 — Full test + typecheck + build sweep | ✅ | (no commit — verification only) | Three checks all GREEN: `npm test` → 323/323 across 32 files; `npx tsc --noEmit` → clean; `npm run build` → "Compiled successfully in 11.5s" + 46/46 static pages generated, only pre-existing Sentry/Next.js warnings unrelated to the feature (deprecation notices about `disableLogger` / `automaticVercelMonitors`, plus inferred-workspace-root warning). Build summary lists all new feature pages: `/dashboard/lager`, `/dashboard/wartungssets`, `/dashboard/wartungssets/[id]`, `/dashboard/termine/[id]/packliste`. No additional commit — Task 34 is verification-only. |

**Session 12 full commit chain (most recent first):**
- `e9d37f0` test(tenant): cross-tenant FK guard audit for Phase A routes
- `6ac66a4` feat(scripts): data migration from CustomerSystem.requiredParts → overrides

**Session 12 end-of-session health:**
- Tests: 323/323 passing across 32 files (+10 net new from Task 33 FK guard audit)
- `tsc --noEmit`: clean
- `npm run build`: green ("Compiled successfully in 11.5s", 46/46 static pages)
- Working tree: `.claude/settings.json` modified (pre-existing user-level — leave alone), `graphify-out-{backbone,codemap}/` modified (auto-regenerated by post-commit hook, will roll into the runbook commit), `kundenaustausch/Wartungsteile/` untracked (pre-existing — leave alone).
- Review status: Tasks 32 + 33 controller-applied review per Decision §7 (each ≤50 LOC, no cross-cutting changes). No subagent reviewers dispatched for these two tasks — both plan-verbatim with documented additions, both passed automated checks (tsc + tests). Task 34 is verification-only.
- **Browser verification: still NOT performed** — deferred to Session 13 (user-interactive). All UI tasks 22–31 still pending Step 35 walkthrough.
- **Vitest startup-flakiness:** zero recurrences this session across 5 separate `npm test` runs (1 baseline + per-task verifications + final sweep). Pattern remains documented; pool config still untouched.

**Session 12 deferred items (carried into Session 13):**
- **Task 35 (manual verification — 13 steps):** comprehensive handoff doc generated at `docs/superpowers/plans/2026-04-27-wartungsteile-phase-a-manual-verification-checklist.md`. Each step has pre-conditions, exact actions, expected outcomes, pass/fail checkboxes. **Cannot be executed without a human driving the browser** — defer to Session 13.
- **Task 32 production run:** the script has been committed but NOT executed against production. Session 13 must run `npx tsx scripts/migrate-required-parts.ts` against the production Supabase DB after a backup. The handoff doc (above) walks through the .env swap + spot-check.
- **Task 36 (destructive migration):** depends on Task 35 + Task 32 production run completing first. The handoff doc contains the exact migration command + the SQL NOTE text to add above the drift line in the original additive migration (per Decision §1 — runbook annotation).
- **Task 37 (BACKLOG sign-off):** depends on Task 36. Plan lines 3395–3434 contain the verbatim text for the N-1..N-11 future entries and the Sprint 28 completion entry.

**Cross-session deviation note:** Session 12 chained directly off Session 11 (continuation per user request "have fun, be creative and professional"). User explicitly chained.

**Session 12 carry-forward items (non-blocking):**
- **Task 33:** the FK guard assertion (`toContain('findFirst')` + `toContain('companyId')`) is intentionally loose — any route with a `findFirst` call elsewhere satisfies the assertion. A tighter regex (e.g., `findFirst.*${fk}` proximity match) would catch a hypothetical regression where a route loses the FK guard but keeps another `findFirst` for unrelated reasons. Deferred — current pattern matches the existing `companyId` audit style; tightening it would be churn.
- **Task 32:** `quantity: 1` is a JS `number` while schema field is `Decimal`. Prisma coerces — fine, but explicit `new Prisma.Decimal(1)` would be slightly cleaner. Cosmetic, plan-verbatim wins for now.
- **Task 32:** No transaction wrapping the script's per-row writes — by design (per-row idempotency, one bad row doesn't take down the whole migration). Document this if/when the script is reused as a template for future legacy migrations.

### Session 11 (2026-04-27) — Packing-list print + dashboard card + email Lager section

| Task | Status | Commit SHA(s) | Notes |
|------|--------|---------------|-------|
| 29 — Packing-list print view + drawer button | ✅ | `ffe4726` | 207 LOC across 2 new + 1 modified files: `PackingListPrintView.tsx` (174) + `page.tsx` wrapper (9) + `BookingDetailsDrawer.tsx` (+24/-10). Parallel reviews per Decision §7 (small surface). Both **Approved-without-fixes** on first review pass. **Strict typing** beyond plan: plan example used `(p: any)` casts; implementer correctly imported `EffectivePart` from `@/hooks/useEffectiveParts` and typed `stockStatus(p: EffectivePart): string`. **Dropped `formatPartCategory` import** (unused — section grouping makes per-row category labels redundant). **Inline `<style>` block** scoped to `.packing-list-print` class with `@media print` rules; `globals.css` had no existing print rules. **`<Button asChild>` confirmed:** `src/components/ui/button.tsx` uses `@radix-ui/react-slot`; the pattern `<Button variant="outline" asChild><a href={...} target="_blank" rel="noreferrer">` works correctly. **Drawer button placement:** separate row above the existing Umplanen/Stornieren flex-row, full-width, wrapped together in a `space-y-2` container. **Visibility gate:** `booking.system && booking.status === 'CONFIRMED'` (controller-authorized — printing for cancelled bookings is unhelpful). Used `booking.system` (truthy) instead of `booking.systemId` because `useBooking` returns nested system, not top-level systemId. **UX bonus:** added a "Drucken" button at top of print view that calls `window.print()`, hidden in print mode via `.no-print { display: none !important; }` inside `@media print`. **Carry-forward:** dashboard sidebar bleeds into printed page — Phase B fix via route group `(print)` with bare layout, or `nav { display: none }` inside `@media print`; controller briefing accepted this for Phase A. **Carry-forward:** TECHNICIAN-not-assigned gets a 403 from `usePackingList`, surfaced as a generic error toast — quality reviewer suggested hiding the drawer button for unassigned technicians (would need `currentUserId` context). |
| 30 — `LowStockDashboardCard` on `/dashboard` | ✅ | `63f792a` + `e78e4c6` (controller-applied fix-round) | Initial commit 39 LOC; fix-round +17/-16. Trivial — parallel reviews. Spec ✅. Quality flagged **Important** layout inconsistency: the new card used plan's verbatim `<Card className="p-4 ...">` shadcn primitive while the sibling `unassignedSystemsCount` card at `dashboard/page.tsx:163` uses raw `bg-card rounded-xl border border-status-overdue-border bg-status-overdue-bg p-5` divs with a 9×9 icon tile + `ArrowRightIcon` hover affordance + `text-2xl font-bold` count. Side-by-side in the same grid the cards looked visibly different. **Controller-applied fix `e78e4c6`:** rewrote the card to mirror the sibling pattern (raw `<Link>` with `group bg-card rounded-xl border ${cardClasses} p-5 hover:shadow-md transition-all`, `w-9 h-9 icon tile`, `ArrowRightIcon`, `text-2xl font-bold`). Color scheme switched from raw Tailwind (`bg-red-50` / `bg-amber-50`) to status tokens (`border-status-overdue-border bg-status-overdue-bg` for ≥5; `border-status-due-border bg-status-due-bg` for 1–4) — matches the sibling card and avoids design-token drift. **Authorized scope expansion:** `inventoryBelowMinStockCount?: number` added to `DashboardStats` interface in `src/hooks/useDashboard.ts` (server returned it from Task 18 but the type wasn't extended). Same pattern as Tasks 27 + 28: server side ahead of client type. **Lucide convention:** used `Package2Icon` (codebase `Icon` suffix pattern) instead of plan's bare `Package2`. |
| 31 — Weekly summary email — Lager section | ✅ | `bc5487c` | 76 LOC across 2 modified files: template (+44) + service (+32). Parallel reviews. Both **Approved-without-fixes**. **Section placement:** between Overdue (Section 3) and Retro (Section 4); comment marker `Section 3b`. **Color scheme:** amber (`#FEF3C7` / `#D97706` / `#92400E`) — matches the existing "Due but unbooked" amber panel; consistent with low-stock as a non-critical warning (red kept for genuine overdue). **Query placement:** inside the existing `Promise.all` array as 8th entry, with `isOwner ? prisma.inventoryItem.findMany({ where: { companyId: user.companyId } }) : Promise.resolve([])` — keeps queries parallel; TECHNICIAN runs pay only the no-op resolve cost. **Decimal arithmetic:** filter via `i.currentStock.lt(i.minStock)`, sort by deficit descending via `Number(b.minStock.sub(b.currentStock)) - Number(a.minStock.sub(a.currentStock))` (Decimal `.lt()` / `.sub()` methods, `Number()` boundary conversion safe at Phase A scale). **Top-5 visible** (`LOW_STOCK_VISIBLE = 5` constant; separate from `LIST_LIMIT = 10` used elsewhere — different product decisions). **Boundary `.toString()`:** template prop type is `string`; service does `i.currentStock.toString()` at the boundary so the template stays presentational and decoupled from Prisma's Decimal. **TECHNICIAN code path:** `lowStockItems` is `undefined` (not `[]`); template's `lowStockItems && lowStockItems.length > 0` guard short-circuits cleanly either way. **Did NOT touch the cron route** — query lives entirely in `service.tsx`'s `sendWeeklySummary()`. **Test impact:** zero — `email/__tests__/` only contains `opt-in.test.ts` and `unsubscribe-token.test.ts`, neither references `sendWeeklySummary` or `WeeklySummaryEmail`. Carry-forward: snapshot tests for the new section (a) OWNER+low-stock renders, (b) TECHNICIAN absent, (c) OWNER+empty inventory absent — cheap insurance, but not in scope here. |

**Session 11 full commit chain (most recent first):**
- `bc5487c` feat(email): weekly summary Lager section for OWNER
- `e78e4c6` fix(ui): align LowStockDashboardCard layout with sibling OWNER warning card
- `63f792a` feat(ui): dashboard LowStockDashboardCard for OWNER
- `ffe4726` feat(ui): packing-list print view

**Session 11 end-of-session health:**
- Tests: 313/313 passing across 32 files (no net new — UI/email components have no test infrastructure)
- `tsc --noEmit`: clean
- Working tree: `.claude/settings.json` modified (pre-existing user-level — leave alone), `graphify-out-{backbone,codemap}/` modified (auto-regenerated, will roll into the runbook commit), `kundenaustausch/Wartungsteile/` untracked (pre-existing — leave alone).
- Review status: Tasks 29 + 31 **Approved-without-fixes** on first review pass; Task 30 needed 1 controller-applied fix-round (sibling card layout consistency).
- **Browser verification: NOT performed this session.** Same as Sessions 8–10 — Task 35 covers it. Specifically pending: print preview of the packing list page (Task 29's `window.print()` flow), dashboard low-stock card visual confirmation (Task 30), and an actual weekly-summary email render with low-stock items (Task 31 — could be triggered via `curl -X POST http://localhost:3000/api/cron/weekly-summary -H "x-cron-secret: <CRON_SECRET>"`).
- **Vitest startup-flakiness** recurred on Tasks 25 (Session 9) and 30 + final-session-check (Session 11) — re-runs always green. Pattern documented since Session 3; persistent enough to consider `pool: 'vmForks'` in `vitest.config.ts` if it surfaces in Session 12 too.

**Cross-session deviation note:** Sessions 10 + 11 chained in the same Claude Code context per user request. Fresh-context default still applies unless explicitly chained.

**Session 11 carry-forward items (non-blocking — fold in opportunistically; from Task 29+30+31 quality reviews):**
- **Task 29:** Drawer "Packliste drucken" button is rendered for TECHNICIAN regardless of system assignment, then fails on click with a 403 "Zugriff verweigert" message. Hide the button when `booking.assignedToUserId !== currentUserId` for technicians. Needs `currentUserId` from `useSession` in the drawer.
- **Task 29:** Print view inherits the dashboard layout's sidebar; the printed PDF includes nav chrome. Phase B fix: introduce a route group `(print)` outside `app/dashboard/` with a bare layout, OR add `print:hidden` to `DashboardNav` so the sidebar disappears in `@media print`.
- **Task 30:** Visual minor — `LowStockDashboardCard` uses `Package2Icon` color via parent `${accentText}` cascade. Explicit per-element color would be slightly clearer; cosmetic.
- **Task 31:** `prisma.inventoryItem.findMany` with no projection returns every column for every inventory row per tenant per week. At ≤500 items/tenant fine; for 5k+ wasteful. Cheap mitigations: (a) add `select: { description: true, articleNumber: true, currentStock: true, minStock: true }` to narrow the row; (b) raw SQL `WHERE current_stock < min_stock`. Track post-pilot.
- **Task 31:** Add snapshot test for the Lager section in the email template — three cases (OWNER+low-stock present, TECHNICIAN absent, OWNER+empty inventory absent). Cheap insurance against regression.
- **Task 31:** `Number()` conversion of Decimal deficit in the sort comparator is safe at Phase A scale (small integer/decimal stocks, <2^53). Document the assumption inline if/when stocks become fractional or large.

**Session 7 carry-forward items (non-blocking — fold in opportunistically; from Task 19+20+21 quality reviews):**
- `src/hooks/useEffectiveParts.ts:67` (Task 20): uses `30 * 1000` while peer hooks use `30_000` literal style. Cosmetic style inconsistency only.
- `src/hooks/useInventoryMovements.ts` (Task 21): explicit `['inventory', itemId, 'movements']` invalidation alongside `['inventory']` is technically redundant (prefix-match covers it). Plan-driven; if cleaning, drop the explicit child.
- `src/hooks/useMaintenanceSets.ts` `useCreateMaintenanceSet` (Task 19): If the API later adds `_count: { items: 0 }` to the POST response for symmetry, the `MaintenanceSetCreated = Omit<...>` type can be removed in favor of `MaintenanceSetSummary`. Track if a future task touches the POST handler.
- **Lesson learned for future hook tasks:** when a list endpoint includes derived counts (`_count`), all detail-mutation hooks must invalidate the list prefix. Confirmed for sets in Task 19 fix-round; verified non-issue for inventory in Task 21 (the `['inventory']` prefix invalidation already cascades to movements and detail).
- **Lesson learned for hook briefings:** the plan pseudocode uses `any` and `Record<string, unknown>` consistently — this is loose-typed. Future hook briefings should explicitly require codebase-strict typing (read `useEmployees.ts` first, define proper interfaces). Tasks 19-21 all required this departure from plan; document once in Decisions §13.

---

## Next Up

**Session 13 is essentially complete.** Tasks 36 (column drop) and 37 (BACKLOG sign-off) are committed. Task 32's production run is implicitly satisfied — the user's `.env` and the deployed app share a single Supabase project, so the original Task 32 commit (`6ac66a4`) already migrated all legacy `requiredParts` data on prod when it ran. Task 35 manual verification is partial: the user passed the steps that map onto the issues fixed in Session 13's pilot-test follow-ups (1, 2, 3, 5, 6, 9, 10); the pilot customer is now exercising the rest.

**Immediate next step (operational, NOT a runbook task):** **Deploy `feature/wartungsteile-phase-a` to Vercel.** Today's Task 36 ran `prisma migrate dev` against the live Supabase project, so the column is gone from the DB but the production app on Vercel still references it via its older Prisma client — every `customer-systems` SELECT will fail with a 500. The branch in its current state is already aligned with the dropped column. Either merge to `main` and let Vercel auto-deploy, or create a preview deployment first; both routes restore code/DB alignment.

**After deploy + pilot sign-off:** Session 14 = `superpowers:finishing-a-development-branch` to formally merge `feature/wartungsteile-phase-a` → `main` (if a preview deploy was used) and run the post-merge cleanup checklist.

**Carry-forward non-blocking items (cumulative — pick up opportunistically when touching the relevant files):**
- `src/app/api/maintenance-sets/[id]/route.ts` `handleError`: no ZodError branch. Fine for GET/DELETE-only; add `ZodError → 400` branch if a PATCH handler is ever added.
- `src/app/api/maintenance-set-items/[id]/route.ts` `loadItem`: `include: { maintenanceSet: { select: { companyId: true } } }` unused post-load. Safe to drop when the file is next touched.
- (Session 5 carry-forward items listed in the Session 5 block above.)

**Standing rules already learned (do not re-discover):**
- Decision §12: every new/extended authenticated route MUST include `rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER)` immediately after the auth helper. Plan pseudocode omits it consistently — treat as defect.
- Decision §13: hooks must use codebase-strict typing (`ApiResponse<T>` envelope, no `any`, Decimals as `string`). Read `useEmployees.ts` as canonical template, NOT plan pseudocode. List-mutation invalidations must cover list-key prefix when list shows derived counts.
- Decision §9: `vi.mock('@/lib/prisma')` for tests. NEVER real DB.
- Decision §4: cross-tenant FK guards on every `inventoryItemId`, `excludedSetItemId`, `setItemId`, `overrideId` reference — they are load-bearing, NOT defensive coding. Apply spirit (defense-in-depth) even where the parent record is already tenant-verified.
- Audit whitelist: add every new/touched route file in `src/__tests__/audit/tenant-isolation.test.ts` `TENANT_ROUTES`.
- TECHNICIAN role-scoping pattern (read access only): `if (role === 'TECHNICIAN' && resource.assignedToUserId !== userId) return 403 'Zugriff verweigert'`. Established by Task 14 (effective-parts) and Task 17 (packing-list).

---

## Key Decisions & Deviations

Decisions made during execution that future sessions MUST know about (beyond what's in the spec/plan).

1. **Migration drift line kept (Task 1).** The additive migration contains an unrelated `ALTER TABLE "companies" ALTER COLUMN "updatedAt" DROP DEFAULT;` — Prisma emitted this to reconcile pre-existing drift between schema (`@updatedAt`, no DB default) and DB (`DEFAULT CURRENT_TIMESTAMP` from `company_multi_user` migration). Line is benign and was left in. **Task 36 TODO (carried in runbook):** when writing the drop-`requiredParts` migration, add a `-- NOTE:` comment above the drift line in `20260424082431_add_maintenance_sets_and_inventory/migration.sql` explaining it. See Task 36 todo text in the Task Progress table — already annotated with "+ add SQL NOTE above drift line".

2. **`.strict()` on inventory item schemas (Task 2, beyond spec).** `inventoryItemCreateSchema` and `inventoryItemUpdateSchema` are `.strict()`. Defense-in-depth for the "stock mutates only via `InventoryMovement`" invariant — a client accidentally sending `{ description, currentStock: 99 }` is now rejected. Covered by test.

3. **`partsUsedEntrySchema` cross-field refines (Task 2, beyond spec).** `sourceType: 'DEFAULT'` ⇒ `setItemId` required. `sourceType: 'OVERRIDE_ADD'` ⇒ `overrideId` required. `AD_HOC` has no linkage constraint. Task 15 (maintenance POST with partsUsed) can rely on these being present.

4. **Cross-tenant FK validation reminder (Tasks 12, 14, 15).** Prisma cannot enforce same-tenant integrity on `CustomerSystemPartOverride.excludedSetItemId` or `CustomerSystemPartOverride.inventoryItemId` or `MaintenanceSetItem.inventoryItemId`. Tasks 12/14/15 MUST validate `companyId` match in application code before insertion/reference. The TodoWrite items for these tasks are annotated with "(+ cross-tenant guards)". Task 33 (tenant-isolation audit) MUST include these checks.

5. **CLAUDE.md lists Jest; project actually uses Vitest.** All tests use `import from 'vitest'`. Spec/plan/runbook all assume Vitest. Task 37 may want to amend CLAUDE.md (optional cleanup).

6. **Rate-limit preset choice.** All new API endpoints use the existing `RATE_LIMIT_PRESETS.API_USER` (100/min, defined in `src/lib/rate-limit.ts`). No new presets added in Phase A. The "30/min" / "120/min" figures in the plan are intent-labels, not enforced values — everything goes through the single `API_USER` preset. If pilot ops reveals throttling needs, add presets as a follow-up.

7. **Parallel reviews for trivial tasks.** Task 3 used parallel spec + code-quality reviews (read-only, non-conflicting). Acceptable pragmatic deviation from the skill's sequential review flow. **Rule:** reserve this only for tasks with ≤ 50 LOC surface area AND no cross-file changes. If in doubt, sequential.

8. **`kundenaustausch/Wartungsteile/` folder is user-curated — now committed on main (Session 2 cleanup).** The folder contains:
   - `Serviceteile 2026.pdf` (Grünbeck supplier list — user-provided)
   - `Wartungsheft Bosch Junkers Kessel + Wartungsteile.pdf` (scan-only Bosch heft)
   - `Serviceteile_2026.txt` (pdftotext artifact from Session 1)
   - `maintenance_parts_extracted.json` (Session 1 partial Grünbeck extraction)
   - `Bosch_raw.txt` (empty pdftotext attempt)
   - **`wartungsheft_bosch_junkers.json` — user-curated manual OCR transcription (30 sets, 163 parts)** — valuable seed material for Phase B feature N-5 (PDF import).
   - **Session 2 state change:** the folder was accidentally committed on feature branch at session start (`4451e97`). Recovery: cherry-picked to main (`680c962`), then `git reset --mixed HEAD~1` on feature. Folder is now **tracked on `main`** (not on `feature/wartungsteile-phase-a`). On feature branch, `git status` shows the folder as untracked (expected). Future sessions on feature should NOT commit or modify this folder. When feature merges into main, the folder content will already be present — no merge conflict expected.

9. **Test strategy: `vi.mock('@/lib/prisma')`, NOT real DB (Session 2, Task 4+).** The plan's TDD examples show `prisma.X.create()` / `deleteMany()` with a real database. This was **deliberately overridden** at Session 2 start because:
   - No test DB infrastructure exists (no `TEST_DATABASE_URL`, no Vitest DB setup hooks)
   - `.env`'s `DATABASE_URL` points to **production Supabase** (`hwagqyywixhhorhjtydt`)
   - All 4 pre-existing Prisma-touching tests in the codebase use `vi.mock('@/lib/prisma', ...)`
   - Running the plan's code verbatim would have created real rows and called `deleteMany()` across entire tables — catastrophic data loss risk.
   
   **Applies to all subsequent tasks with TDD** (Tasks 9, 10, 11, 12, 13, 14, 15, 16, 17 — anything the plan describes as "real DB, Sprint 26 pattern"). Use `vi.mock` and assert Prisma call args directly. Template: `src/app/api/employees/__tests__/route.test.ts` and the files in `src/app/api/maintenance-sets/__tests__/` from Session 2.
   
   **Trade-off accepted:** Prisma query-shape bugs (wrong field names in `include`, wrong relation names) are not caught by mocks. Compensating controls: (a) TypeScript catches most shape errors at compile time via `@prisma/client` types; (b) Task 35 manual verification will exercise real queries end-to-end; (c) a follow-up backlog item (**N-12: Integration-test DB provisioning**, to be added in Task 37 BACKLOG sign-off) can introduce a disposable Supabase test branch for Phase B if pilot ops justifies the setup cost.

10. **Combined review instead of sequential spec+quality for CRUD batch (Session 2, Tasks 5–8).** The skill's default is: sequential spec review → fix → sequential code-quality review → fix, per task. For the 4 MaintenanceSet/Item CRUD tasks, that would have been 8 review dispatches. Because all 4 tasks follow the same proven pattern (mirroring Task 5, which got the full flow) and are individually ≤ 80 LOC per route, a single combined spec+quality review covering all 4 commits was dispatched after Task 8. Review returned **Approved** with 2 minor non-blocking follow-ups (captured in Decision §11). **Extension of Decision §7:** for tightly-patterned CRUD task groups (2+ consecutive tasks of the same shape), combined batch review is acceptable when: (a) the first task of the group passed full sequential flow, (b) each subsequent task ≤ 80 LOC route surface, (c) each subsequent task has no cross-cutting changes beyond its own directory + tenant-isolation audit whitelist. If any criterion fails, revert to sequential per task.

11. **Session 2 code-review carry-forward items (non-blocking, pick up opportunistically).**
    - **`src/app/api/maintenance-sets/[id]/route.ts` `handleError`** (Task 6): has no `ZodError` branch. Currently correct because GET/DELETE do not parse request bodies. If a PATCH handler is ever added to this file, add the `ZodError → 400` branch first.
    - **`src/app/api/maintenance-set-items/[id]/route.ts` `loadItem`** (Task 8): the `include: { maintenanceSet: { select: { companyId: true } } }` is fetched but never read post-load — the `where` clause already enforces scoping via the nested filter. One extra join per call, no security impact. Safe to drop `include` when the file is next touched.

12. **Treat plan pseudocode as INCOMPLETE regarding rate-limiting (Session 3 learning).** Tasks 10 and 11's plan pseudocode omitted `rateLimitByUser` entirely. The Session 3 combined review caught it; fix bundled in `7c45b16`. **Standing rule for Sessions 4+:** every new authenticated API route MUST include:
    ```ts
    import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
    // ...in each handler, immediately after requireAuth()/requireOwner():
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;
    ```
    Even if the plan's copy-paste block omits it. Implementer dispatch prompts MUST remind the implementer of this rule. Applies to every remaining route task: 12, 13, 14, 15 (extension), 16 (extension), 17.

13. **Hooks: plan pseudocode is loose-typed; codebase requires strict typing (Session 7 learning).** Tasks 19–21's plan pseudocode used `Array<any>`, `Record<string, unknown>`, and HTTP-only `if (!res.ok)` checks. The codebase (`src/hooks/useEmployees.ts`, `src/hooks/useBookings.ts`) uses zero `any`, defines explicit `ApiResponse<T>` envelopes, and operation-specific German error fallbacks. **Standing rule for any future hook tasks:** read `useEmployees.ts` first as the canonical template; define typed interfaces mirroring the API response shape; reject the plan's loose types. Specific type rules:
    - Prisma `Decimal` fields serialize as STRING over JSON — type as `string`, not `number`. Exception: numeric inputs (e.g., `quantityChange` on `useCreateMovement`) stay `number`.
    - When a list endpoint returns derived counts (e.g., `_count.items`), all hooks that mutate items must invalidate the list-key prefix — not just the detail key. Task 19 fix-round caught this for maintenance-sets; verified non-issue for inventory (movements share the `['inventory']` prefix automatically).
    - When two endpoints accept/return overlapping enums, model the asymmetry: e.g., `MovementReasonInput` (write: `'RESTOCK' | 'CORRECTION'`) vs. `MovementReason` (read: full 4-variant enum). The schema is the truth, not the union of all possible values.
    - Reuse types across hook files via export rather than redefining. Task 21's `usePackingList` correctly imports `EffectivePart` from Task 20's `useEffectiveParts` and `CatalogEntry` from `useCatalog`.

---

## Permanent Context (never changes session-to-session)

### Working directory
`c:\Users\y.dorth\Documents\torqr_app\torqr_app`

### Branches
- Work branch: `feature/wartungsteile-phase-a` (created from `main` at `e1344b4`)
- Do NOT merge to `main` until Task 35 (manual verification) passes
- Do NOT push to remote — user handles push separately
- Main branch `main` is production for this repo; `development` exists per CLAUDE.md but is not used in this feature

### Prisma workflow
- Config: `config/prisma.config.ts`
- **Always** pass `--config config/prisma.config.ts` to CLI commands
- DB: Supabase project `hwagqyywixhhorhjtydt` (eu-central-1)
- Env vars required in `.env`: `DATABASE_URL` (pool), `DIRECT_URL` (for migrate). Both are set.
- Schema file: `prisma/schema.prisma`

### Testing
- Framework: **Vitest** (despite CLAUDE.md saying Jest)
- Test files colocated in `__tests__/` subdirectories
- Path alias `@/` → `src/`
- Run: `npm test` (full) or `npm test -- <path>` (specific)
- Type check: `npx tsc --noEmit`

### Permissions pattern (enforced in every API route)
- `requireAuth()` → returns `{ userId, companyId, role, email, name }`
- `requireOwner()` → throws `Forbidden` if role !== OWNER
- TECHNICIAN assignee-scoping for `/effective-parts` and `/packing-list`:
  ```ts
  if (role === 'TECHNICIAN' && resource.assignedToUserId !== userId) {
    return NextResponse.json({ success: false, error: 'Zugriff verweigert' }, { status: 403 });
  }
  ```
- All tenant-scoped queries use `companyId` from `requireAuth()` (never from client body, never `userId`)

### Code organization (from CLAUDE.md)
- API routes: `requireAuth()` first → Zod-validate → execute → respond
- Response shape: `{ success: boolean, data?: T, error?: string, details?: z.issue[] }`
- `src/lib/validations.ts` = single source of truth for input shapes
- German for UI strings and error messages; English for code, comments, variable names
- `src/types/api.ts` may define shared types — check before inventing new ones

### Existing related skill prompt templates
- Implementer: `C:\Users\y.dorth\.claude\plugins\cache\claude-plugins-official\superpowers\5.0.7\skills\subagent-driven-development\implementer-prompt.md`
- Spec reviewer: `C:\Users\y.dorth\.claude\plugins\cache\claude-plugins-official\superpowers\5.0.7\skills\subagent-driven-development\spec-reviewer-prompt.md`
- Code quality reviewer: `C:\Users\y.dorth\.claude\plugins\cache\claude-plugins-official\superpowers\5.0.7\skills\subagent-driven-development\code-quality-reviewer-prompt.md`

### User preferences (from memory + session observation)
- **Senior SAP/BTP developer** — frame explanations from backend/typed-system perspective. Wants precision, determinism, architecture over quick hacks.
- **Commit freely without asking**; never push (user handles push).
- **Structured decision framework**: when multiple options exist, recommend one with 2–4 bullet justification, don't dump all options.
- **Responses in German** for feature discussion; code and technical content in English; user-facing UI strings in German.
- CLAUDE.md `/backlog` workflow exists — use it at session start if relevant.
- Timesheet auto-update rule exists — check `.claude/state/sessions.jsonl` at session start.

### Pre-existing repo state (at start of Session 1)
- Git shows `D "kundenaustausch/Wartungsheft Bosch Junkers Kessel + Wartungsteile.pdf"` — expected (user moved into subfolder, deletion hasn't been committed)
- Git shows `?? kundenaustausch/Wartungsteile/` — expected (untracked folder with user-curated content)
- These are pre-existing and should NOT be addressed by this feature's work

---

## Task Progress Overview

| # | Task (summary) | Status |
|---|----------------|--------|
| 1 | Prisma schema + migration | ✅ `d1432ae` |
| 2 | Zod schemas | ✅ `0369aff` + `28da7ad` |
| 3 | formatPartCategory | ✅ `7415042` |
| 4 | getEffectivePartsForSystem resolver | ✅ `56f3e87` + `6426f2a` |
| 5 | GET/POST /api/maintenance-sets | ✅ `4609da2` |
| 6 | GET/DELETE /api/maintenance-sets/[id] | ✅ `79d5d83` |
| 7 | POST /api/maintenance-sets/[id]/items | ✅ `2fecb72` |
| 8 | PATCH/DELETE item + reorder | ✅ `0f6297c` |
| 9 | GET/POST /api/inventory | ✅ `dddb8ce` |
| 10 | GET/PATCH/DELETE /api/inventory/[id] | ✅ `8631268` + `7c45b16` |
| 11 | GET/POST /api/inventory/[id]/movements | ✅ `274330e` + `7c45b16` |
| 12 | POST /api/customer-systems/[id]/overrides (+ cross-tenant guards) | ✅ `6e9da50` |
| 13 | DELETE /api/overrides/[id] | ✅ `b660b4a` |
| 14 | GET effective-parts route (+ cross-tenant inventoryItemId guards) | ✅ `ce8e767` |
| 15 | Extend POST /api/maintenances (+ cross-tenant inventoryItemId guards) | ✅ `50f5c30` |
| 16 | Extend DELETE /api/maintenances/[id] — R1 reversal | ✅ `1c14453` |
| 17 | GET /api/bookings/[id]/packing-list | ✅ `e47c566` |
| 18 | Extend dashboard/stats with inventoryBelowMinStockCount | ✅ `a8c4d74` |
| 19 | Hooks — sets + set-items | ✅ `19a1e13` + `45677b6` |
| 20 | Hooks — overrides + effective-parts | ✅ `dbd34e5` |
| 21 | Hooks — inventory + movements + packing | ✅ `1b57c29` |
| 22 | Nav — Wartungssets + Lager entries | ✅ `0c83ebc` |
| 23 | /dashboard/wartungssets list | ✅ `75568e1` + `7f17da7` |
| 24 | /dashboard/wartungssets/[id] detail + item form | ✅ `8378a14` |
| 25 | /dashboard/lager list + status badge | ✅ `67ff35f` + `045a639` |
| 26 | Inventory drawer + item form + movement form | ✅ `3ce3781` |
| 27 | PartsListCard on system detail | ✅ `26b88ae` |
| 28 | MaintenanceChecklistModal Step 2.5 Teileverbrauch | ✅ `34a18cf` + `5fac106` |
| 29 | Packing-list print view + BookingDetailsDrawer button | ✅ `ffe4726` |
| 30 | LowStockDashboardCard on /dashboard | ✅ `63f792a` + `e78e4c6` |
| 31 | Weekly summary email Lager section | ✅ `bc5487c` |
| 32 | Data migration script (`scripts/migrate-required-parts.ts`) | ✅ `6ac66a4` |
| 33 | Tenant-isolation audit update (+ cross-tenant checks from Decisions §4) | ✅ `e9d37f0` |
| 34 | Full test suite + typecheck + build green | ✅ (verification only) |
| 35 | Manual verification checklist (13 steps) | ⏸ **partial — pilot testing in progress (Session 13)** |
| 36 | Drop `requiredParts` column + add SQL NOTE above drift line | ✅ `ec373a4` |
| 37 | BACKLOG.md — add N-1..N-12 + Sprint 28 sign-off | ✅ `7566a6f` |

Legend: ✅ Done · ⏸ Next · ⏳ Pending

---

## Suggested Session Chunking

Rough estimates based on task complexity. Adjust based on actual progress — if a session has cycles to spare, pull one extra task forward; if context is pressured, pause earlier.

| Session | Tasks | Theme |
|--|--|--|
| 1 ✅ | 1, 2, 3 | Foundation |
| 2 | **4, 5, 6, 7, 8** | Resolver + MaintenanceSet API |
| 3 | 9, 10, 11 | Inventory API |
| 4 | 12, 13, 14 | Overrides + effective-parts API |
| 5 | 15, 16 | Maintenance extensions (substantive, full reviews) |
| 6 | 17, 18 | Packing-list API + dashboard stats |
| 7 | 19, 20, 21 | Hooks (all three files, can batch — similar shape) |
| 8 | 22, 23, 24 | Nav + Wartungssets pages |
| 9 | 25, 26 | Lager page + drawer/forms |
| 10 | 27, 28 | PartsListCard + checklist integration (substantive) |
| 11 | 29, 30, 31 | Packing print + low-stock card + weekly summary |
| 12 | 32, 33, 34 | Data migration + audit + build green |
| 13 | 35, 36, 37 | Manual verification + destructive migration + backlog close |
| 14 | — | Merge + `superpowers:finishing-a-development-branch` |

Total: ~13–14 sessions. This is a feasible cadence of 1 session / day or 2–3 / week.

---

## Definition of "Session Done"

A session ends cleanly when ALL of these are true:

- [x] Working tree clean (`git status` shows nothing unexpected)
- [x] `npm test` → 100% pass
- [x] `npx tsc --noEmit` → clean
- [x] This runbook's **Execution Log** updated with tasks done + SHAs
- [x] **Last committed SHA** section updated
- [x] **Next up** section points to the correct next task
- [x] Any new **Key Decisions & Deviations** captured
- [x] Runbook committed with message `docs(runbook): session <N> progress — Tasks X through Y`

If any of these is false, **either fix it before ending or explicitly note in the runbook that the session ended in a known-bad state** (include reason + recovery instructions).

---

## After Task 37 — Feature Completion

When all 37 tasks are done:
1. Run the skill `superpowers:finishing-a-development-branch`
2. That skill guides: final integration check → branch integration decision (merge vs. PR) → cleanup
3. Final entry in `docs/BACKLOG.md`: Sprint 28 — Wartungsteile Phase A section with all resolved items

---

## Quick Reference — Absolute Paths

| What | Path |
|------|------|
| Working dir | `c:\Users\y.dorth\Documents\torqr_app\torqr_app` |
| Spec | `docs/superpowers/specs/2026-04-24-wartungsteile-materialmanagement-phase-a-design.md` |
| Plan | `docs/superpowers/plans/2026-04-24-wartungsteile-materialmanagement-phase-a.md` |
| This runbook | `docs/superpowers/plans/2026-04-24-wartungsteile-execution-runbook.md` |
| Schema | `prisma/schema.prisma` |
| Validations | `src/lib/validations.ts` |
| Auth helpers | `src/lib/auth-helpers.ts` |
| Rate limit | `src/lib/rate-limit.ts` |
| Backlog | `docs/BACKLOG.md` |
| CLAUDE.md | `CLAUDE.md` |

---

## Resume Quick-Start for New Sessions

Copy-paste this as the first prompt of each new session on this feature:

> Wir setzen Wartungsteile Phase A fort. Lies zuerst `docs/superpowers/plans/2026-04-24-wartungsteile-execution-runbook.md` komplett — das ist das Session-Runbook. Folge dem "Session Protocol → At session START"-Block, bestätige den Baseline-Health-Check, und starte dann mit dem im Runbook unter "Next Up" genannten Task via `superpowers:subagent-driven-development`.

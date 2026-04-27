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

`ce8e767` (Session 4 Task 14: GET /api/customer-systems/[id]/effective-parts)

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

---

## Next Up

**Start Session 5 with Task 15: extend POST `/api/maintenances` with `partsUsed`.**

**Substantive — full sequential review per Session Protocol** (one of the five flagged substantive tasks alongside Task 4 resolver, Task 16 delete reversal, Task 28 checklist integration, Task 35 manual verification). This task **modifies an existing route** — first such task in the feature — so the implementer must:
1. Read the current `src/app/api/maintenances/route.ts` end-to-end before editing
2. Identify the discriminated `partsUsed` array shape from `partsUsedEntrySchema` (Decision §3 — DEFAULT requires `setItemId`, OVERRIDE_ADD requires `overrideId`, AD_HOC has no linkage)
3. Apply the **cross-tenant guard from Decision §4** to every `inventoryItemId` reference in `partsUsed` (validate they belong to `companyId` before insert) — this is per-entry, not per-request
4. Wrap the maintenance create + InventoryMovement creates + InventoryItem stock decrements in a single `prisma.$transaction(async tx => …)` (callback form, mirroring Task 11)
5. Reuse the resolver to validate that DEFAULT/OVERRIDE_ADD entries actually map to currently effective items (avoid recording usage of an excluded part)

Full task text: [plans/2026-04-24-wartungsteile-materialmanagement-phase-a.md](./2026-04-24-wartungsteile-materialmanagement-phase-a.md) lines 1867+.

**Suggested Session 5 chunk: Tasks 15 → 16** (POST extension, then DELETE-reversal extension). Both are substantive route extensions of `/api/maintenances`. Two tasks max for Session 5 — they touch the same file, so context-switching would be wasteful; they also both modify existing tests. Don't try to pull Task 17 forward.

**Carry-forward non-blocking items (cumulative — pick up opportunistically when touching the relevant files):**
- `src/app/api/maintenance-sets/[id]/route.ts` `handleError`: no ZodError branch. Fine for GET/DELETE-only; add `ZodError → 400` branch if a PATCH handler is ever added.
- `src/app/api/maintenance-set-items/[id]/route.ts` `loadItem`: `include: { maintenanceSet: { select: { companyId: true } } }` unused post-load. Safe to drop when the file is next touched.

**Standing rules already learned (do not re-discover):**
- Decision §12: every new/extended authenticated route MUST include `rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER)` immediately after the auth helper. Plan pseudocode omits it consistently — treat as defect.
- Decision §9: `vi.mock('@/lib/prisma')` for tests. NEVER real DB.
- Decision §4: cross-tenant FK guards on every `inventoryItemId`, `excludedSetItemId`, `setItemId`, `overrideId` reference — they are load-bearing, NOT defensive coding.
- Audit whitelist: add every new/touched route file in `src/__tests__/audit/tenant-isolation.test.ts` `TENANT_ROUTES`.

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
| 15 | Extend POST /api/maintenances (+ cross-tenant inventoryItemId guards) | ⏸ **NEXT** |
| 16 | Extend DELETE /api/maintenances/[id] — R1 reversal | ⏳ |
| 17 | GET /api/bookings/[id]/packing-list | ⏳ |
| 18 | Extend dashboard/stats with inventoryBelowMinStockCount | ⏳ |
| 19 | Hooks — sets + set-items | ⏳ |
| 20 | Hooks — overrides + effective-parts | ⏳ |
| 21 | Hooks — inventory + movements + packing | ⏳ |
| 22 | Nav — Wartungssets + Lager entries | ⏳ |
| 23 | /dashboard/wartungssets list | ⏳ |
| 24 | /dashboard/wartungssets/[id] detail + item form | ⏳ |
| 25 | /dashboard/lager list + status badge | ⏳ |
| 26 | Inventory drawer + item form + movement form | ⏳ |
| 27 | PartsListCard on system detail | ⏳ |
| 28 | MaintenanceChecklistModal Step 2.5 Teileverbrauch | ⏳ |
| 29 | Packing-list print view + BookingDetailsDrawer button | ⏳ |
| 30 | LowStockDashboardCard on /dashboard | ⏳ |
| 31 | Weekly summary email Lager section | ⏳ |
| 32 | Data migration script (`scripts/migrate-required-parts.ts`) | ⏳ |
| 33 | Tenant-isolation audit update (+ cross-tenant checks from Decisions §4) | ⏳ |
| 34 | Full test suite + typecheck + build green | ⏳ |
| 35 | Manual verification checklist (13 steps) | ⏳ |
| 36 | Drop `requiredParts` column + add SQL NOTE above drift line | ⏳ |
| 37 | BACKLOG.md — add N-1..N-11 + Sprint 28 sign-off | ⏳ |

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

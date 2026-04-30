# Design System v3 Adoption — Status Palette + Brand Helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the design-system v3 status palette in production light mode, port two brand-specific type helpers (`.t-wordmark`, `.t-tagline`), and bring `docs/brand_spec/BRAND_SPEC.md` in alignment with the 2026-04-30 design-system handoff.

**Architecture:** Mechanical token swap in the `:root` block of `src/app/globals.css` (12 hex values), additive append of two utility classes outside `@theme`, plus reference-doc sync. No component changes — every status pill in the app already reads from these tokens. Dark mode requires no change (already aligned with bundle target). Bundle reference snapshots are mirrored to prevent drift.

**Tech Stack:** Tailwind CSS v4 (`@theme inline`), pure CSS variables, Vitest for token assertion tests.

---

## Reference Material

- **Spec:** [docs/design-system/DELTA.md](../../design-system/DELTA.md) (Decisions D-1, D-3 confirmed; D-2 no-op)
- **Bundle target:** [docs/design-system/project/colors_and_type.css](../../design-system/project/colors_and_type.css) (canonical v3 token source)
- **Mocks for verification:** [docs/design-system/project/ui_kits/marketing_site/landing.html](../../design-system/project/ui_kits/marketing_site/landing.html), [docs/design-system/project/ui_kits/web_app/dashboard.html](../../design-system/project/ui_kits/web_app/dashboard.html)
- **Brand spec to update:** [docs/brand_spec/BRAND_SPEC.md](../../brand_spec/BRAND_SPEC.md)
- **Production token file:** [src/app/globals.css](../../../src/app/globals.css)

## Out of Scope

- **D-2 fonts** — confirmed no production change. Existing system-stack `'Segoe UI', system-ui, -apple-system, sans-serif` already cascades correctly: Windows → Segoe UI, macOS/iOS → SF Pro, Linux/Android → system default. Bundled TTFs remain in `docs/design-system/project/fonts/` as design-bundle archive only.
- **Dashboard mockup polish** (sidebar inset shadow, role-badge, activity feed, global search, topbar search) — separate plan if/when prioritized.
- **Marketing graph rebuild** — handled in chores after merge.

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/app/globals.css` | Production design tokens | Modify (12 status hex values in `:root` + append `.t-wordmark` + `.t-tagline` outside `@theme`) |
| `src/app/__tests__/design-tokens.test.ts` | Token-value assertion test | Create |
| `docs/brand_spec/BRAND_SPEC.md` | Brand fundamentals reference | Modify (status-color table rows + footnote) |
| `docs/design-system/project/assets/globals.css` | Bundle's verbatim production snapshot | Modify (mirror new production) |
| `.claude/skills/torqr-design-system/assets/globals.css` | Skill copy of the same | Modify (mirror new production) |

---

## Task 1: Set up feature branch + failing token-value test

**Files:**
- Create: `src/app/__tests__/design-tokens.test.ts`

- [ ] **Step 1: Confirm clean main**

Run: `git status`

Expected: `nothing to commit, working tree clean` on `main`.

- [ ] **Step 2: Create + checkout feature branch**

Run:
```bash
git checkout -b feature/design-system-v3-adoption
```

Expected: `Switched to a new branch 'feature/design-system-v3-adoption'`.

- [ ] **Step 3: Create the test file**

Create `src/app/__tests__/design-tokens.test.ts` with this exact content:

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

// Asserts that src/app/globals.css carries the design-system v3 tokens
// and the two brand-specific type helpers ported per docs/design-system/DELTA.md.
// This is a content-level test — it checks the CSS source as text, not its
// runtime application. The point is to catch typos/regressions in the token
// values, since a wrong hex breaks every status pill silently.

describe('Design System v3 — globals.css tokens', () => {
  const cssPath = path.join(__dirname, '../globals.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Light-mode status triplets (live in :root)
  test('OK status — v3 light triplet', () => {
    expect(css).toMatch(/--status-ok-bg:\s*#ECFDF3/);
    expect(css).toMatch(/--status-ok-border:\s*#067647/);
    expect(css).toMatch(/--status-ok-text:\s*#054F31/);
  });

  test('DUE status — v3 light triplet', () => {
    expect(css).toMatch(/--status-due-bg:\s*#FEF6E7/);
    expect(css).toMatch(/--status-due-border:\s*#B54708/);
    expect(css).toMatch(/--status-due-text:\s*#7A2E0E/);
  });

  test('OVERDUE status — v3 light triplet', () => {
    expect(css).toMatch(/--status-overdue-bg:\s*#FEF3F2/);
    expect(css).toMatch(/--status-overdue-border:\s*#B42318/);
    expect(css).toMatch(/--status-overdue-text:\s*#7A271A/);
  });

  test('INFO status — v3 light triplet', () => {
    expect(css).toMatch(/--status-info-bg:\s*#EFF4FF/);
    expect(css).toMatch(/--status-info-border:\s*#175CD3/);
    expect(css).toMatch(/--status-info-text:\s*#1E40AF/);
  });

  // Dark-mode status triplets — production already matches bundle; this is
  // a regression guard, not a change driver.
  test('OK status — dark triplet preserved', () => {
    expect(css).toMatch(/--status-ok-bg:\s*#1A2D1A/);
    expect(css).toMatch(/--status-ok-border:\s*#2D4D2D/);
    expect(css).toMatch(/--status-ok-text:\s*#4DA64D/);
  });

  // Brand-specific type helpers (D-3 — port .t-wordmark + .t-tagline)
  test('.t-wordmark helper is defined', () => {
    expect(css).toMatch(/\.t-wordmark\s*\{[^}]*letter-spacing:\s*-1px[^}]*\}/);
    expect(css).toMatch(/\.t-wordmark\s*\{[^}]*text-transform:\s*lowercase[^}]*\}/);
    expect(css).toMatch(/\.t-wordmark\s*\{[^}]*font-weight:\s*600[^}]*\}/);
  });

  test('.t-tagline helper is defined', () => {
    expect(css).toMatch(/\.t-tagline\s*\{[^}]*letter-spacing:\s*1\.5px[^}]*\}/);
    expect(css).toMatch(/\.t-tagline\s*\{[^}]*text-transform:\s*uppercase[^}]*\}/);
    expect(css).toMatch(/\.t-tagline\s*\{[^}]*font-weight:\s*400[^}]*\}/);
  });
});
```

- [ ] **Step 4: Run the test and verify it fails**

Run: `npx vitest run src/app/__tests__/design-tokens.test.ts`

Expected output:
- 7 tests, 6 FAIL (4 light triplets + 2 helpers), 1 PASS (dark OK triplet — already in production).
- The FAIL messages should reference the v3 hex strings not being found.

- [ ] **Step 5: Commit the failing test**

```bash
git add src/app/__tests__/design-tokens.test.ts
git commit -m "test(design-system): add v3 token assertions (failing)"
```

---

## Task 2: Apply v3 status palette to light mode

**Files:**
- Modify: `src/app/globals.css` lines 100–111 (the `/* Status semantic colors */` block inside `:root`)

- [ ] **Step 1: Locate the current status block**

Open `src/app/globals.css`. Find the section labeled `/* Status semantic colors */` inside the `:root { ... }` block (around lines 100–111). Current values:

```css
/* Status semantic colors */
--status-ok-bg: #E6F2E6;
--status-ok-border: #99CC99;
--status-ok-text: #006600;
--status-due-bg: #FAEEDA;
--status-due-border: #FAC775;
--status-due-text: #633806;
--status-overdue-bg: #FAECE7;
--status-overdue-border: #F5C4B3;
--status-overdue-text: #712B13;
--status-info-bg: #E6F1FB;
--status-info-border: #B5D4F4;
--status-info-text: #0C447C;
```

- [ ] **Step 2: Replace with v3 tokens**

Replace the block above (12 lines + 1 comment line) with:

```css
/* Status semantic colors — v3 (Stripe/Linear desaturated palette).
 * Backgrounds are tinted neutrals; borders + text carry the signal.
 * AA contrast on text. See docs/design-system/DELTA.md (D-1). */
--status-ok-bg: #ECFDF3;
--status-ok-border: #067647;
--status-ok-text: #054F31;
--status-due-bg: #FEF6E7;
--status-due-border: #B54708;
--status-due-text: #7A2E0E;
--status-overdue-bg: #FEF3F2;
--status-overdue-border: #B42318;
--status-overdue-text: #7A271A;
--status-info-bg: #EFF4FF;
--status-info-border: #175CD3;
--status-info-text: #1E40AF;
```

- [ ] **Step 3: Verify no other lines changed**

Run: `git diff src/app/globals.css`

Expected: only the 12 status-color lines change (plus the comment block expanding by 2 lines). The `.dark` block at lines 161–235 must remain untouched. Any other diff is a typo — undo it.

- [ ] **Step 4: Run only the light-triplet tests**

Run: `npx vitest run src/app/__tests__/design-tokens.test.ts -t "light triplet"`

Expected: 4 tests PASS (OK, DUE, OVERDUE, INFO).

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design-system): adopt v3 status palette (light mode)"
```

---

## Task 3: Port `.t-wordmark` and `.t-tagline` helpers

**Files:**
- Modify: `src/app/globals.css` (append two utility classes after the `.dark { ... }` block, before the `@layer base { ... }` block — i.e. between line 235 and line 237 in current numbering)

- [ ] **Step 1: Locate the insertion point**

Open `src/app/globals.css`. Find the closing `}` of the `.dark { ... }` block (line 235 in current file, but after Task 2 it may shift by ~2 lines). The next block is:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

Insert the new helpers **between** the `.dark` closing brace and the `@layer base` opening.

- [ ] **Step 2: Add the helpers**

Add this block exactly:

```css

/* Brand-specific type helpers (D-3 from design-system/DELTA.md).
 * Encode the lowercase wordmark and uppercase tagline conventions
 * so they cannot be forgotten in non-Tailwind surfaces (emails, embeds).
 * Other .t-* helpers from the bundle are intentionally NOT ported —
 * Tailwind utilities cover them in production code. */
.t-wordmark {
  font-family: var(--font-sans);
  font-weight: 600;
  letter-spacing: -1px;
  text-transform: lowercase;
}

.t-tagline {
  font-family: var(--font-sans);
  font-weight: 400;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
```

- [ ] **Step 3: Verify diff**

Run: `git diff src/app/globals.css`

Expected: only an insertion of ~17 new lines between the `.dark` block and the `@layer base` block. No deletions. No edits to existing lines.

- [ ] **Step 4: Run the helper tests**

Run: `npx vitest run src/app/__tests__/design-tokens.test.ts -t "helper"`

Expected: 2 tests PASS (`.t-wordmark`, `.t-tagline`).

- [ ] **Step 5: Run the full test file**

Run: `npx vitest run src/app/__tests__/design-tokens.test.ts`

Expected: 7 tests PASS (4 light triplets + 1 dark guard + 2 helpers).

- [ ] **Step 6: Run the full project test suite**

Run: `npm run test:run`

Expected: All tests pass. If any pre-existing test fails, investigate before proceeding — it might be unrelated, but token changes can affect snapshot tests.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design-system): port .t-wordmark and .t-tagline brand helpers"
```

---

## Task 4: Update `docs/brand_spec/BRAND_SPEC.md` status table

**Files:**
- Modify: `docs/brand_spec/BRAND_SPEC.md` lines 56–62 (status-semantic table)

- [ ] **Step 1: Locate the current table**

Open `docs/brand_spec/BRAND_SPEC.md`. Find the section titled `### Status-Semantik`, around line 56. Current content:

```markdown
### Status-Semantik
| Status    | bg        | border    | text      | Bedeutung         |
|-----------|-----------|-----------|-----------|-------------------|
| ok        | `#E6F2E6` | `#99CC99` | `#006600` | Gewartet, OK      |
| due       | `#FAEEDA` | `#FAC775` | `#633806` | Wartung bald      |
| overdue   | `#FAECE7` | `#F5C4B3` | `#712B13` | Überfällig        |
| info      | `#E6F1FB` | `#B5D4F4` | `#0C447C` | Hinweis / Info    |
```

- [ ] **Step 2: Replace with v3 values + supersede footnote**

Replace the entire `### Status-Semantik` section with:

```markdown
### Status-Semantik

> **Hinweis (2026-04-30):** Die Status-Triplets wurden im Rahmen des Design-System v3-Updates auf eine desaturierte Stripe/Linear-Palette umgestellt. Hintergründe sind getönte Neutrale; Border und Text tragen das Signal (AA-Kontrast). Quelle: [docs/design-system/project/colors_and_type.css](../design-system/project/colors_and_type.css). Vollständige Begründung in [docs/design-system/DELTA.md](../design-system/DELTA.md) (D-1).

| Status    | bg        | border    | text      | Bedeutung         |
|-----------|-----------|-----------|-----------|-------------------|
| ok        | `#ECFDF3` | `#067647` | `#054F31` | Gewartet, OK      |
| due       | `#FEF6E7` | `#B54708` | `#7A2E0E` | Wartung bald      |
| overdue   | `#FEF3F2` | `#B42318` | `#7A271A` | Überfällig        |
| info      | `#EFF4FF` | `#175CD3` | `#1E40AF` | Hinweis / Info    |

**Dark-Mode-Triplets** (separate, bereits vor v3 in Produktion und unverändert):

| Status    | bg        | border    | text      |
|-----------|-----------|-----------|-----------|
| ok        | `#1A2D1A` | `#2D4D2D` | `#4DA64D` |
| due       | `#3D2E0F` | `#5C4412` | `#FAC775` |
| overdue   | `#3D1A14` | `#5C2B1E` | `#F5C4B3` |
| info      | `#0F2240` | `#1A3D6B` | `#B5D4F4` |
```

- [ ] **Step 3: Verify diff**

Run: `git diff docs/brand_spec/BRAND_SPEC.md`

Expected: only the `### Status-Semantik` section is modified — the rest of the file (icon spec, color tokens, typography, radius, components, email-template, file-structure) stays exactly as-is.

- [ ] **Step 4: Commit**

```bash
git add docs/brand_spec/BRAND_SPEC.md
git commit -m "docs(brand-spec): update status-color table to v3 + add supersede note"
```

---

## Task 5: Sync bundle and skill reference snapshots of `globals.css`

The bundle ships a verbatim copy of production `globals.css` at `docs/design-system/project/assets/globals.css`, and the skill folder mirrors it at `.claude/skills/torqr-design-system/assets/globals.css`. Both need to track the new production state so future readers don't see stale tokens.

**Files:**
- Modify: `docs/design-system/project/assets/globals.css`
- Modify: `.claude/skills/torqr-design-system/assets/globals.css`

- [ ] **Step 1: Mirror to the bundle**

Run:
```bash
cp src/app/globals.css docs/design-system/project/assets/globals.css
```

- [ ] **Step 2: Mirror to the skill**

Run:
```bash
cp src/app/globals.css .claude/skills/torqr-design-system/assets/globals.css
```

- [ ] **Step 3: Verify both files are byte-identical to production**

Run:
```bash
diff -q src/app/globals.css docs/design-system/project/assets/globals.css
diff -q src/app/globals.css .claude/skills/torqr-design-system/assets/globals.css
```

Expected: no output from either diff (files identical).

- [ ] **Step 4: Commit**

```bash
git add docs/design-system/project/assets/globals.css .claude/skills/torqr-design-system/assets/globals.css
git commit -m "chore(design-system): sync bundle + skill assets/globals.css to v3 production"
```

---

## Task 6: Visual verification against bundle mocks

This task does **not** produce a commit. It's a manual gate that confirms the v3 palette renders correctly across the surfaces that matter. If anything looks broken, treat it as a blocker — don't merge.

**Files:**
- None (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Next.js dev server reachable at `http://localhost:3000`.

- [ ] **Step 2: Open the landing-page mock in a browser**

Open in browser: `file:///<absolute-repo-path>/docs/design-system/project/ui_kits/marketing_site/landing.html`

This is a static HTML file — no dev server needed.

- [ ] **Step 3: Open the production landing**

Open: `http://localhost:3000/`

- [ ] **Step 4: Side-by-side compare key elements**

Verify each of the following matches between mock and production:
- Hero pill (`▰ Die Wartungsakte für Heizungsbauer`) — amber border, no green tint
- Hero CTAs — primary `#008000`, outline `#fff` border `#E0E0E0`
- Pain section status-overdue pill — text `#7A271A` on `#FEF3F2` with `#B42318` border (read on the section's hero-frame status pills like *"Überfällig"*)
- Pricing card "BELIEBTESTE WAHL" pill — amber `#EF9F27` (uses `--brand-accent`, NOT a status token — should be unchanged)
- ROI tile numbers — primary green `#008000` on white card

Take notes if anything looks off. If the production version still shows old `#FAECE7 / #F5C4B3` overdue colors, the build/dev server is serving stale CSS — restart it.

- [ ] **Step 5: Open the dashboard mock + compare against any dashboard surface**

Open in browser: `file:///<absolute-repo-path>/docs/design-system/project/ui_kits/web_app/dashboard.html`

If you have a logged-in test user with seeded data, navigate to the production dashboard at `http://localhost:3000/dashboard` and verify the customer-list status pills:
- *Wartung fällig* — uses v3 due triplet (`#FEF6E7 / #B54708 / #7A2E0E`)
- *Überfällig* — uses v3 overdue triplet (`#FEF3F2 / #B42318 / #7A271A`)
- *Wartung aktuell* — uses v3 ok triplet (`#ECFDF3 / #067647 / #054F31`)
- *Termin gebucht* — uses v3 info triplet (`#EFF4FF / #175CD3 / #1E40AF`)

If you don't have a seeded environment, skip this check — it'll be caught in the next sprint's UI work.

- [ ] **Step 6: Test dark mode (if app supports user toggle)**

Toggle dark mode in the production app (or apply `class="dark"` on `<html>` via DevTools). Verify dark status pills still work — they should be visually unchanged from before since dark-mode tokens were not touched.

- [ ] **Step 7: Stop the dev server**

`Ctrl+C` in the terminal running `npm run dev`.

- [ ] **Step 8: Record verification result**

If all checks passed, proceed to Task 7. If any element looks wrong, do **not** merge — investigate first. Common causes: stale Next.js cache (`.next/` folder — delete + rebuild), browser cache (hard reload), or a typo in Task 2 (re-diff `src/app/globals.css`).

---

## Task 7: Backlog, timesheet, and merge

**Files:**
- Modify: `docs/BACKLOG.md` (add completed item)
- Modify: `docs/development/TIMESHEET.md` (auto-log per CLAUDE.md procedure — only if the day-end fallback is triggered)

- [ ] **Step 1: Add a completed-item entry to `docs/BACKLOG.md`**

Open `docs/BACKLOG.md`. Find the **Completed / Resolved** table. Append one row:

```markdown
| <next #> | Design System | v3 Status-Palette + Brand-Type-Helper (`.t-wordmark`, `.t-tagline`) auf Produktion gezogen; Brand-Spec auf v3 aktualisiert; Bundle-Mirror synchronisiert | 2026-04-30 |
```

(Use the next sequential number from the existing table.)

If the work also resolves any **Open Items** entries (none expected, but verify), move them to Completed instead of duplicating.

- [ ] **Step 2: Run timesheet auto-log procedure**

Per CLAUDE.md "Timesheet Auto-Update" rules:
1. Read `.claude/state/sessions.jsonl` — find sessions for `2026-04-30`.
2. If no Teil 3 row exists for `2026-04-30`, build one from the day's commits.
3. Use `git log --author="Yannik Dorth" --since="2026-04-30" --until="2026-05-01" --pretty=format:'%h %s'` to assemble the day's commit summary.
4. Tier this work — it's **S (Small, ~2 h solo-dev equivalent)** — token swap + 2 helpers + spec docs + bundle sync + verification. Single sprint hour or so of focused work.
5. Append the row to `docs/development/TIMESHEET.md` Teil 3.
6. Recompute the Executive Summary block.

- [ ] **Step 3: Commit backlog + timesheet**

```bash
git add docs/BACKLOG.md docs/development/TIMESHEET.md
git commit -m "chore: backlog + timesheet for design-system v3 adoption"
```

- [ ] **Step 4: Push the feature branch (NOT to main directly)**

```bash
git push -u origin feature/design-system-v3-adoption
```

Expected: branch pushed to remote. Stop here. Do **not** merge to `main` — the user merges manually per repo convention (CLAUDE.md notes feature branches merge into `main`, but the user retains the merge action).

- [ ] **Step 5: Hand off to the user**

Report:
- Number of commits on the branch (expected: 6 — failing test, light palette, helpers, brand-spec, bundle sync, backlog/timesheet).
- Test status: 7/7 design-token tests passing, full project test suite green.
- Visual verification: pass / pass with notes / blocker.
- Any open follow-ups (e.g. dashboard mockup polish if the user wants to commission a separate plan for that).

---

## Self-Review Checklist (run before declaring the plan ready)

- [ ] **Spec coverage** — every confirmed delta from `DELTA.md` is addressed:
  - D-1 light-mode palette → Task 2 ✓
  - D-1 dark mode → no-op (production already aligned) ✓
  - D-2 fonts → no-op (out of scope, called out explicitly) ✓
  - D-3 helpers → Task 3 (only `.t-wordmark` + `.t-tagline`) ✓
  - I-1 BRAND_SPEC.md sync → Task 4 ✓
  - Bundle reference sync → Task 5 ✓
  - Visual verification → Task 6 ✓
  - Chores (backlog + timesheet) → Task 7 ✓
- [ ] **Placeholder scan** — no TBD / TODO / "implement later" / "add error handling" patterns; every code block is concrete.
- [ ] **Type/file consistency** — file paths repeated across tasks all match exactly (`src/app/globals.css`, `src/app/__tests__/design-tokens.test.ts`, etc.).
- [ ] **Commit cadence** — 6 commits across 7 tasks, each commit small and reversible.
- [ ] **Test discipline** — failing test before code change (Task 1 → 2; Task 1 → 3); full suite run before final commit (Task 3 Step 6).
- [ ] **Verification gate** — Task 6 explicitly does not commit, exists to catch broken builds before backlog/merge.

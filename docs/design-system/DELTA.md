# Design System Delta vs. Production

> Snapshot date: **2026-04-30** · Bundle source: `claude.ai/design` handoff · Production reference: `torqr_app@main`

This file enumerates every difference between the design-system bundle (`docs/design-system/project/`) and the current production codebase. Use it as the input to the planning + implementation phase — every row is either an explicit decision the user has to make, an implementation task, or a reference note.

---

## TL;DR

The bundle is a **point-in-time visual snapshot** of the production codebase plus four iterated artifacts:

1. **A new "v3" status palette** (Stripe/Linear-style desaturated tokens) that overrides the current "candy" palette in `src/app/globals.css`.
2. **Segoe UI Historic TTFs** shipped as `@font-face` resources, overriding the original "no web fonts" decision.
3. **A set of semantic CSS helpers** (`.t-h1`, `.t-eyebrow`, `.t-wordmark`, …) for use in HTML/embed contexts, not currently in production.
4. **Pixel-perfect HTML mockups** for the landing page and dashboard that the implementation should match.

Everything in `docs/design-system/project/src/` is **byte-identical** to current production code (verified via line-ending-normalised diff). Treat that subtree as a reference snapshot, not a source of changes.

---

## 1 — Identical to production (no action)

After normalising LF/CRLF line endings, every file in `docs/design-system/project/src/` matches production exactly:

| File | Bundle path | Production path |
|---|---|---|
| `globals.css` | `project/src/app/globals.css` | `src/app/globals.css` |
| `layout.tsx` | `project/src/app/layout.tsx` | `src/app/layout.tsx` |
| `page.tsx` | `project/src/app/page.tsx` | `src/app/page.tsx` |
| All marketing components (17 files) | `project/src/components/marketing/*.tsx` | `src/components/marketing/*.tsx` |
| `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx` | `project/src/components/ui/*.tsx` | `src/components/ui/*.tsx` |
| `DashboardNav.tsx` | `project/src/components/DashboardNav.tsx` | `src/components/DashboardNav.tsx` |
| `TorqrIcon.tsx` | `project/src/components/brand/TorqrIcon.tsx` | `src/components/brand/TorqrIcon.tsx` |

→ **No diff to apply.** This subtree exists in the bundle so the design-system skill is self-contained; treat it as documentation.

---

## 2 — Decision-required deltas

These need an explicit user decision before any code is written.

### D-1 · Status palette: "v1 candy" → "v3 desaturated"

| State | Token | Production (current) | Bundle (target) | Notes |
|---|---|---|---|---|
| **OK** | `--status-ok-bg` | `#E6F2E6` (brand-50) | `#ECFDF3` (cool mint) | Less green-tinted, more neutral |
| | `--status-ok-border` | `#99CC99` (brand-200) | `#067647` (deep green) | **Border becomes the strong signal** |
| | `--status-ok-text` | `#006600` (brand-600) | `#054F31` (forest) | AA-contrast text on the new bg |
| **DUE** | `--status-due-bg` | `#FAEEDA` (accent-surface) | `#FEF6E7` (pale wheat) | Less amber-tinted |
| | `--status-due-border` | `#FAC775` (accent-light) | `#B54708` (deep amber) | Strong border |
| | `--status-due-text` | `#633806` | `#7A2E0E` | Slightly more red-tinted |
| **OVERDUE** | `--status-overdue-bg` | `#FAECE7` | `#FEF3F2` | Less peach, more clean |
| | `--status-overdue-border` | `#F5C4B3` | `#B42318` (proper red) | Big change — was pinkish, now arterial red |
| | `--status-overdue-text` | `#712B13` | `#7A271A` | Marginal |
| **INFO** | `--status-info-bg` | `#E6F1FB` | `#EFF4FF` | Cleaner |
| | `--status-info-border` | `#B5D4F4` | `#175CD3` (proper blue) | Stripe-blue, was muted |
| | `--status-info-text` | `#0C447C` | `#1E40AF` | Slightly lighter |

**Why it matters:** The bundle README's `colors_and_type.css` carries an explicit comment *"v3 — premium SaaS feel (Stripe/Linear). Tinted neutrals, not candy. Backgrounds desaturated; borders + text carry the confidence. AA contrast on text."* This is a deliberate brand-up-level, not a refactor.

**Impact:** Every `Badge`, status pill, alert, and timeline marker in production currently reads from these tokens. Changing them updates the whole app at once. The visual delta is most visible on:
- Customer table status pills (dashboard, customer list, customer detail)
- Maintenance status indicators
- Toast notifications + alerts
- Pricing card "BELIEBTESTE WAHL" amber pill (uses `accent-surface` not the status family — unaffected)
- Email-template status colours (`docs/brand_spec/email-template.html` — also not affected; uses brand greens directly)

**Open question:** Is the v3 palette to be adopted as-is, or do we want the user to A/B against current production first? Bundle README treats it as canonical, but the production snapshot in the bundle still has the v1 palette → there's an inconsistency in the bundle itself (intent vs. reference).

**Affects:** `src/app/globals.css` (`:root` + `.dark` blocks), `docs/brand_spec/BRAND_SPEC.md` status-colour table, every component that consumes `--status-*-*`.

### D-2 · Segoe UI Historic TTFs: ship locally or stay system-only?

The bundle includes four TTF files in `project/fonts/`:
- `segoeuithis.ttf` (regular, ~390 KB)
- `segoeuithibd.ttf` (bold)
- `segoeuithisi.ttf` (italic)
- `segoeuithisz.ttf` (bold-italic)

They're wired up via `@font-face` in `colors_and_type.css` with `font-display: swap`. Bundle README explicitly says: *"by uploading these the brand owner has overridden [the no-web-fonts decision]. On Windows / Office machines where Segoe UI is OS-installed the local copy still wins; otherwise the bundled TTFs render so mocks look on-brand on macOS, Linux, and any embed."*

**Trade-off:**

| Ship | Skip |
|---|---|
| ✅ macOS/Linux visitors see real Segoe UI (currently fall back to system-ui = SF Pro) | ✅ Smaller bundle (no ~1.5 MB font payload) |
| ✅ Marketing screenshots / OG images render correctly cross-OS | ✅ No TTFB hit (system fonts have zero cost) |
| ✅ Aligns with what the bundle ships | ✅ Original "no FOUT" rationale preserved |
| ❌ Cost: ~1.5 MB font payload (4 weights × ~390 KB) | ❌ Cross-OS rendering inconsistency persists |
| ❌ Licensing: Segoe UI is Microsoft-licensed; check legality | ❌ macOS/Linux render in San Francisco — not Segoe — visually different |

**Open question (legal):** Segoe UI is bundled with Windows under a Microsoft license that does *not* permit redistribution as a web font in the general case. The Segoe UI Historic variant is even more restricted. **Before shipping, verify license compliance with the brand owner.** This may settle the decision on its own.

**Affects:** `public/fonts/` (new folder), `src/app/globals.css` (new `@font-face` block), `next.config.ts` (font preload headers), bundle size.

### D-3 · Semantic CSS helpers: port to production or keep mock-only?

The bundle's `colors_and_type.css` ships utility classes that do not exist in production:

```css
.t-eyebrow  { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--primary); ... }
.t-h1       { font-size: clamp(36px, 6vw, 60px); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; ... }
.t-h2       { font-size: clamp(30px, 4vw, 36px); font-weight: 700; line-height: 1.25; ... }
.t-h3       { font-size: 24px; ... }
.t-lead     { font-size: 18px; line-height: 1.625; color: var(--muted-foreground); }
.t-body     { ... }  .t-small  { ... }  .t-micro  { ... }  .t-mono { ... }
.t-wordmark { font-weight: 600; letter-spacing: -1px; text-transform: lowercase; }
.t-tagline  { font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase; }
```

**Trade-off:**
- **Port:** Useful inside email templates, embeds, and marketing one-pagers (places where Tailwind isn't compiled). Keeps brand discipline in non-React surfaces. Lives in `src/app/globals.css` outside the `@theme` block.
- **Skip:** Production code is React + Tailwind; these classes are redundant with utility composition (`text-xs uppercase tracking-[1.5px] text-primary font-medium` already exists in marketing components).

**Recommendation (planning input, not decision):** Port `.t-wordmark` and `.t-tagline` only — those encode brand-specific casing/letter-spacing rules that are easy to forget. Skip the rest as redundant with Tailwind.

**Affects:** `src/app/globals.css`, possibly email templates if we want to drop the inline duplication.

---

## 3 — Implementation tasks (no decision needed)

These follow naturally once D-1 / D-2 / D-3 land.

### I-1 · Update `docs/brand_spec/BRAND_SPEC.md` status table

The status table in `docs/brand_spec/BRAND_SPEC.md` is the human-readable brand reference. After D-1 lands, update lines 56–62 with the v3 values and add a footnote pointing to the design system as the latest authority.

### I-2 · Mockup-vs-production drift catalogue (dashboard)

The dashboard mockup at `docs/design-system/project/ui_kits/web_app/dashboard.html` includes visual elements not yet in production:

| Element | Mockup | Current production | Decision |
|---|---|---|---|
| Active sidebar item | `box-shadow: inset 3px 0 0 #FFB547` + amber text | `bg-sidebar-accent` only | Adopt? |
| Active item icon colour | `#FFB547` (lifted amber) | `currentColor` (inherits) | Adopt? |
| Role badge in sidebar foot | Inline `OWNER` pill, amber | Currently shown in DashboardNav | Verify match |
| Customer initials avatar | 32 px circle, brand-50 bg, brand-700 text | Production unknown — verify | Catalogue |
| Stat-card delta line | "X+ in den letzten 30 Tagen" | Not implemented | New feature? |
| Activity timeline card | Recent events feed | Not implemented | New feature? |
| Topbar global search | 280 px input with icon + placeholder | Not implemented | New feature? |
| Phone-mockup checklist | 300 px iPhone bezel mock | Not in dashboard | Marketing only? |

→ This drift is a planning input, not a delta the design system *imposes*. The mockup shows what *could* be, not what *must* be. Each row is its own scope decision.

### I-3 · Mockup-vs-production drift catalogue (landing)

The landing mockup at `docs/design-system/project/ui_kits/marketing_site/landing.html` is largely **production-aligned** (the landing was already built in Sprint 29 against this design intent). Spot-check items:

- Hero pill (`▰ Die Wartungsakte für Heizungsbauer`) → matches production
- Hero H1 (`Aus Excel raus. In die Hosentasche rein.`) → matches production
- 10-section flow (nav → hero → pain → 3-step → features → ROI → trust → pricing → FAQ → CTA → footer) → matches production
- Pricing tiers (Solo €19 / Pro €49 / Enterprise on request) → matches production
- Trust strip wording → matches production

**Action:** Treat the mockup as a *visual verification target* during the v3 status palette rollout, not a redesign brief.

### I-4 · Verify production sidebar against bundle's snapshot

The bundle's `project/src/components/DashboardNav.tsx` is byte-identical to production, so no functional change is needed. But the **dashboard mockup** (`ui_kits/web_app/dashboard.html`) shows a different visual treatment than what `DashboardNav.tsx` renders. If we adopt I-2 changes (inset shadow, amber active state, role badge), `DashboardNav.tsx` is the file to edit.

---

## 4 — Reference-only artifacts

These ship in the bundle but require no production change:

- `project/preview/*.html` — 10 design-system swatch + component cards. Useful as a visual contract sheet for future components. Live in `docs/design-system/`; do not duplicate in `src/`.
- `project/assets/*.svg` — Three Torqr icon variants + wordmark. Already implemented as React components in `src/components/brand/TorqrIcon.tsx`. SVGs in the bundle exist for HTML embed contexts (mocks, emails not built with React Email). No action.
- `project/assets/globals.css` — Verbatim copy of production `src/app/globals.css`. Provided so the bundle is self-contained for HTML mocks. No action.
- `project/colors_and_type.css` — Linked from every preview/UI-kit HTML. Lives in `docs/design-system/` only; no need to ship to `public/`.

---

## 5 — Implementation sequence (planning skeleton)

When the user says "go" with `/superpowers:writing-plans`, the plan should follow this order:

1. **D-1 decision + status palette write** — single atomic commit to `globals.css`, brand spec, and a verification pass over every component that consumes `--status-*-*`.
2. **Mockup verification (visual diff)** — compare landing + dashboard against `ui_kits/*.html` after D-1 lands. Catalogue any cosmetic gaps.
3. **D-3 decision + selective helper port** (if any) — append `.t-wordmark` / `.t-tagline` to `globals.css`.
4. **D-2 decision + (conditional) font shipping** — only if legal clearance is positive. Includes `public/fonts/` + `@font-face` + Next.js font preload.
5. **I-2 dashboard polish** (separate plan) — inset-shadow active state, role badge, etc. Only if user wants the dashboard upgrade. Can ship in its own sprint.
6. **Marketing graph rebuild** — after any merge that touches tokens or brings new mockup-derived components into `src/`.

Steps 1–4 are tightly coupled and should be one plan. Step 5 is a separate scope.

---

## 6 — Verification anchor

Before declaring any phase complete, the implementation must visually match the bundle's mockup HTML. Render `ui_kits/marketing_site/landing.html` (just open in browser) alongside production and confirm parity for the changed elements. Same for the dashboard. The bundle README explicitly says don't screenshot the mocks — read the source — but for *verification* of the implementation, side-by-side render is the right tool.

---

*Maintained by hand. Append a row to the relevant section when a new delta is discovered or an existing one resolved. Reference this file from any plan or PR that touches design tokens, the landing page, or the dashboard.*

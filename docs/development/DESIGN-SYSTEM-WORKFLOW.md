# Design System — Visual Handoff (`docs/design-system/`)

**Purpose**: Canonical reference for *how things look* — the high-fidelity visual companion to the marketing graph (which covers *what they say*) and `docs/brand_spec/` (which covers *brand fundamentals*). Built in claude.ai/design from this codebase + marketing briefing, dropped in 2026-04-30.

**Linked from**: [CLAUDE.md](../../CLAUDE.md) Design System section.

---

## 1. Where each layer lives

| Source | Scope | Authority |
|--------|-------|-----------|
| `docs/design-system/` | High-fidelity HTML mockups, "v3" status palette, semantic CSS helpers, Segoe UI Historic TTFs, skill manifest | **Canonical for visuals (2026-04-30+)** |
| `docs/brand_spec/` | Brand fundamentals: icon variants, font strategy, radius scale, email template | Fundamentals authoritative; **status-color table superseded by design-system v3** |
| `docs/graphify/graphify-out-marketing/` | Voice, claims, ICP, page composition, brand-tokens-as-graph | Canonical for content/positioning |
| `src/app/globals.css` + `src/styles/brand.config.ts` | Production token implementation | Source of truth at runtime |

---

## 2. Bundle layout (`docs/design-system/project/`)

- `README.md` — read top-to-bottom before any landing-page or dashboard design work
- `SKILL.md` — also installed at `.claude/skills/torqr-design-system/`
- `colors_and_type.css` — tokens + semantic helpers (`.t-h1`, `.t-eyebrow`, `.t-wordmark`, `.t-tagline`, …)
- `assets/` — Torqr icon variants (default / dark / ghost) + wordmark SVG + verbatim production `globals.css`
- `fonts/` — Segoe UI Historic TTFs (regular, bold, italic, bold-italic)
- `ui_kits/marketing_site/landing.html` — pixel-perfect 10-section landing target
- `ui_kits/web_app/dashboard.html` — pixel-perfect dashboard target
- `preview/*.html` — design-system swatches + component cards (10 files)
- `src/` — verbatim snapshot of current `src/app/*`, `src/components/marketing/*`, `src/components/ui/*`, `src/components/DashboardNav.tsx`, `src/components/brand/TorqrIcon.tsx`. **Reference only — byte-identical to production code.**

---

## 3. Open deltas vs. current production

See `docs/design-system/DELTA.md` for the full report. Headline deltas:

1. **Status palette v3** — desaturated Stripe/Linear-feel triplets (`#ECFDF3 / #067647 / #054F31` for OK; `#FEF6E7 / #B54708 / #7A2E0E` for due; `#FEF3F2 / #B42318 / #7A271A` for overdue; `#EFF4FF / #175CD3 / #1E40AF` for info). Production still uses the original "candy" palette in `globals.css`. **Decision needed before any token write.**
2. **Segoe UI Historic TTFs** — bundle ships local fonts; production uses pure system stack. Per bundle README the brand owner explicitly overrode the original "no web fonts" decision. **Decision needed: ship under `public/fonts/` + `@font-face` in `globals.css`, or keep system-only.**
3. **Semantic CSS helpers** — `.t-h1` / `.t-eyebrow` / `.t-lead` / `.t-mono` / `.t-wordmark` / `.t-tagline` exist in `colors_and_type.css` but not in production. Useful for HTML mocks. **Decision needed: port to `globals.css` or keep mock-only.**
4. **Dashboard mockup-vs-production drift** — mockup adds active-nav inset shadow + amber tint (`#FFB547`), role-badge pill, traffic-light browser frame. Catalog piece-by-piece during planning.
5. **Landing mockup is largely production-aligned** — visual fidelity match for the 10-section landing built in Sprint 29. Use it as a verification target, not a redesign brief.

---

## 4. When to consult the design system

- **Before any visual change** to landing page, dashboard, or marketing material → read `project/README.md` + the relevant mockup HTML first.
- **Before adding a new component** → check `preview/*.html` for the existing visual vocabulary.
- **Before touching tokens** → consult `colors_and_type.css` (intent) **and** check `DELTA.md` (open decisions).
- **Skip** for backend/API work, copy-only edits, or pure logic refactors.

---

## 5. Hard rules (from `SKILL.md`)

- **Never** invent new colors — palette is fixed (7 greens, 3 ambers, 6 neutrals, 4 status states).
- **Never** ship Title Case German headlines — sentence case + period.
- **Always** show status as bg + border + text triplet (must read in monochrome).
- **Always** use system fonts at runtime; bundled TTFs are a non-Windows fallback only.

---

## 6. Keeping it in sync

Point-in-time snapshot (2026-04-30) — **not** auto-rebuilt by any hook. When production tokens, components, or brand decisions change beyond cosmetic edits, hand-update `colors_and_type.css` and append to `DELTA.md`. Treat updates as deliberate design-decision moments. The marketing graph (`docs/graphify/graphify-out-marketing/`) is not yet aware of design-system content — rebuild it after any merge that lands design-system tokens or mockup-derived components into `src/`.

---

## Changelog

- **2026-05-07** — Extracted from CLAUDE.md to slim it down. Content unchanged.

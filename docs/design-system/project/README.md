# Torqr Design System

> **torqr.de** — *Die Wartungsakte für Heizungsbauer.*
> B2B-SaaS-Wartungsmanagement-Plattform für Heizungs-/SHK-Fachbetriebe in Deutschland.

This design system captures the look, voice and components of **Torqr** so design and prototyping work can stay on-brand without re-deriving tokens from scratch.

---

## What Torqr is

Torqr is a **mobile-first Wartungsmanagement-Plattform** (maintenance management SaaS) for German heating engineers (Heizungsbauer / SHK-Fachbetriebe). It replaces the typical Excel-plus-Outlook setup of a one-person heating business with a system that:

- Stores customers, heating systems (and clima / water / energy-storage equipment), maintenance history, photos and parts in one place.
- Sends fully automated double-opt-in reminder emails 4 weeks + 1 week before each maintenance.
- Lets the end-customer self-book appointments through a Cal.com link, then syncs the booking back into Torqr.
- Provides a 30-second mobile maintenance checklist (3-step wizard) for use in front of the actual heating unit.
- Scales from solo (single user) → professional (multi-user with OWNER / TECHNICIAN roles) → enterprise.

**Tech stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4 (`@theme inline`), shadcn/ui, NextAuth v5, Prisma + Supabase Postgres (eu-central-1), React Query, React Hook Form + Zod, Resend + React Email, Cal.com v2 integration, Vercel hosting.

**Domain:** [`torqr.de`](https://torqr.de) · **Language:** Deutsch (only). · **Region:** Germany (only).

## Surfaces

Torqr today is **two distinct surfaces** with shared brand DNA but different rules:

| Surface | Audience | Anrede | Tone | Density |
|---|---|---|---|---|
| **Marketing site** (`torqr.de` landing) | Self-employed heating engineers | **Du** | Direct, ROI-led, modest hype OK | Air, big type, image+text grid |
| **Web app** (dashboard, mobile-first PWA) | Same engineer + their technicians | **Du** (in app) | Sachlich, präzise, knapp | Dense, tabular, status-coded |
| **End-customer emails** (sent BY engineer TO their customer) | Heating-system owners (often seniors) | **Sie** | Polite, formal, factual | Plain |

The visual system is the same (green + amber, system fonts, 12 px base radius), but the marketing site uses generous whitespace and image+copy alternation, while the app surface is denser and more table-driven.

## Sources used to build this design system

- **Codebase: `Gamble182/torqr_app`** (GitHub, default branch `main`) — production Next.js 16 app. Specifically:
  - `src/app/globals.css` — Tailwind v4 `@theme inline` token block, light + dark modes (canonical color/radius source).
  - `src/styles/brand.config.ts` — typed brand constants (also locally mounted as `styles/brand.config.ts`).
  - `src/components/brand/TorqrIcon.tsx` — `<TorqrIcon>` and `<TorqrWordmark>` React components (canonical logo).
  - `src/components/marketing/*` — Hero, FeatureSection, Pricing, Trust, FAQ, FinalCta, etc.
  - `src/components/DashboardNav.tsx` — sidebar with `theme="green"` wordmark, role badge, low-stock badge, collapse toggle.
  - `src/components/ui/*` — shadcn primitives (button, badge, card, input, …).
- **Marketing briefing: `marketing/MARKETING_BRIEFING.md`** — full source of voice, decisions log, pricing tiers, target persona "Max", competitive positioning, claims library. Locally mounted, read-only.
- **Public assets: `public/marketing/*`** in `torqr_app` — feature screenshots and hero GIFs (referenced; not all imported).

---

## Index of this design system

| Path | What |
|---|---|
| `README.md` | This file — context, content fundamentals, visual foundations, iconography, asset index |
| `colors_and_type.css` | All design tokens (colors, type, radius, shadow, status) as CSS vars + semantic helpers |
| `assets/globals.css` | Verbatim copy of the production Tailwind v4 token block — single source of truth |
| `assets/torqr-icon.svg`, `assets/torqr-icon-dark.svg`, `assets/torqr-icon-ghost-on-green.svg` | Pulse-icon variants extracted from `TorqrIcon.tsx` |
| `assets/torqr-wordmark.svg` | Wordmark variant for embedding |
| `preview/*.html` | Design-system cards (rendered in the **Design System** tab) — type, colors, components, brand |
| `ui_kits/web_app/` | High-fidelity recreation of the Torqr dashboard (sidebar, customer list, system detail, maintenance checklist) |
| `ui_kits/marketing_site/` | High-fidelity recreation of the `torqr.de` landing page (hero, pain, solution, features, pricing, FAQ, CTA, footer) |
| `SKILL.md` | Agent-Skill manifest — drop this folder into a Claude Code project to use as a skill |

---

## CONTENT FUNDAMENTALS

Voice rules are **decided** (Decisions D-2, D-6 in the marketing briefing) and they differ by surface. Get this wrong and the design will *feel* wrong even with the right tokens.

### Anrede (form of address)

- **Marketing site, outbound emails to engineers, inhouse technician UI → "Du".** Reason: self-employed heating engineers address each other informally; competing tools (Tooltime, Plancraft) do the same. Du works directly, less suit-and-tie.
- **End-customer emails (reminder, booking-confirmation sent through the platform to *Heinz Müller* the homeowner) → "Sie".** Reason: end-customer recipients are often seniors, "Du" would be intrusive.

> *"Sehr geehrter Herr Müller, Ihre Heizung (Viessmann Vitodens 200) ist in ca. 4 Wochen wieder zur Wartung fällig. Wir werden uns zeitnah bei Ihnen melden."*

### Tone

- **Sachlich, technisch, knapp.** No hype, no Anglicisms when avoidable, no marketing floskeln.
- **Verbs are imperative + functional**: "Wartung erfassen", "Termin verschieben", "Kunden anlegen", "30 Tage testen", "Demo buchen".
- **Quantify when possible**: "6 h pro Woche zurück", "904 Hersteller-Modelle vorgepflegt", "324 grüne Tests", "ROI ~35×". Numbers > adjectives.
- **Never use**: "revolutionär", "next-gen", "Game-Changer", "AI-powered", "Disrupt". The audience is nüchtern.
- **Headlines are concrete**: *"Aus Excel raus. In die Hosentasche rein."* / *"Die Wartungsakte für Heizungsbauer."* / *"Wartung in 30 Sekunden — vor dem Gerät."*
- **Error messages explain cause + next step**: *"Kunde konnte nicht gespeichert werden. Bitte E-Mail prüfen."* — not a generic "Something went wrong".

### Emojis

- **In product UI / app emails: nein.** Status is communicated by colored badge + icon + word, never by emoji.
- **In marketing material (landing, social): sparingly OK.** The current landing uses one — `🇩🇪 Made in Germany` — and `▰` as a brand-mark glyph in the hero pill ("▰ Die Wartungsakte für Heizungsbauer"). Feature lists in the briefing use ⚡📅📦👥🇪🇺🔌📱 but they are explicitly a *marketing-only* convention.

### Casing

- **`torqr` wordmark is always lowercase**, weight 600, letter-spacing **−1 px**.
- **`Wartungsmanagement` tagline** is always **UPPERCASE**, weight 400, letter-spacing **1.5 px**.
- **Section eyebrows** are UPPERCASE with letter-spacing 1.5 px (e.g. *"MOBILE WARTUNGS-CHECKLIST"*).
- **Headlines: Sentence case, German**. *"Was Torqr für dich tut."* — period at the end, no Title Case.
- **Buttons & CTAs: imperative**. *"30 Tage testen →"*, *"Demo buchen"*, *"Beta-Liste eintragen"*.

### Microcopy library (verified, copy-pasteable)

- Hero badge: *"▰ Die Wartungsakte für Heizungsbauer"*
- Hero H1 (current production): *"Aus Excel raus. In die Hosentasche rein."*
- Backup taglines (briefing): *"Nie wieder vergessene Wartung."* · *"6 Stunden pro Woche zurück."* · *"Termine. Anlagen. Teile. In einer App."*
- Button: *"30 Tage testen"* + arrow · *"Demo buchen"* · *"Zum Dashboard"*
- Trust strip: *"Keine Kreditkarte · jederzeit kündbar · DSGVO-konform"*
- Footer: *"Die Wartungsakte für Heizungsbauer. · 🇩🇪 Made in Germany"*
- Status word for ok/due/overdue/info: *"Wartung aktuell"* / *"Wartung fällig"* / *"Überfällig"* / *"Hinweis"*

---

## VISUAL FOUNDATIONS

### Colors

Two-color brand: **Industrie-Grün `#008000`** + **Bernstein-Amber `#EF9F27`**, on white. Greens carry the brand and primary actions; amber is reserved for the pulse-dot accent, "popular tier" highlight, beta-status pill, and `due` semantic state.

- **Primary (`brand` / `--primary`)** `#008000` — single source of CTA and active-state color.
- **brand-700** `#004D00` — used **only** for the dashboard sidebar background (`--sidebar`).
- **brand-50 / brand-100 / brand-200 / brand-400** form a tight tint scale: `#E6F2E6` → `#CCDFCC` → `#99CC99` → `#4DA64D`.
- **Accent (`--brand-accent`)** `#EF9F27` is sparing. Surface tint `#FAEEDA` shows up on the pilot-status pill and the "BELIEBTESTE WAHL" ribbon.
- **Status colors** are **always shown as bg + border + text triplets**, never bg-only — accessibility decision: color-coded status must be readable in monochrome too. (`ok / due / overdue / info`)
- **Dark mode is fully specified** — same green/amber identity but flipped: bg `#0F1A0F`, primary lifts to `#4DA64D`, sidebar drops to `#0A140A`. Marketing site is light-only; the app respects user OS preference.
- **Imagery vibe**: warm-neutral. Hero screenshots are in-app captures of the green/white UI inside a dark `bg-gray-900` browser frame — the dark frame is the *only* neutral-dark surface in marketing.

### Typography

- **Font stack: `'Segoe UI', system-ui, -apple-system, sans-serif`**. **Mono: `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace`**. **No web fonts.** Decision rationale: faster TTFB (no FOUT), native feel on iPhone (San Francisco), familiar to a low-tech-affinity audience.
- **Weights used:** 400 body · 500 buttons / sub-heads · 600 headlines / wordmark · 700 hero stat numbers.
- **Headline scale (marketing):** `text-4xl sm:text-5xl lg:text-6xl` (~36 / 48 / 60 px) for hero H1 with `tracking-tight leading-[1.1]`.
- **Section H2:** `text-3xl sm:text-4xl` (~30 / 36 px), `font-bold`.
- **Body:** `text-base` (16 px) for app forms (avoids iOS auto-zoom on focus), `text-lg sm:text-xl` (18–20 px) for marketing leads.
- **Eyebrow style:** `text-xs uppercase tracking-[1.5px] text-primary font-medium` — used at the top of every feature block.

### Shape & spacing

- **`--radius: 0.75rem` (12 px)** is the base.
  - `sm = radius − 4px = 8 px` → buttons, inputs, small badges.
  - `md = radius − 2px = 10 px` → also buttons/inputs (shadcn default).
  - `lg = 12 px` → cards.
  - `xl = 16 px` → modals, hero pricing card, CTA panels.
  - `2xl = 22 px` → exclusive to the app icon container (`<rect rx="22" />`).
  - `full / 9999px` → only chips / pills / status pills, never on rectangular cards.
- **No hard corners. No extreme rounding** beyond chips. Linear/Vercel-feel.
- **Spacing rhythm:** sections use `py-20 sm:py-28` on desktop (80 / 112 px). Inside, content blocks step `mt-6 / mt-10` (24 / 40 px). Grids use `gap-6` for tight (cards) and `gap-12 / gap-16` for image-and-text alternation.
- **Container:** `max-w-6xl` (1152 px) marketing · `max-w-3xl` for FAQ · the app uses full viewport with a 65 / 17 px sidebar.

### Backgrounds

- **Marketing pages: white `#FFFFFF` with two tint passes for rhythm:** `bg-brand-50/40` (subtle green wash) is reused for *ThreeStepSolution* and *RoiBlock* and *TrustBlock* to break up white sections; `bg-brand-50` (full tint) is reserved for the **FinalCta** section to make the conversion-block stand out.
- **Section dividers:** every section starts with `border-t border-border` — a 1 px hairline in `#E0E0E0`. No gradient dividers, no SVG separators.
- **No hand-drawn illustrations. No textures. No patterns. No full-bleed background gradients.** Imagery is *only* product screenshots / GIFs framed inside a `bg-gray-900` Mac-style window chrome (3 traffic dots) or a `bg-gray-900 rounded-[2rem]` phone bezel.
- **App: pure white `#FFFFFF` content area + dark-green `#004D00` sidebar.** No tinted page backgrounds inside the dashboard.

### Cards & shadows

- **Default card:** `rounded-xl border border-border bg-card shadow-sm` (12 px radius, 1 px `#E0E0E0` border, near-zero shadow). This is *the* card shape — appears in feature blocks, trust cards, ROI tiles, FAQ items.
- **Highlight card** (Pricing "Professional"): `rounded-2xl p-8 border-2 border-primary shadow-xl` — heavier shadow + 2 px green border + amber "BELIEBTESTE WAHL" pill at `-top-3 left-1/2`. Reserve for explicit "this one is the pick" surfaces.
- **Shadow scale (`brand.config.ts`):** `sm 0 1px 3px rgba(0,0,0,0.08)` · `md 0 4px 12px rgba(0,0,0,0.10)` · `lg 0 8px 24px rgba(0,0,0,0.12)`. Restrained — never colored shadows, never neon glows.
- **No protection gradients, no glassmorphism, no bottom-fade overlays.** The single transparency moment is the marketing header: `bg-background/80 backdrop-blur-lg` for the fixed top nav.

### Borders

- All borders are `1px solid #E0E0E0` (`--border`). Status badges add a status-specific 1 px border (e.g. `#99CC99` for ok). Highlighted pricing card uses `border-2 border-primary`. Sidebar uses `border-sidebar-border` = `rgba(255,255,255,0.12)` — a near-invisible separator on dark green.

### Hover & press

- **Buttons primary:** `hover:bg-primary/90` — 10 % opacity bump on the same green, no color shift.
- **Buttons outline:** `hover:bg-accent hover:text-accent-foreground` — surface fades to `#E6F2E6`, text turns brand-green.
- **Buttons ghost:** `hover:bg-accent hover:text-accent-foreground`.
- **Nav links (sidebar):** `hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground` — 10 % white wash on the dark-green sidebar.
- **Marketing nav links:** `hover:text-foreground transition-colors` — color-only fade from muted to foreground.
- **Footer links:** `hover:text-primary` — to brand-green.
- **No press-state shrinks. No bouncy springs.** Just opacity / surface fades.
- **Transition timing:** `transition-base = all 0.15s cubic-bezier(0.4, 0, 0.2, 1)` (a custom Tailwind utility in `globals.css`). Most components use `transition-colors` / `transition-all duration-150 / 200`.

### Animation

- **Minimal.** No mascots, no Lottie, no scroll-jacking. Sidebar collapse uses `transition-all duration-200 ease-in-out`. Mobile nav slide-in uses native sheet behavior.
- **The hero "GIF in a phone frame"** is the single moving piece — a recorded screen-capture of the actual maintenance-checklist UI, looped. It does the job of a video without the chrome of a video player.

### Use of transparency & blur

- **Two well-defined places only:**
  1. **Marketing header** — `bg-background/80 backdrop-blur-lg` so content scrolls under it.
  2. **Sidebar** — `bg-sidebar-accent rgba(255,255,255,0.10)` for the active nav item background. Pure alpha-over-color, no blur.
- Mobile nav overlay: `bg-black/50 backdrop-blur-sm` — light scrim.

### Layout rules

- **Marketing:** centered, max-w-6xl (1152 px), 16-column grid disabled in favor of 2-up image+text and 3-up tile rows. Section padding: `py-20 sm:py-28 px-6`.
- **App:** `lg:flex` shell with a fixed-position sidebar (`w-65 = 260 px` expanded, `w-17 = 68 px` collapsed) on `lg+`, full-width mobile top bar with hamburger on `<lg`. Top bar height 14 (56 px), sidebar logo row height 16 (64 px).
- **Mobile-first:** All buttons hit a 44 px touch target. Inputs use `text-base` to defeat iOS auto-zoom on focus.

---

## ICONOGRAPHY

- **Icon library: [`lucide-react`](https://lucide.dev/)** — used everywhere (`ArrowRightIcon`, `CheckIcon`, `MenuIcon`, `XIcon`, `LayoutDashboardIcon`, `UsersIcon`, `WrenchIcon`, `CalendarIcon`, `ClockIcon`, `ChevronLeftIcon`, `UserCogIcon`, `ClipboardListIcon`, `Package2Icon`, `LogOutIcon`, `GlobeIcon`, `LockIcon`, `MailCheckIcon`, `CheckCircle2Icon`, `EuroIcon`, `ShieldCheckIcon`, `AlertTriangleIcon`, `DatabaseIcon`, `BellRingIcon`, `SmartphoneIcon`).
- **Stroke style:** stroke-only (Lucide default), ~1.5 px stroke width on a 24 px box. Inside text contexts they're sized to `h-4 w-4` (16 px) for inline use, `h-5` for nav, `h-6` for trust cards, `h-8` for ROI tiles. **No filled icons. No two-tone icons. No emoji standing in for icons.**
- **Color rules:** icons inherit `currentColor`. In nav they're `text-sidebar-foreground` and shift to `text-sidebar-primary` (amber) on the *active* item. In feature blocks they're `text-primary` (brand-green). Status icons get the status-text color.
- **In HTML mocks (this design system):** load from CDN via `https://unpkg.com/lucide-static@latest/icons/<name>.svg` or render inline. We've copied the **Torqr brand mark** itself to `assets/`; everything else uses Lucide.
- **Pulse-icon (logo)**: an abgerundetes Quadrat (rx 22 / 96 viewBox) with a white EKG polyline `12,48 26,48 32,22 40,74 48,36 54,58 60,48 84,48` stroke 5.5 px and a single amber dot at `(54, 58) r=6` — visually "the EKG just spiked, anlage is alive". Three variants: `default` (green bg `#008000`), `dark` (deep-green bg `#004D00`), `ghost` (transparent-white bg for use on green sidebar).
- **Emoji:** used sparingly, **only on marketing**. Examples in the wild: `🇩🇪 Made in Germany` flag in footer; `⚡📅📦👥🇪🇺🔌📱` as marketing-list bullet markers in briefing. **Never** in app UI, **never** in customer-facing emails.
- **Unicode-as-icon:** the `▰` (U+25B0) glyph is used as a brand pulse-mark in the hero pill and pilot-status pill. `→` (U+2192) appears in CTA labels (*"30 Tage testen →"*).

---

## CONTENT — what's missing

Things this design system does **not** ship and you'll have to substitute or ask:

- **No actual product screenshots.** The marketing site references `public/marketing/hero/dashboard-desktop.png` and `wartungs-checklist.gif` — these exist in the source repo but are large binary assets we did not import. All UI-kit screens in `ui_kits/web_app/` are HTML/JSX recreations, not pixel-captures.
- **Brand fonts are now shipped** in `/fonts/` as Segoe UI Historic TTFs (`segoeuithis.ttf` regular, `segoeuithibd.ttf` bold, `segoeuithisi.ttf` italic, `segoeuithisz.ttf` bold-italic), wired up via `@font-face` in `colors_and_type.css`. The original briefing decision was "no web fonts" — by uploading these the brand owner has overridden that. On Windows / Office machines where Segoe UI is OS-installed the local copy still wins; otherwise the bundled TTFs render so mocks look on-brand on macOS, Linux, and any embed.

---

*Last updated 2026-04-30 · Built from `Gamble182/torqr_app@main` codebase + `marketing/MARKETING_BRIEFING.md` (2026-04-28).*

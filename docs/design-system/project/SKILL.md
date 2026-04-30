---
name: torqr-design-system
description: Design system for torqr.de — a B2B SaaS Wartungsmanagement-Plattform for German Heizungsbauer (heating engineers / SHK-Fachbetriebe). Brand is Industrie-Grün #008000 + Bernstein-Amber #EF9F27 on white, system-font (Segoe UI), 12px base radius, mobile-first. Use this skill whenever you design, mock, or prototype anything for Torqr — landing pages, dashboards, mobile flows, emails, or marketing material.
---

# Torqr Design System

## When to use

Invoke this skill for any visual or product-design work touching **torqr.de** or the Torqr web app — landing-page sections, dashboard screens, mobile maintenance flows, transactional emails, pricing pages, brand collateral, social cards.

## How to use

1. Read `README.md` first — it explains the two surfaces (marketing site vs. web app), the **Anrede rule** (Du for engineers, Sie for end-customers), tone, and visual foundations.
2. Link `colors_and_type.css` from any HTML mock — it ships every design token (colors, type, radius, shadow, status) as CSS vars + semantic helpers (`.t-h1`, `.t-eyebrow`, `.t-wordmark`, …).
3. Use the SVGs in `assets/` for the logo. Three variants: `torqr-icon.svg` (default green), `torqr-icon-dark.svg` (brand-700 bg), `torqr-icon-ghost-on-green.svg` (for sidebar / on-green surfaces). Wordmark composition is in `assets/torqr-wordmark.svg`.
4. Reference `ui_kits/web_app/dashboard.html` for the in-app vocabulary (sidebar, KPI cards, customer list, system-detail timeline, mobile checklist) and `ui_kits/marketing_site/landing.html` for the marketing vocabulary (hero, pain, 3-step, features, pricing card, FAQ, footer).
5. Open the **Design System** tab to see swatches, type, components and brand cards rendered.

## Hard rules

- **Never** address engineers with "Sie". **Never** address end-customers with "Du".
- **Never** use emoji in app UI or in customer-facing emails. (Marketing only, sparingly: 🇩🇪, ▰.)
- **Never** invent new colors. The palette is fixed: 7 greens, 3 ambers, 6 neutrals, 4 status states.
- **Never** ship Title Case headlines — German uses sentence case + period.
- **Always** show status as bg + border + text triplet (accessibility — must read in monochrome).
- **Always** use system fonts. **No Google Fonts, no Inter, no FOUT.**
- **Always** keep imperative German labels on buttons: *"30 Tage testen"*, *"Demo buchen"*, *"Wartung erfassen"*.

## Tone shortcuts

- Sachlich, technisch, knapp. Numbers > adjectives.
- Ban-list: *revolutionär*, *next-gen*, *Game-Changer*, *AI-powered*, *Disrupt*.
- Headline shape: *"Aus Excel raus. In die Hosentasche rein."* / *"Wartung in 30 Sekunden — vor dem Gerät."*

Source of truth for tokens: `Gamble182/torqr_app@main` → `src/app/globals.css` + `src/styles/brand.config.ts`.

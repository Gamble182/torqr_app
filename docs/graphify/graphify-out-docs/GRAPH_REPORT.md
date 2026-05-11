# Graph Report - docs/  (2026-05-11)

## Corpus Check
- 141 files · ~377,268 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 469 nodes · 512 edges · 55 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_ADRs (Architecture Decisions)|ADRs (Architecture Decisions)]]
- [[_COMMUNITY_Rationales & Approach Decisions|Rationales & Approach Decisions]]
- [[_COMMUNITY_Tenancy + Auth + API Patterns|Tenancy + Auth + API Patterns]]
- [[_COMMUNITY_Design System v3 + Brand|Design System v3 + Brand]]
- [[_COMMUNITY_Docs Meta (CLAUDE, ADR, Workflows)|Docs Meta (CLAUDE, ADR, Workflows)]]
- [[_COMMUNITY_Email & Reminder System|Email & Reminder System]]
- [[_COMMUNITY_Brand Voice & Design Handoff|Brand Voice & Design Handoff]]
- [[_COMMUNITY_Business Model & MVP Strategy|Business Model & MVP Strategy]]
- [[_COMMUNITY_Backlog Archive + API Entry Points|Backlog Archive + API Entry Points]]
- [[_COMMUNITY_System Model + Maintenance Sprints|System Model + Maintenance Sprints]]
- [[_COMMUNITY_Brand Spec + Agent Skill Rules|Brand Spec + Agent Skill Rules]]
- [[_COMMUNITY_Wartungsteile Catalog (PDF)|Wartungsteile Catalog (PDF)]]
- [[_COMMUNITY_Compliance & Legal Backlog|Compliance & Legal Backlog]]
- [[_COMMUNITY_Email Automation Spec + Cron|Email Automation Spec + Cron]]
- [[_COMMUNITY_Projekt-Dokumentation PDF|Projekt-Dokumentation PDF]]
- [[_COMMUNITY_Brand Color Tokens|Brand Color Tokens]]
- [[_COMMUNITY_GDPR & Verarbeitungsvertrag|GDPR & Verarbeitungsvertrag]]
- [[_COMMUNITY_Timesheet Auto-Tracking|Timesheet Auto-Tracking]]
- [[_COMMUNITY_Multi-User + Workload Management|Multi-User + Workload Management]]
- [[_COMMUNITY_Service Worker Bug (Screenshot)|Service Worker Bug (Screenshot)]]
- [[_COMMUNITY_Dashboard Nav Utilities|Dashboard Nav Utilities]]
- [[_COMMUNITY_Card Component Primitives|Card Component Primitives]]
- [[_COMMUNITY_404 Error (Screenshot)|404 Error (Screenshot)]]
- [[_COMMUNITY_TorqrIcon Component|TorqrIcon Component]]
- [[_COMMUNITY_Max Demo Presentation (Jan)|Max Demo Presentation (Jan)]]
- [[_COMMUNITY_Project Cleanup (Jan)|Project Cleanup (Jan)]]
- [[_COMMUNITY_Mobile Responsiveness Plan|Mobile Responsiveness Plan]]
- [[_COMMUNITY_Termine Page + Cal.com Reschedule|Termine Page + Cal.com Reschedule]]
- [[_COMMUNITY_iOS Auto-Zoom Mobile Rationale|iOS Auto-Zoom Mobile Rationale]]
- [[_COMMUNITY_Admin Panel Helper|Admin Panel Helper]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Home Page Marketing|Home Page Marketing]]
- [[_COMMUNITY_FAQ Component|FAQ Component]]
- [[_COMMUNITY_FeatureBlock Component|FeatureBlock Component]]
- [[_COMMUNITY_FinalCta + Hash CTA|FinalCta + Hash CTA]]
- [[_COMMUNITY_Hero Component|Hero Component]]
- [[_COMMUNITY_HeroVisual Component|HeroVisual Component]]
- [[_COMMUNITY_MarketingFooter Component|MarketingFooter Component]]
- [[_COMMUNITY_PainBlock Component|PainBlock Component]]
- [[_COMMUNITY_PilotStatus Component|PilotStatus Component]]
- [[_COMMUNITY_PricingToggle Provider|PricingToggle Provider]]
- [[_COMMUNITY_RoiBlock Component|RoiBlock Component]]
- [[_COMMUNITY_TechStackStrip Component|TechStackStrip Component]]
- [[_COMMUNITY_ThreeStepSolution Component|ThreeStepSolution Component]]
- [[_COMMUNITY_TrustBlock Component|TrustBlock Component]]
- [[_COMMUNITY_Badge UI Primitive|Badge UI Primitive]]
- [[_COMMUNITY_Button UI Primitive|Button UI Primitive]]
- [[_COMMUNITY_Brand Config|Brand Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_FeatureSection Component|FeatureSection Component]]
- [[_COMMUNITY_MarketingHeader Component|MarketingHeader Component]]
- [[_COMMUNITY_Pricing Component|Pricing Component]]
- [[_COMMUNITY_PricingCard Component|PricingCard Component]]
- [[_COMMUNITY_Input UI Primitive|Input UI Primitive]]
- [[_COMMUNITY_ROI Calculator Tool (Backlog Item)|ROI Calculator Tool (Backlog Item)]]

## God Nodes (most connected - your core abstractions)
1. `Backlog — Torqr (single source of truth)` - 31 edges
2. `Torqr Architecture Reference (living document)` - 18 edges
3. `Architecture Decision Log (CHANGELOG.md)` - 11 edges
4. `Marketing Briefing (Living Document)` - 11 edges
5. `Torqr Brand Spec` - 9 edges
6. `Design System Workflow (Visual Handoff)` - 9 edges
7. `Torqr Backlog (Single Source of Truth)` - 8 edges
8. `Wartungsteile Materialmanagement Phase A — Design Spec` - 8 edges
9. `Torqr Design System (project README)` - 8 edges
10. `Marketing & Content Workflow` - 8 edges

## Surprising Connections (you probably didn't know these)
- `PROJEKT_DOKUMENTATION (PDF)` --conceptually_related_to--> `System Model Overhaul Design Spec`  [AMBIGUOUS]
  docs/PROJEKT_DOKUMENTATION.pdf → docs/superpowers/specs/2026-04-17-system-model-overhaul-design.md
- `Marketing Briefing (Living Document)` --references--> `src/styles/brand.config.ts`  [EXTRACTED]
  docs/marketing/MARKETING_BRIEFING.md → src/styles/brand.config.ts
- `Anwalt-Review-Paket — Datenschutz + Impressum` --references--> `src/app/datenschutz/page.tsx (Live Datenschutzerklärung)`  [EXTRACTED]
  docs/legal/2026-05-04-anwalt-review-package.md → src/app/datenschutz/page.tsx
- `Anwalt-Review-Paket — Datenschutz + Impressum` --references--> `src/app/impressum/page.tsx (Live Impressum)`  [EXTRACTED]
  docs/legal/2026-05-04-anwalt-review-package.md → src/app/impressum/page.tsx
- `Cookie Consent + Analytics Implementation Plan` --references--> `src/app/datenschutz/page.tsx (Live Datenschutzerklärung)`  [EXTRACTED]
  docs/superpowers/plans/2026-05-04-cookie-consent-and-analytics.md → src/app/datenschutz/page.tsx

## Hyperedges (group relationships)
- **Design System v3 adoption cluster** — backlog_design_v3_adoption, design_system_delta, delta_d1_status_palette, brand_status_palette_v3, preview_colors_status [EXTRACTED 1.00]
- **Company-as-Tenant architecture cluster** — arch_company_as_tenant, arch_multi_tenancy_rule, arch_auth_helpers, arch_permission_matrix, backlog_sprint_23, adr_2026_04_22_company_tenant, concept_company_id_scoping, concept_owner_technician_roles [EXTRACTED 1.00]
- **RLS Deny-All hardening cluster** — arch_rls_deny_all, backlog_rls_hardening, adr_2026_05_07_rls_hardening, backlog_sprint_22 [EXTRACTED 1.00]
- **Docs Workflow Index (Backlog/Timesheet/Marketing/Design/Graphs)** — backlog_workflow_doc, timesheet_autotrack_doc, marketing_workflow_doc, design_system_workflow_doc, knowledge_graphs_doc, claude_md [EXTRACTED 1.00]
- **Sprint 28 Wartungsteile Bundle (Spec + Plan + Runbook + Verification + Rollback)** — wartungsteile_spec_phase_a, wartungsteile_plan, wartungsteile_runbook, wartungsteile_manual_verification, sprint28_rollback_plan, sprint28_rollback_sql [EXTRACTED 1.00]
- **Sprint 30 Public-Launch Bundle (Design v3 + Cookie Consent + Anwalt + CSP follow-up)** — design_system_v3_adoption_plan, cookie_consent_plan, anwalt_review_package, csp_handover_doc, sprint30_public_launch [EXTRACTED 0.95]

## Communities

### Community 0 - "ADRs (Architecture Decisions)"
Cohesion: 0.04
Nodes (53): ADR 2026-04-13 — Email automation (cron + opt-out), ADR 2026-04-21 — Application-level multi-tenancy, ADR 2026-04-22 — Company-as-Tenant model, ADR 2026-04-29 — Public landing page architecture, ADR 2026-05-07 — Architecture Decision Log convention, ADR 2026-05-07 — Context7 MCP server for current library docs, ADR 2026-05-07 — Documentation refactor: slim CLAUDE.md + ARCHITECTURE.md, ADR 2026-05-07 — RLS deny-all hardening + auto-enforcement event trigger (+45 more)

### Community 1 - "Rationales & Approach Decisions"
Cohesion: 0.06
Nodes (44): Cal.com v2 API In-App Reschedule/Cancel, Rationale: Approach B (TS constants + relational custom items), Immutable JSON Snapshot on Maintenance.checklistData, Rationale: Company-as-Tenant (data survives offboarding), Company Prisma Model (tenant boundary), Company Multi-User Architecture Spec, CustomerSystem (replaces Heater), Rationale: Fail Loudly on Cal.com API failure (no DB desync) (+36 more)

### Community 2 - "Tenancy + Auth + API Patterns"
Cohesion: 0.06
Nodes (41): Anti-Patterns (do not do this), API Route Pattern (auth -> validation -> logic), Auth Helpers — requireAuth/requireOwner/requireRole, Tenancy Model — Company-as-Tenant, Heater form component splitting, Database Layer (Prisma 7 + Supabase Postgres), Frontend Layer (Server vs Client + React Query), Multi-Tenancy Isolation Rule (companyId scoping mandatory) (+33 more)

### Community 3 - "Design System v3 + Brand"
Cohesion: 0.06
Nodes (39): Design System v3 Adoption (2026-04-30), Brand Accent — Bernstein-Amber #EF9F27, Brand Primary — Industrie-Grün #008000, Pulse / Diagnose-Linie Icon (TorqrIcon.tsx), Border Radius Scale, Torqr Brand Spec, Status Dark-Mode Triplets, Status Semantik v3 (Stripe/Linear-style desaturated triplets) (+31 more)

### Community 4 - "Docs Meta (CLAUDE, ADR, Workflows)"
Cohesion: 0.1
Nodes (28): docs/architecture/CHANGELOG.md (ADR log), docs/architecture/ARCHITECTURE.md, docs/BACKLOG.md (Single Source of Truth), Backlog Workflow, /backlog Session-Start Procedure, CLAUDE.md (project root contract), colors_and_type.css (tokens + .t-* helpers), Delta D-1: Status Palette v3 (desaturated Stripe/Linear-feel) (+20 more)

### Community 5 - "Email & Reminder System"
Cohesion: 0.08
Nodes (26): React Query Cache-Miss Bug Pattern (invalidateQueries), User-Customizable Reminder Email Wording, HMAC-Signed Stateless Unsubscribe Token, Layered src/lib/email/ Module Architecture, useUser React Query Hook (Profile + Mutations), Torqr MVP Deployment Guide, Supabase PostgreSQL Database, Vercel Deployment Target (+18 more)

### Community 6 - "Brand Voice & Design Handoff"
Cohesion: 0.12
Nodes (24): src/styles/brand.config.ts, Brand Voice & Anti-Tonality (community), docs/design-system/ (canonical visual handoff), God Node: email-template.html (Wartungsbenachrichtigung), God Node: Torqr (Produkt) — central marketing hub, God Node: TorqrWordmark, Marketing Graph (.graphify-marketing-staging), Marketing Graph Report (+16 more)

### Community 7 - "Business Model & MVP Strategy"
Cohesion: 0.12
Nodes (19): Business Model Canvas — Torqr, MVP Scope Definition, Technical Architecture Agent doc, Next.js 16 App Router + React 19, €20,000/year opportunity cost, ~15,000 Ein-Mann-Heizungsbaubetriebe (DE), Max — primary user persona (Heizungsbauer), Reduce admin time 8h→<2h/week (75%) (+11 more)

### Community 8 - "Backlog Archive + API Entry Points"
Cohesion: 0.13
Nodes (16): docs/BACKLOG-ARCHIVE.md, Backlog Archival Cadence (30-day tripwire), God Node: GET() — most-connected API entry, God Node: POST(), God Node: Torqr Backlog (Single Source of Truth), God Node: Company Multi-User Architecture Spec, God Node: Wartungsteile Phase A Design Spec, Backbone Graph (src/app+lib+hooks) (+8 more)

### Community 9 - "System Model + Maintenance Sprints"
Cohesion: 0.12
Nodes (18): FollowUpJob Prisma Model + CRUD Routes, Four System Types (Heizung/Klima/Wasser/Energiespeicher), Immutable checklistData Json Snapshot on Maintenance, Global SystemCatalog + per-instance CustomerSystem, Plan: Digital Maintenance Checklist (3-Step Modal), Plan: Sprint 20 - Follow-Up Jobs + Install Date Checkbox, Plan: System Model Overhaul (Heater -> CustomerSystem), Spec: Maintenance Checklist Design (+10 more)

### Community 10 - "Brand Spec + Agent Skill Rules"
Cohesion: 0.14
Nodes (15): Wartungserinnerung Email-Template (Platzhalter), Pulse / Diagnose-Linie icon concept, Torqr Brand Spec, Design System Hard Rules, torqr-design-system SKILL.md (agent skill manifest), Anrede Rule — Du for engineers, Sie for end-customers, BOOKING_CONFIRMATION email, Daily reminders cron (06:00 UTC) (+7 more)

### Community 11 - "Wartungsteile Catalog (PDF)"
Cohesion: 0.14
Nodes (14): Ersatzteile, Jahrgang 2026, Serviceteile Kategorien, Preisliste, Serviceteile 2026, Verschleißteile, Hersteller Bosch, Hersteller Junkers (+6 more)

### Community 12 - "Compliance & Legal Backlog"
Cohesion: 0.36
Nodes (9): Anwalt-Review-Paket — Datenschutz + Impressum, Backlog #69 — Datenschutz + Impressum vor Public-Launch finalisieren, Backlog #77 — Cookie-Consent + Analytics, Backlog #94 — Content-Security-Policy Header, Feature: Cookie Consent + Vercel Analytics + PostHog, Cookie Consent + Analytics Implementation Plan, CSP Introduction Handover (Backlog #94), src/app/datenschutz/page.tsx (Live Datenschutzerklärung) (+1 more)

### Community 13 - "Email Automation Spec + Cron"
Cohesion: 0.29
Nodes (8): Account & Settings Page Design Spec, User.companyName / emailWeeklySummary fields, Email Automation Design Spec, Vercel Cron — Daily Reminders + Weekly Summary, Rationale: Verbal-Consent Opt-In (no double opt-in), HMAC-Signed Unsubscribe Token (stateless), Sprint 19 Email Rework Design Spec, Rationale: Actionable Weekly Plan over Stats Dashboard

### Community 14 - "Projekt-Dokumentation PDF"
Cohesion: 0.25
Nodes (8): Architektur, Datenmodell, Deployment, Features, Projektbeschreibung, Roadmap, Projekt Dokumentation, Tech Stack

### Community 15 - "Brand Color Tokens"
Cohesion: 0.48
Nodes (7): Brand Color Industrie-Grün (#008000), Brand Color Signal Orange (#EF9F27), Brand Color Text Dark (#1A1A1A), Brand Tagline: WARTUNGSMANAGEMENT, Torqr Icon (light), Torqr Icon (ghost on green), Torqr Wordmark

### Community 16 - "GDPR & Verarbeitungsvertrag"
Cohesion: 0.33
Nodes (6): GDPR Compliance Framework, emailOptIn CONFIRMED check, Auftragsverarbeitungsvertrag (AV-Vertrag), Double opt-in for email marketing, GDPR + BDSG + UWG + TMG framework, Max as Verantwortlicher (Data Controller)

### Community 17 - "Timesheet Auto-Tracking"
Cohesion: 0.33
Nodes (6): SessionStart + Stop Hooks Writing .claude/state/, Plan: Timesheet Auto-Tracking via Hooks, Spec: Timesheet Auto-Track Design, Torqr MVP Entwicklungszeiterfassung (Timesheet), Auto-Tracking via Claude Hooks (3-Part Structure), Solo-Dev Equivalence + 6.5x Efficiency Factor

### Community 18 - "Multi-User + Workload Management"
Cohesion: 0.33
Nodes (6): AssigneeBadge + One-Click Reassignment + Self-Healing Deactivation, Static fs-based userId Scoping Audit, Plan: Technician Workload Management, Plan: Tenant Isolation Audit Test (Vitest Static Check), Spec: Company Multi-User Architecture, Spec: Technician Workload Management Design

### Community 19 - "Service Worker Bug (Screenshot)"
Cohesion: 0.4
Nodes (5): Cause: Service Worker caching chrome-extension:// scheme (unsupported), GET http://localhost:3000/ 404 (Not Found), TypeError: Failed to execute 'put' on 'Cache' (sw.js:53), Error Screenshot 2025-12-11 22:42:16, Browser DevTools Console (localhost:3000)

### Community 20 - "Dashboard Nav Utilities"
Cohesion: 0.5
Nodes (0): 

### Community 21 - "Card Component Primitives"
Cohesion: 0.5
Nodes (0): 

### Community 22 - "404 Error (Screenshot)"
Cohesion: 0.5
Nodes (4): Likely cause: Missing root route or not-found handler, 404 - This page could not be found, Error Screenshot 2025-12-11 22:41:23, Next.js Dev Server (localhost:3000)

### Community 23 - "TorqrIcon Component"
Cohesion: 0.67
Nodes (1): TorqrIcon()

### Community 24 - "Max Demo Presentation (Jan)"
Cohesion: 0.67
Nodes (3): Demo color palette (Oxford Blue, Teal, etc.), Max Demo Preparation Plan, Presentation Checklist (2026-01-14)

### Community 25 - "Project Cleanup (Jan)"
Cohesion: 0.67
Nodes (3): ESLint warnings reduced 22→7, middleware.ts → proxy.ts (deprecation), Project Cleanup (2026-01-09)

### Community 26 - "Mobile Responsiveness Plan"
Cohesion: 0.67
Nodes (3): iOS Auto-Zoom Prevention via text-base (>=16px), Plan: Mobile Responsiveness (375px+), Spec: Mobile Responsiveness Design

### Community 27 - "Termine Page + Cal.com Reschedule"
Cohesion: 0.67
Nodes (3): Cal.com v2 REST Client + Webhook Reconciliation, Plan: Termine Page (/dashboard/termine), Spec: Termine Page Design

### Community 28 - "iOS Auto-Zoom Mobile Rationale"
Cohesion: 0.67
Nodes (3): Rationale: text-base on inputs to prevent iOS auto-zoom, Mobile Responsiveness Design Spec, 44x44px Touch Target Rule (Apple HIG)

### Community 29 - "Admin Panel Helper"
Cohesion: 1.0
Nodes (2): requireAdmin() Helper via ADMIN_EMAILS env, Plan: Admin Panel (/admin route tree)

### Community 30 - "Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Home Page Marketing"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "FAQ Component"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "FeatureBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "FinalCta + Hash CTA"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Hero Component"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "HeroVisual Component"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "MarketingFooter Component"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "PainBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "PilotStatus Component"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "PricingToggle Provider"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "RoiBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "TechStackStrip Component"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "ThreeStepSolution Component"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "TrustBlock Component"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Badge UI Primitive"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Button UI Primitive"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Brand Config"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "FeatureSection Component"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "MarketingHeader Component"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Pricing Component"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "PricingCard Component"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Input UI Primitive"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "ROI Calculator Tool (Backlog Item)"
Cohesion: 1.0
Nodes (1): Item #91 — ROI-Rechner-Tool inline CTA

## Ambiguous Edges - Review These
- `System Model Overhaul Design Spec` → `PROJEKT_DOKUMENTATION (PDF)`  [AMBIGUOUS]
  docs/PROJEKT_DOKUMENTATION.pdf · relation: conceptually_related_to

## Knowledge Gaps
- **199 isolated node(s):** `Delete old Supabase project (eu-west-1)`, `CatalogPicker onChange null clear semantics`, `Calendar drag-and-drop rescheduling`, `CSV/Excel customer import`, `PDF Arbeitsbericht export (Maybe/Future)` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Admin Panel Helper`** (2 nodes): `requireAdmin() Helper via ADMIN_EMAILS env`, `Plan: Admin Panel (/admin route tree)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page Marketing`** (2 nodes): `page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FAQ Component`** (2 nodes): `Faq.tsx`, `Faq()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FeatureBlock Component`** (2 nodes): `FeatureBlock.tsx`, `FeatureBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FinalCta + Hash CTA`** (2 nodes): `FinalCta.tsx`, `setFromHash()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hero Component`** (2 nodes): `Hero.tsx`, `Hero()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HeroVisual Component`** (2 nodes): `HeroVisual.tsx`, `HeroVisual()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MarketingFooter Component`** (2 nodes): `MarketingFooter.tsx`, `MarketingFooter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PainBlock Component`** (2 nodes): `PainBlock.tsx`, `PainBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PilotStatus Component`** (2 nodes): `PilotStatus.tsx`, `PilotStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PricingToggle Provider`** (2 nodes): `PricingToggle.tsx`, `PricingProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RoiBlock Component`** (2 nodes): `RoiBlock.tsx`, `RoiBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TechStackStrip Component`** (2 nodes): `TechStackStrip.tsx`, `TechStackStrip()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ThreeStepSolution Component`** (2 nodes): `ThreeStepSolution.tsx`, `ThreeStepSolution()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TrustBlock Component`** (2 nodes): `TrustBlock.tsx`, `TrustBlock()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Badge UI Primitive`** (2 nodes): `Badge()`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Button UI Primitive`** (2 nodes): `cn()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Config`** (1 nodes): `brand.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FeatureSection Component`** (1 nodes): `FeatureSection.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MarketingHeader Component`** (1 nodes): `MarketingHeader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pricing Component`** (1 nodes): `Pricing.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PricingCard Component`** (1 nodes): `PricingCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Input UI Primitive`** (1 nodes): `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ROI Calculator Tool (Backlog Item)`** (1 nodes): `Item #91 — ROI-Rechner-Tool inline CTA`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `System Model Overhaul Design Spec` and `PROJEKT_DOKUMENTATION (PDF)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Torqr Architecture Reference (living document)` connect `Tenancy + Auth + API Patterns` to `ADRs (Architecture Decisions)`, `Business Model & MVP Strategy`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Wartungserinnerung Email-Template (Platzhalter)` connect `Brand Spec + Agent Skill Rules` to `ADRs (Architecture Decisions)`, `Design System v3 + Brand`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Email Subsystem (Resend + React Email)` connect `ADRs (Architecture Decisions)` to `Tenancy + Auth + API Patterns`, `Brand Spec + Agent Skill Rules`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `Delete old Supabase project (eu-west-1)`, `CatalogPicker onChange null clear semantics`, `Calendar drag-and-drop rescheduling` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ADRs (Architecture Decisions)` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Rationales & Approach Decisions` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
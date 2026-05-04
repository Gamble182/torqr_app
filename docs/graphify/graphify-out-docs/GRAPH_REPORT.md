# Graph Report - docs/ (Documentation)  (2026-04-27)

## Corpus Check
- 64 files · ~186,887 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 190 nodes · 194 edges · 24 communities detected
- Extraction: 79% EXTRACTED · 20% INFERRED · 1% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_System & Maintenance Domain Models|System & Maintenance Domain Models]]
- [[_COMMUNITY_Architecture v1 Foundation|Architecture v1 Foundation]]
- [[_COMMUNITY_Sprint Plans (SystemMaintenance)|Sprint Plans (System/Maintenance)]]
- [[_COMMUNITY_Account Page & Email Rework|Account Page & Email Rework]]
- [[_COMMUNITY_Multi-Tenant Auth & Cal.com|Multi-Tenant Auth & Cal.com]]
- [[_COMMUNITY_Brand & Email Templates|Brand & Email Templates]]
- [[_COMMUNITY_Deployment & Setup Guides|Deployment & Setup Guides]]
- [[_COMMUNITY_Business Model & MVP Scope|Business Model & MVP Scope]]
- [[_COMMUNITY_Project State (Jan 2026)|Project State (Jan 2026)]]
- [[_COMMUNITY_Open Backlog Items|Open Backlog Items]]
- [[_COMMUNITY_Email Automation Spec|Email Automation Spec]]
- [[_COMMUNITY_GDPR Compliance|GDPR Compliance]]
- [[_COMMUNITY_Timesheet Auto-Tracking|Timesheet Auto-Tracking]]
- [[_COMMUNITY_Technician Workload & Tenant Audit|Technician Workload & Tenant Audit]]
- [[_COMMUNITY_Demo Preparation|Demo Preparation]]
- [[_COMMUNITY_Project Cleanup (Jan 2026)|Project Cleanup (Jan 2026)]]
- [[_COMMUNITY_Mobile Responsiveness Plan|Mobile Responsiveness Plan]]
- [[_COMMUNITY_Termine Page|Termine Page]]
- [[_COMMUNITY_Mobile Touch & iOS Zoom Rules|Mobile Touch & iOS Zoom Rules]]
- [[_COMMUNITY_TorqrIcon Component|TorqrIcon Component]]
- [[_COMMUNITY_Admin Panel|Admin Panel]]
- [[_COMMUNITY_Timesheet Three-Part Structure|Timesheet Three-Part Structure]]
- [[_COMMUNITY_Brand Config|Brand Config]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]

## God Nodes (most connected - your core abstractions)
1. `Torqr Backlog (Single Source of Truth)` - 8 edges
2. `Plan: Email Automation (Resend, Cron, Unsubscribe)` - 7 edges
3. `Company Multi-User Architecture Spec` - 7 edges
4. `Wartungsteile Phase A — Design Spec` - 6 edges
5. `System Model Overhaul Design Spec` - 6 edges
6. `Email System Reference` - 5 edges
7. `Torqr Documentation Index` - 5 edges
8. `Architecture Documentation v1.0.0` - 5 edges
9. `React Query (TanStack Query v5) integration` - 5 edges
10. `Business Model Canvas — Torqr` - 5 edges

## Surprising Connections (you probably didn't know these)
- `PROJEKT_DOKUMENTATION (PDF)` --conceptually_related_to--> `System Model Overhaul Design Spec`  [AMBIGUOUS]
  docs/PROJEKT_DOKUMENTATION.pdf → docs/superpowers/specs/2026-04-17-system-model-overhaul-design.md
- `Project State 2026-01-13` --semantically_similar_to--> `Current Status 2026-01-13`  [INFERRED] [semantically similar]
  docs/archive/PROJECT-STATE-2026-01-13.md → docs/archive/CURRENT-STATUS-2026-01-13.md
- `Projekt Dokumentation (Max)` --semantically_similar_to--> `Current Status 2026-01-13`  [INFERRED] [semantically similar]
  docs/business/PROJEKT_DOKUMENTATION.md → docs/archive/CURRENT-STATUS-2026-01-13.md
- `RESEND_API_KEY (Email Service)` --implements--> `Plan: Email Automation (Resend, Cron, Unsubscribe)`  [INFERRED]
  docs/deployment/VERCEL_ENV_SETUP.md → docs/superpowers/plans/2026-04-13-email-automation.md
- `Project State 2026-01-13` --references--> `React Query (TanStack Query v5) integration`  [EXTRACTED]
  docs/archive/PROJECT-STATE-2026-01-13.md → docs/architecture/ARCHITECTURE.md

## Hyperedges (group relationships)
- **Daily reminder email pipeline** — email_cron_daily, email_optin_check, email_dedup_logic, email_reminder_4w, email_reminder_1w [EXTRACTED 0.95]
- **v1.0.0 production-ready architectural shift** — arch_react_query, arch_component_split, changelog_perf_60pct, changelog_v1_release [EXTRACTED 0.90]
- **MVP planning agent trio (BMC + Scope + Tech Arch)** — agent_bmc, agent_mvp_scope, agent_tech_arch, agent_gdpr [INFERRED 0.85]
- **Tenant Isolation Architecture (Company-as-Tenant)** — company_multiuser_spec, multi_tenancy_spec, isolation_contract, company_model, owner_technician_role_model [EXTRACTED 1.00]
- **Wartungsteile Phase A — Hybrid Anchor Pattern** — wartungsteile_spec_phase_a, wartungsteile_maintenance_set_model, wartungsteile_override_model, wartungsteile_inventory_model, wartungsteile_effective_parts_resolver [EXTRACTED 1.00]
- **System-Centric Data Model (Catalog + Instance + Photos + Checklist + Followups)** — system_catalog_model, customer_system_model, system_photos_spec, maintenance_checklist_spec, follow_up_job_model [INFERRED 0.85]

## Communities

### Community 0 - "System & Maintenance Domain Models"
Cohesion: 0.12
Nodes (21): Rationale: Approach B (TS constants + relational custom items), Immutable JSON Snapshot on Maintenance.checklistData, CustomerSystem (replaces Heater), FollowUpJob Prisma Model, Maintenance Checklist Design Spec, PROJEKT_DOKUMENTATION (PDF), Sprint 20 Follow-Ups + Install Date Spec, SystemCatalog (global device catalog) (+13 more)

### Community 1 - "Architecture v1 Foundation"
Cohesion: 0.12
Nodes (20): Technical Architecture Agent doc, Heater form component splitting, Next.js 16 App Router + React 19, Query config: 5min staleTime, 30min gcTime, React Query (TanStack Query v5) integration, Supabase PostgreSQL database, Architecture Documentation v1.0.0, Max — primary user persona (Heizungsbauer) (+12 more)

### Community 2 - "Sprint Plans (System/Maintenance)"
Cohesion: 0.12
Nodes (18): FollowUpJob Prisma Model + CRUD Routes, Four System Types (Heizung/Klima/Wasser/Energiespeicher), Immutable checklistData Json Snapshot on Maintenance, Global SystemCatalog + per-instance CustomerSystem, Plan: Digital Maintenance Checklist (3-Step Modal), Plan: Sprint 20 - Follow-Up Jobs + Install Date Checkbox, Plan: System Model Overhaul (Heater -> CustomerSystem), Spec: Maintenance Checklist Design (+10 more)

### Community 3 - "Account Page & Email Rework"
Cohesion: 0.15
Nodes (14): React Query Cache-Miss Bug Pattern (invalidateQueries), User-Customizable Reminder Email Wording, HMAC-Signed Stateless Unsubscribe Token, Layered src/lib/email/ Module Architecture, useUser React Query Hook (Profile + Mutations), Plan: Account & Settings Page, Plan: Email Automation (Resend, Cron, Unsubscribe), Plan: Sprint 19 - Email Rework (Actionable Weekly Plan) (+6 more)

### Community 4 - "Multi-Tenant Auth & Cal.com"
Cohesion: 0.18
Nodes (14): Cal.com v2 API In-App Reschedule/Cancel, Rationale: Company-as-Tenant (data survives offboarding), Company Prisma Model (tenant boundary), Company Multi-User Architecture Spec, Rationale: Fail Loudly on Cal.com API failure (no DB desync), Isolation Contract: requireAuth + companyId scope invariant, Multi-Tenancy Strategy (User-as-Tenant), Rationale: No RLS — Prisma + NextAuth, app-layer isolation (+6 more)

### Community 5 - "Brand & Email Templates"
Cohesion: 0.18
Nodes (12): Brand email HTML template, Pulse / Diagnose-Linie icon concept, Torqr Brand Spec, BOOKING_CONFIRMATION email, Daily reminders cron (06:00 UTC), Weekly summary cron (Mon 07:00 UTC), 30-day deduplication on reminders, REMINDER_1_WEEK email (+4 more)

### Community 6 - "Deployment & Setup Guides"
Cohesion: 0.17
Nodes (12): Torqr MVP Deployment Guide, Supabase PostgreSQL Database, Vercel Deployment Target, Torqr Developer Setup Guide, AUTH_SECRET / JWT_SECRET, DATABASE_URL (Pooled Connection), DIRECT_URL (Direct DB for Migrations), RESEND_API_KEY (Email Service) (+4 more)

### Community 7 - "Business Model & MVP Scope"
Cohesion: 0.22
Nodes (11): Business Model Canvas — Torqr, MVP Scope Definition, €20,000/year opportunity cost, ~15,000 Ein-Mann-Heizungsbaubetriebe (DE), Reduce admin time 8h→<2h/week (75%), Phased payment 2.000€ + 3.000€ (5.000€ total), 8-week MVP principle (simple+valuable), MoSCoW feature prioritization (+3 more)

### Community 8 - "Project State (Jan 2026)"
Cohesion: 0.18
Nodes (11): Current Status 2026-01-13, German UI localization (Customer pages), Custom MultiSelect component, Development Progress (Jan 8 2026), Project State 2026-01-13, bcryptjs SALT_ROUNDS=12 password hashing, NextAuth v5 session management, Security Audit Checklist (+3 more)

### Community 9 - "Open Backlog Items"
Cohesion: 0.29
Nodes (8): Cal.com multi-tenant strategy decision, Calendar drag-and-drop rescheduling, CatalogPicker onChange null clear semantics, CSV/Excel customer import, Multi-system booking for shared maintenance interval, PDF Arbeitsbericht export (Maybe/Future), Torqr Backlog (Single Source of Truth), Delete old Supabase project (eu-west-1)

### Community 10 - "Email Automation Spec"
Cohesion: 0.29
Nodes (8): Account & Settings Page Design Spec, User.companyName / emailWeeklySummary fields, Email Automation Design Spec, Vercel Cron — Daily Reminders + Weekly Summary, Rationale: Verbal-Consent Opt-In (no double opt-in), HMAC-Signed Unsubscribe Token (stateless), Sprint 19 Email Rework Design Spec, Rationale: Actionable Weekly Plan over Stats Dashboard

### Community 11 - "GDPR Compliance"
Cohesion: 0.33
Nodes (6): GDPR Compliance Framework, emailOptIn CONFIRMED check, Auftragsverarbeitungsvertrag (AV-Vertrag), Double opt-in for email marketing, GDPR + BDSG + UWG + TMG framework, Max as Verantwortlicher (Data Controller)

### Community 12 - "Timesheet Auto-Tracking"
Cohesion: 0.33
Nodes (6): SessionStart + Stop Hooks Writing .claude/state/, Plan: Timesheet Auto-Tracking via Hooks, Spec: Timesheet Auto-Track Design, Torqr MVP Entwicklungszeiterfassung (Timesheet), Auto-Tracking via Claude Hooks (3-Part Structure), Solo-Dev Equivalence + 6.5x Efficiency Factor

### Community 13 - "Technician Workload & Tenant Audit"
Cohesion: 0.33
Nodes (6): AssigneeBadge + One-Click Reassignment + Self-Healing Deactivation, Static fs-based userId Scoping Audit, Plan: Technician Workload Management, Plan: Tenant Isolation Audit Test (Vitest Static Check), Spec: Company Multi-User Architecture, Spec: Technician Workload Management Design

### Community 14 - "Demo Preparation"
Cohesion: 0.67
Nodes (3): Demo color palette (Oxford Blue, Teal, etc.), Max Demo Preparation Plan, Presentation Checklist (2026-01-14)

### Community 15 - "Project Cleanup (Jan 2026)"
Cohesion: 0.67
Nodes (3): ESLint warnings reduced 22→7, middleware.ts → proxy.ts (deprecation), Project Cleanup (2026-01-09)

### Community 16 - "Mobile Responsiveness Plan"
Cohesion: 0.67
Nodes (3): iOS Auto-Zoom Prevention via text-base (>=16px), Plan: Mobile Responsiveness (375px+), Spec: Mobile Responsiveness Design

### Community 17 - "Termine Page"
Cohesion: 0.67
Nodes (3): Cal.com v2 REST Client + Webhook Reconciliation, Plan: Termine Page (/dashboard/termine), Spec: Termine Page Design

### Community 18 - "Mobile Touch & iOS Zoom Rules"
Cohesion: 0.67
Nodes (3): Rationale: text-base on inputs to prevent iOS auto-zoom, Mobile Responsiveness Design Spec, 44x44px Touch Target Rule (Apple HIG)

### Community 19 - "TorqrIcon Component"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Admin Panel"
Cohesion: 1.0
Nodes (2): requireAdmin() Helper via ADMIN_EMAILS env, Plan: Admin Panel (/admin route tree)

### Community 21 - "Timesheet Three-Part Structure"
Cohesion: 1.0
Nodes (2): Timesheet Auto-Tracking Design Spec, TIMESHEET.md Three-Part Structure (MVP / Retro / Live)

### Community 22 - "Brand Config"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Tailwind Config"
Cohesion: 1.0
Nodes (0): 

## Ambiguous Edges - Review These
- `System Model Overhaul Design Spec` → `PROJEKT_DOKUMENTATION (PDF)`  [AMBIGUOUS]
  docs/PROJEKT_DOKUMENTATION.pdf · relation: conceptually_related_to

## Knowledge Gaps
- **85 isolated node(s):** `Delete old Supabase project (eu-west-1)`, `CatalogPicker onChange null clear semantics`, `Calendar drag-and-drop rescheduling`, `CSV/Excel customer import`, `PDF Arbeitsbericht export (Maybe/Future)` (+80 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `TorqrIcon Component`** (2 nodes): `TorqrIcon.tsx`, `TorqrIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Panel`** (2 nodes): `requireAdmin() Helper via ADMIN_EMAILS env`, `Plan: Admin Panel (/admin route tree)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Timesheet Three-Part Structure`** (2 nodes): `Timesheet Auto-Tracking Design Spec`, `TIMESHEET.md Three-Part Structure (MVP / Retro / Live)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Config`** (1 nodes): `brand.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `System Model Overhaul Design Spec` and `PROJEKT_DOKUMENTATION (PDF)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Plan: Email Automation (Resend, Cron, Unsubscribe)` connect `Account Page & Email Rework` to `Sprint Plans (System/Maintenance)`, `Deployment & Setup Guides`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Torqr Documentation Index` connect `Architecture v1 Foundation` to `Open Backlog Items`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Plan: Email Automation (Resend, Cron, Unsubscribe)` (e.g. with `RESEND_API_KEY (Email Service)` and `Sprint 4: Email-Automation & Benachrichtigungen`) actually correct?**
  _`Plan: Email Automation (Resend, Cron, Unsubscribe)` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Wartungsteile Phase A — Design Spec` (e.g. with `Company Multi-User Architecture Spec` and `System Model Overhaul Design Spec`) actually correct?**
  _`Wartungsteile Phase A — Design Spec` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Delete old Supabase project (eu-west-1)`, `CatalogPicker onChange null clear semantics`, `Calendar drag-and-drop rescheduling` to the rest of the system?**
  _85 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `System & Maintenance Domain Models` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
# Torqr — Documentation Index

All project documentation, organized by topic.

---

## Root files (active working docs)

| File | Purpose |
|------|---------|
| [BACKLOG.md](./BACKLOG.md) | Single source of truth for open and completed tasks |
| [../SPRINT.md](../SPRINT.md) | Current sprint state — read/update every session |
| [../CLAUDE.md](../CLAUDE.md) | AI assistant configuration and backlog workflow |

---

## Folder Structure

### `/architecture`
System design, tech decisions, version history
- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) — React Query integration, component structure, data flow patterns
- [CHANGELOG.md](./architecture/CHANGELOG.md) — Version history and release notes

### `/sprints`
Sprint plans and execution records
- [SPRINT-02-CUSTOMER-MANAGEMENT.md](./sprints/SPRINT-02-CUSTOMER-MANAGEMENT.md)
- [SPRINT-03-HEATER-MAINTENANCE.md](./sprints/SPRINT-03-HEATER-MAINTENANCE.md)
- [SPRINT-04-EMAIL-AUTOMATION.md](./sprints/SPRINT-04-EMAIL-AUTOMATION.md)

### `/development`
Developer setup, guides, and troubleshooting
- [DEVELOPER-SETUP-GUIDE.md](./development/DEVELOPER-SETUP-GUIDE.md) — Local environment setup
- [REACT_QUERY_GUIDE.md](./development/REACT_QUERY_GUIDE.md) — Quick reference for all hooks and patterns
- [SUPABASE_CONNECTION_TROUBLESHOOTING.md](./development/SUPABASE_CONNECTION_TROUBLESHOOTING.md) — DB connection debugging
- [TIMESHEET.md](./development/TIMESHEET.md) — Time tracking and MVP cost calculator

### `/deployment`
Production and environment configuration
- [DEPLOYMENT.md](./deployment/DEPLOYMENT.md) — Vercel deployment guide
- [VERCEL_ENV_SETUP.md](./deployment/VERCEL_ENV_SETUP.md) — ⚠️ Environment variable reference (contains secrets — do not publish)

### `/testing`
Test cases and credentials
- [TESTING_CHECKLIST.md](./testing/TESTING_CHECKLIST.md) — 170+ test cases
- [TEST-CREDENTIALS.md](./testing/TEST-CREDENTIALS.md) — Dev/test user credentials

### `/business`
Client-facing and business documentation
- [PROJEKT_DOKUMENTATION.md](./business/PROJEKT_DOKUMENTATION.md) — ⚠️ Pilot-Übergabe-Snapshot (Jan 2026, veraltet — siehe Banner im Dokument)
- [KOSTENAUFSTELLUNG_TORQR.md](./business/KOSTENAUFSTELLUNG_TORQR.md) — Pilotkunden-Vertragspreis (kein SaaS-Pricing)

### `/marketing`
Outward-facing positioning and brand assets
- [MARKETING_BRIEFING.md](./marketing/MARKETING_BRIEFING.md) — **Single source of truth** für Marketing-Agenten / Brand-Management / Landingpage / Pricing

### `/archive`
Outdated snapshots kept for historical reference
- `CURRENT-STATUS-2026-01-13.md` — Status snapshot at v1.0.0
- `PROJECT-STATE-2026-01-13.md` — Project state at v1.0.0
- `DEVELOPMENT-PROGRESS.md` — Sprint 1–2 progress log
- `PRESENTATION-CHECKLIST-2026-01-14.md` — Demo prep for Max (Jan 2026)
- `agent-01-*`, `agent-02-*`, `agent-04-*` — Initial planning agent outputs

### `/superpowers`
AI-generated specs and implementation plans
- `specs/2026-04-13-email-automation-design.md`
- `plans/2026-04-13-email-automation.md`

---

**Last Updated:** 2026-04-28

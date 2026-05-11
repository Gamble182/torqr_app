# Backlog Archive — Torqr

> Erledigte Items älter als 30 Tage. Aktueller Backlog: [BACKLOG.md](./BACKLOG.md).
> Format identisch zur Hauptdatei. **Newest-first**: neu archivierte Sprints werden oben angehängt.
> Inhalt wird verbatim übertragen — nicht zusammengefasst, nicht umformuliert.

Archive-Regel siehe [development/BACKLOG-WORKFLOW.md § Archival cadence](./development/BACKLOG-WORKFLOW.md).

---

## Completed / Resolved (archived)

### Sprint 3 — Heater & Maintenance Management + Architecture (2026-01-13)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S3-1 | Backend | Heater CRUD API with category/manufacturer/model structure. | 2026-01-13 |
| S3-2 | Backend | Maintenance CRUD API with photo upload. | 2026-01-13 |
| S3-3 | Backend | Supabase Storage for maintenance photos. | 2026-01-13 |
| S3-4 | Backend | Dashboard stats API — overdue/upcoming counts. | 2026-01-13 |
| S3-5 | UI | Heater list, detail, maintenance form, overview page, dashboard. | 2026-01-13 |
| S3-6 | UI | HeatingSystemSelector — cascading category → manufacturer → model. | 2026-01-13 |
| S3-7 | UI | AddNewEntryModal, StorageFields, BatteryFields, Pagination. | 2026-01-13 |
| A-1 | Architecture | TanStack Query v5 integration — global QueryClient, 5-min stale time. | 2026-01-13 |
| A-2 | Hooks | `useCustomers`, `useHeaters`, `useMaintenances`, `useDashboard` hooks. | 2026-01-13 |
| A-3 | Infra | Production deployment on Vercel — initial setup. | 2026-01-13 |

### Sprint 2 — Customer Management (2026-01-08)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S2-1 | Backend | Customer CRUD API with Zod validation. | 2026-01-08 |
| S2-2 | UI | Customer list, create/edit forms, detail page, MultiSelect, toast notifications. | 2026-01-08 |
| S2-3 | Config | `heating-systems.json` — 9 categories, 30+ manufacturers. | 2026-01-08 |

### Sprint 1 — Authentication & Setup (2026-01-08)

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| S1-1 | Auth | NextAuth v5 with email/password, protected routes, session management. | 2026-01-08 |
| S1-2 | Security | CSRF protection, rate limiting, bcrypt password hashing, login logging. | 2026-01-08 |
| S1-3 | DB | Prisma schema — User, Customer, Heater, Maintenance models. Supabase PostgreSQL (eu-west-1). | 2026-01-08 |
| S1-4 | UI | Login and register pages. | 2026-01-08 |

---

## Changelog

- **2026-05-11** — Initial archive. Sprint 1, 2, 3 (Januar-Initial-Setup) aus `BACKLOG.md` verschoben, da > 30 Tage alt. Regel in [BACKLOG-WORKFLOW.md § Archival cadence](./development/BACKLOG-WORKFLOW.md) hinterlegt.

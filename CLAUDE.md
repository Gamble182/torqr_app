# CLAUDE.md — Torqr App

This file is Claude's always-on contract for this repo: load-bearing rules, an index of where deeper docs live, and the self-maintenance rule that keeps the index honest.

For full architecture detail see [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md). For ADRs see [docs/architecture/CHANGELOG.md](docs/architecture/CHANGELOG.md). For procedural workflows see the linked docs under `docs/development/`.

---

## Project Snapshot

**Torqr** = SaaS für Heizungsbauer (Wartungsmanagement, Kunden, Anlagen, Termine). Live: torqr.de (Vercel). DB: Supabase Postgres (eu-west-1).

- **Domain language**: Deutsch (alle User-facing Texte). Code/Variablen/Kommentare: Englisch.
- **Branch model**: nur `main` long-lived. Feature work auf `feature/<slug>`, dann merge in `main`.

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth v5 (email/password) |
| ORM | Prisma |
| Database | Supabase PostgreSQL |
| Email | Resend + React Email |
| Booking | Cal.com (webhook) |
| Data fetching | React Query |
| Validation | Zod |
| Testing | Jest |
| Deployment | Vercel |

| Purpose | Path |
|---------|------|
| API routes | `src/app/api/` |
| Pages | `src/app/dashboard/` |
| Components | `src/components/` |
| React Query hooks | `src/hooks/` |
| Business logic / services | `src/lib/` |
| Email service | `src/lib/email/service.tsx` |
| Auth helpers | `src/lib/auth-helpers.ts` |
| Prisma client | `src/lib/prisma.ts` |
| Zod schemas | `src/lib/validations.ts` |
| Middleware | `src/middleware.ts` |
| Backlog | `docs/BACKLOG.md` |
| Sprint docs | `docs/SPRINT-*.md` |

---

## Developer Profile

Senior SAP Developer & Consultant (BTP, CAP, RAP, UI5/Fiori). In this project full-stack Next.js/React. Frame explanations from a backend/typed-system perspective. Prefers structure over speed, deterministic behavior over trial-and-error.

---

## Communication Style

- Präzise, strukturiert, technische Begründung.
- Bullet points, klare Sections, keine Fülltexte.
- Alle User-facing Strings + Fehlermeldungen: **Deutsch**. Code, Kommentare, Variablen: **Englisch**.
- Bei mehreren Lösungen: 2–3 Zeilen Vergleich → eine Empfehlung → 2–4 Bullets Begründung. Nie alle Optionen ohne Empfehlung dumpen.

---

## Core Principles

1. **Structure over Speed** — saubere skalierbare Lösung zuerst; Shortcuts nur explizit angefragt.
2. **Determinism over Guessing** — keine vagen Annahmen; explizit machen.
3. **Minimalism with Depth** — keine unnötige Abstraktion, aber tiefe Korrektheit wo's zählt.
4. **Consistency First** — Naming, Folder, API-Shape folgen dem etablierten Pattern.
5. **Explain Decisions, not Basics** — Offensichtliches überspringen; Fokus auf das *Warum*.

---

## Architecture & Code — Always-On Rules

> Volldetail in [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

### Multi-Tenancy Isolation Rule (load-bearing)

Torqr nutzt shared-database, **Company-as-Tenant**. Tenant-Isolation lebt ausschließlich im App-Code. Jede API-Route, die eine tenant-eigene Tabelle (`Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `FollowUpJob`, `EmailLog`) liest oder schreibt, **muss** mit `companyId` aus `requireAuth()` scopen.

```typescript
// CORRECT — tenant scoping via companyId
const { userId, companyId } = await requireAuth();
prisma.customer.findUnique({ where: { id, companyId } });

// CORRECT — userId als Audit-Feld bei create
prisma.maintenance.create({ data: { ..., companyId, userId } });

// WRONG — userId ist kein Tenant-Boundary mehr
prisma.customer.findMany({ where: { userId } });

// WRONG — companyId NIE vom Client
const { companyId } = req.body;
```

**Role helpers** (in `src/lib/auth-helpers.ts`):
- `requireAuth()` → `{ userId, companyId, role, email, name }` — alle authenticated routes
- `requireOwner()` → wirft `Forbidden` wenn nicht OWNER — delete, employee management, company settings
- `requireRole(['OWNER', 'TECHNICIAN'])` → parametrisierter Role-Check

**Exceptions** (KEINE companyId-Scoping hier): `src/app/api/admin/*` (requireAdmin), `src/app/api/cron/*` (CRON_SECRET), `src/app/api/webhooks/cal` (resolved aus Payload), `src/app/api/catalog` (global), `src/app/api/email/unsubscribe` (HMAC), `src/app/api/user/*` (own-record).

### API Route Pattern

`requireAuth()` zuerst → Zod validation → Logic. Response `{ data | error, status }`. Rate-Limiting via Middleware.

### RLS Deny-All — was NICHT tun

- **Never** `FORCE ROW LEVEL SECURITY` setzen — würde Prisma blockieren.
- **Never** `anon`/`authenticated` Postgres-Rollen Privilegien geben.
- **Never** das Event-Trigger `apply_rls_to_new_table` oder die Helper-Function ohne Replacement droppen — schützt vor PostgREST-Leaks.

Verifikation: Supabase Advisor → Security → 0 `rls_disabled_in_public` Lints.

### Code Quality Rules

- Kein global mutable state. Keine versteckten Side-Effects in Components.
- Funktionen klein, predictable, testable. Pure Functions bevorzugen.
- TypeScript: kein `any`, keine suppressed errors.
- Zod Schemas sind Single Source of Truth für Input Shapes.

### Anti-Patterns to Avoid

- Business logic in `page.tsx` files
- Datenfetching außerhalb React Query Hooks
- Hardcoded `localhost` URLs
- Magic strings — Constants oder Zod Enums nutzen
- `useEffect` für Datenfetching
- Cross-tenant queries (fehlendes `companyId`-Scope)
- `companyId` aus dem Client-Body
- Direktes Editieren von `src/components/ui/` (shadcn-Primitives — re-add via CLI)
- Hardcoded Hex-Werte — Tokens aus `globals.css` / `brand.config.ts` nutzen
- Quick-Fix-Patches ohne Root-Cause-Analyse

---

## External Library Docs — Context7 MCP

Bevor du Syntax oder API-Calls für eine **externe Library/Framework** schreibst oder empfiehlst, rufe den `context7` MCP-Server auf, um aktuelle Docs zu ziehen. Das verhindert Halluzinationen aus veralteten Trainings-Daten.

**Use Context7 when**:
- Code für externe Library/Framework gefragt: Next.js, Prisma, Tailwind, NextAuth, React Query, Resend, shadcn/ui, Cal.com SDK, Vercel AI SDK, etc.
- Du unsicher bist bei aktueller API oder Breaking-Changes
- User explizit nach Library-API fragt
- Major-Version-Upgrade einer Dependency

**Skip Context7 when**:
- Plain TypeScript/JavaScript-Sprachfragen
- Projekt-interne Funktionen/Types (siehe Code Map Knowledge Graph)
- Stabile Browser/Node-APIs (z.B. `fetch`, `URL`, `crypto`)
- Reines Debugging existierenden Codes
- Ein-Wort-Lookups ("was ist lodash?")

Tools sind `resolve-library-id` (Library-Slug auflösen) und `get-library-docs` (Doku ziehen). Cache die Antwort im Kontext und nicht für jeden Mini-Lookup neu aufrufen.

---

## Knowledge Graphs (Quick-Index)

Vier vorgebaute Graphen unter `docs/graphify/`. Lookup ist ~1k Tokens vs. 10–50k für blinde grep/Read.

| Graph | Path | Best for |
|-------|------|----------|
| **Code Map** | `docs/graphify/graphify-out-codemap/` | Funktionen/Components in `src/`, Call-Beziehungen |
| **Backbone** | `docs/graphify/graphify-out-backbone/` | API-Routes, Auth-Helpers, Services (kein UI) |
| **Documentation** | `docs/graphify/graphify-out-docs/` | Specs, Plans, Decisions, Sprint-History |
| **Marketing** | `docs/graphify/graphify-out-marketing/` | Voice, Claims, Pain↔Feature, Brand-Tokens, Page-Composition |

Code Map + Backbone werden auto-rebuilt vom `.git/hooks/post-commit` Hook. Docs- und Marketing-Graph manuell via `/graphify`.

→ Volldetail in [docs/development/KNOWLEDGE-GRAPHS.md](docs/development/KNOWLEDGE-GRAPHS.md).

---

## Marketing & Content

Voice ist *ruhig, technisch, sachlich, nüchtern*. Anti-Tonality verboten ("revolutionär", "next-gen", "AI-powered", Hype-Adjektive). Marketing/Outbound an Heizungsbauer = **Du**. Endkunden-E-Mails = **Sie**. In-App-UI = **Sie**. Sämtliche User-facing Texte auf **Deutsch**. Niemals Hex-Werte hardcoden — nur Brand-Tokens.

Vor jeder Marketing-/Brand-/Copy-Änderung: Marketing-Graph konsultieren. → Volldetail in [docs/development/MARKETING-WORKFLOW.md](docs/development/MARKETING-WORKFLOW.md).

---

## Design System

Visueller Handoff lebt in `docs/design-system/` (Stand 2026-04-30). Kanonisch für *wie es aussieht*. Open deltas zur Production sind in `docs/design-system/DELTA.md` dokumentiert.

Hard rules: keine neuen Farben erfinden, keine Title-Case-Headlines, Status immer als bg+border+text-Triplet, System-Fonts zur Runtime.

→ Volldetail in [docs/development/DESIGN-SYSTEM-WORKFLOW.md](docs/development/DESIGN-SYSTEM-WORKFLOW.md).

---

## Housekeeping Cadence

Zwei Hausmeister-Aufgaben mit **gegensätzlicher Kadenz**:

### Backlog (`/backlog`) — kontinuierlich

- Bei Session-Start: `docs/BACKLOG.md` lesen, offene Items präsentieren, User entscheiden lassen.
- Sofort updaten wenn ein Item erledigt ist — nicht am Tagesende batchen.
- Neue Bugs/Decisions sofort als neue Items eintragen.

→ Volldetail in [docs/development/BACKLOG-WORKFLOW.md](docs/development/BACKLOG-WORKFLOW.md).

### Timesheet — nur Tagesende / Session-Ende

- `docs/development/TIMESHEET.md` auto-populated aus `.claude/state/sessions.jsonl`.
- Nur am Tagesende oder beim Session-End-Signal ("danke", "das wars", "wir sind fertig") updaten.
- **Niemals mid-session.** Idempotent prüfen (existierende Teil-3-Zeilen nicht doppelt schreiben).

→ Volldetail in [docs/development/TIMESHEET-AUTOTRACK.md](docs/development/TIMESHEET-AUTOTRACK.md).

---

## Self-Maintaining Knowledge

**Regel**: Wenn in einer Session ein neuer Pattern, Helper, Gotcha, oder eine architektonische Decision auftaucht, hält Claude die Doku aktuell — sonst verrottet das System.

1. **Einsortieren** — wo gehört die Erkenntnis hin?
   - Always-on Rule, die jede Session braucht? → CLAUDE.md (sparsam!)
   - Architekturelle Detail-Decision? → [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) (relevante Section) **und** [docs/architecture/CHANGELOG.md](docs/architecture/CHANGELOG.md) (ADR-Eintrag).
   - Workflow-spezifisch (Marketing, Design, Backlog, Timesheet, Knowledge Graphs)? → das jeweilige `docs/development/*-WORKFLOW.md`.
   - Reine Setup-Info? → `docs/development/DEVELOPER-SETUP-GUIDE.md`.

2. **Ergänzen** und am Ende der modifizierten Datei eine Zeile in der `## Changelog`-Section anhängen: `**YYYY-MM-DD** — kurze Beschreibung der Änderung.`

3. **Behavior-/Rule-Changes** (irgendwas, das ändert *was Claude tut* oder *was erlaubt ist*) immer vorher mit User abstimmen. Reine Reference-Updates (neue Datei dokumentieren, Cross-Link nachziehen, ADR eintragen) dürfen direkt geschrieben werden.

4. Bei jedem neuen Eintrag in `CHANGELOG.md` das passende Format nutzen: `## YYYY-MM-DD — Title` + `**Decision** / **Rationale** / **Affected** / **See also**`.

---

## Stop-Hook Notification

Beim `Stop`-Event triggert `.claude/hooks/notify-claude-done.ps1` einen Windows-Toast (BurntToast bevorzugt, NotifyIcon-Fallback) plus System-Asterisk-Sound. Hook nicht entfernen. Bei Problemen die Konfiguration in `.claude/settings.json` (Stop-Hook-Array) prüfen.

---

## Expected AI Behavior

Act as: **Senior Architect**, **Code Reviewer**, **System Designer**.

Not as: Beginner-Tutor, generischer Assistant, Documentation-Generator.

---

## Goal

Build a system that is:

- maintainable und understandable nach Monaten
- skalierbar ohne Full-Rewrites
- konsistent genug, dass jedes Feature dem existierenden Pattern folgt

---

## Changelog

- **2026-05-07** — Großer Refactor: von 557 auf ~250 Zeilen verschlankt. Architektur-Detail nach `docs/architecture/ARCHITECTURE.md` ausgelagert; Knowledge-Graphs, Marketing, Design-System, Backlog, Timesheet nach `docs/development/*-WORKFLOW.md`. Neu: Self-Maintaining Knowledge Rule, Context7-MCP-Anweisung, Stop-Hook-Hinweis. ADR: [docs/architecture/CHANGELOG.md](docs/architecture/CHANGELOG.md) Eintrag 2026-05-07.

# Architecture Decision Log

This file is the **append-only ADR log** for Torqr's architectural decisions. Every decision that shapes how code, data, or infrastructure are structured gets one entry.

## Entry format

Each entry has:

```
## YYYY-MM-DD — Title

**Decision**: What was decided in one sentence.

**Rationale**: Why — the constraint, problem, or trade-off that drove it. Two to four sentences.

**Affected**: Files, components, modules, or specs touched by the decision.

**See also**: Link to the canonical spec / commit / PR (if any).
```

Newer entries go on top. Decisions that are *superseded* stay in the log; add a follow-up entry with `**Supersedes**: <date — title>`.

---

## 2026-05-07 — Documentation refactor: slim CLAUDE.md + self-contained ARCHITECTURE.md + extracted workflow docs

**Decision**: Split the 557-line CLAUDE.md into a slim always-on "constitution + index" (~280 lines) plus dedicated reference docs. Architecture detail moves into [ARCHITECTURE.md](./ARCHITECTURE.md). Procedural workflows (knowledge graphs, marketing, design system, backlog, timesheet) move into `docs/development/*-WORKFLOW.md`.

**Rationale**: The old CLAUDE.md mixed three concerns (load-bearing rules, procedural workflows, reference docs) and consumed ~2.2k tokens at every session start. Most of the bulk was reference content that is only situationally relevant. Splitting cuts session-start cost in half while making each doc independently navigable. CLAUDE.md becomes a quick-scan index; deep dives stay one click away.

**Affected**: `CLAUDE.md`, `docs/architecture/ARCHITECTURE.md`, `docs/development/KNOWLEDGE-GRAPHS.md`, `docs/development/MARKETING-WORKFLOW.md`, `docs/development/DESIGN-SYSTEM-WORKFLOW.md`, `docs/development/BACKLOG-WORKFLOW.md`, `docs/development/TIMESHEET-AUTOTRACK.md`.

**See also**: Plan file `~/.claude/plans/also-ich-w-rde-gerne-velvety-fern.md`.

---

## 2026-05-07 — Stop-Hook desktop notification

**Decision**: Add a PowerShell hook (`.claude/hooks/notify-claude-done.ps1`) that fires on every Claude Code `Stop` event with a Windows toast (BurntToast preferred, NotifyIcon fallback) plus the system Asterisk sound.

**Rationale**: Sessions are often long-running while the user works in another window. A non-intrusive bing + toast surfaces "Claude is waiting for you" without polling the terminal. BurntToast is installed once at user scope (no admin); the script falls back to a Windows Forms balloon if the module is missing.

**Affected**: `.claude/hooks/notify-claude-done.ps1` (new), `.claude/settings.json` (second entry under `Stop`).

---

## 2026-05-07 — Context7 MCP server for current library docs

**Decision**: Register the Context7 MCP server (Upstash, `@upstash/context7-mcp` via npx) in the project-level `.mcp.json`. Future Claude sessions are instructed (via CLAUDE.md) to call Context7 before writing or recommending syntax for external libraries (Next.js, Prisma, Tailwind, NextAuth, React Query, Resend, shadcn, Cal.com SDK).

**Rationale**: LLM training data drifts behind library releases by months to years. Context7 fetches version-current docs on demand, eliminating one of the most common hallucination sources. Free tier is enough for the current session volume; HTTP+API-key transport is the upgrade path if rate-limits bite.

**Affected**: `.mcp.json`, `CLAUDE.md` (new "External Library Docs — Context7 MCP" section).

---

## 2026-05-07 — Architecture Decision Log convention

**Decision**: Use `docs/architecture/CHANGELOG.md` as the append-only ADR log. The Self-Maintaining Knowledge rule in CLAUDE.md instructs every future session that lands an architectural decision to append an entry here.

**Rationale**: ADRs were previously scattered across `docs/superpowers/specs/` (full decision records) and inline CLAUDE.md notes. A single append-only log gives a chronological "what changed and why" view without bloating CLAUDE.md or duplicating spec content.

**Affected**: `docs/architecture/CHANGELOG.md`, CLAUDE.md (Self-Maintaining Knowledge section).

---

## Earlier decisions (pre-2026-05-07)

For decisions before this log existed, see the relevant spec under [docs/superpowers/specs/](../superpowers/specs/) — those remain the canonical decision records. Selected highlights:

- **2026-05-07** — RLS deny-all hardening + auto-enforcement event trigger (commit `243402d`)
- **2026-04-22** — Company-as-Tenant model replaces User-as-Tenant ([spec](../superpowers/specs/2026-04-22-company-multi-user-architecture.md))
- **2026-04-21** — Application-level multi-tenancy (no Postgres RLS for tenant isolation) ([spec](../superpowers/specs/2026-04-21-multi-tenancy-design.md))
- **2026-04-13** — Email automation: cron-driven reminders + opt-out ([spec](../superpowers/specs/2026-04-13-email-automation-design.md))
- **2026-04-29** — Public landing page architecture ([spec](../superpowers/specs/2026-04-29-landingpage-design.md))

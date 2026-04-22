# Timesheet Auto-Tracking — Design

**Status:** Approved, awaiting implementation plan
**Date:** 2026-04-22
**Owner:** Y. Dorth
**Goal:** Make [docs/development/TIMESHEET.md](../../development/TIMESHEET.md) self-updating, covering retrospective work (10.01.2026 – 22.04.2026) and live-tracked work going forward — without the user issuing commands.

---

## 1. Context

The existing timesheet at `docs/development/TIMESHEET.md` covers Sprints 1–5 (11.12.2025 – 09.01.2026) in rich detail and serves as a pricing argument for client conversations. It has been stale since January. Between then and today, 18 further sprints shipped (see `docs/BACKLOG.md` completed section), all untracked. The user wants:

- One document that continues without manual invocation
- Real Claude-session time (measured)
- Solo-dev equivalent time (AI estimate)
- A readable grid for arguing price later
- Retrospective coverage of the Jan–Apr gap, approximated from git

---

## 2. Document Structure

Rewrite `docs/development/TIMESHEET.md` into three labeled parts plus a top-level summary. German throughout (project convention).

### 2.1 Executive Summary (top of document)

Aggregates across Teil 1 + 2 + 3. Kept short.

| Metrik | Wert |
|---|---|
| Gesamte Echtzeit (deine Arbeit mit Claude) | `X h` |
| Gesamte Solo-Dev-Äquivalenz (Senior Full-Stack, ohne KI) | `Y h` |
| Effizienzfaktor (Y / X) | `… ×` |
| MVP-Wert @ 95 €/h | `Y × 95 €` |
| Hinweis | *95 €/h — günstig für Senior Full-Stack (Marktüblich 90–130 €/h)* |

Updated automatically when new rows are appended.

### 2.2 Teil 1 — MVP-Start (11.12.2025 – 09.01.2026)

Preserve existing Sprint 1–5 breakdown verbatim. Do not restructure. It already reads as a pricing argument.

### 2.3 Teil 2 — Retro-Rekonstruktion (10.01.2026 – 22.04.2026)

One row per calendar day that has at least one commit. Flagged as *geschätzt (Git-basiert)* in the header.

| Datum | Tier | Echtzeit (du) | Solo-Dev-Äquiv. | Sprint / Bereich | Aktivitäten | Commits |
|---|---|---|---|---|---|---|
| 2026-04-22 | XL | 5 h | 32 h | Sprint 23 + Catalog | Company multi-user rollout, catalog fix & seed, timesheet spec | 8 |

**Row rules:**
- Include only days where `git log --author=<user>` has ≥1 commit.
- Each day gets **one complexity tier** (S/M/L/XL), judged from the day's diff scope. The tier carries two values:

  | Tier | Echtzeit (dein Aufwand mit Claude) | Solo-Dev-Äquivalenz (ohne KI) | Beispiel |
  |------|-----|-----|-----|
  | **S** | 30 min | 2 h | Typo-Fix, Copy-Änderung, 1-Datei-Tweak |
  | **M** | 1 h | 6 h | Ein Feature / Bugfix über 2–5 Dateien |
  | **L** | 3 h | 16 h | Neue Seite / Flow, Multi-File-Refactor |
  | **XL** | 5 h | 32 h | Sprint-Scope (Model, Migration, Cross-Cutting) |

- **Echtzeit** is your actual time in front of Claude Code for that day. For retro it comes from the tier (rough). Sanity-check: cross-reference with first/last commit timestamp on that day; if the commit window is wildly out of line with the tier's Echtzeit, bump tier up or down.
- **Solo-Dev-Äquivalenz** is what an experienced full-stack senior dev without AI would need — independent of your real time, judged purely on output scope. This is the number that feeds MVP-Wert.
- **Aktivitäten:** one-line German summary derived from commit messages.
- **Commits:** count for the day.

Tier assignment is judgment-based. No multi-row per-sprint decomposition — the daily grid is the canonical view.

### 2.4 Teil 3 — Live-Tracking (ab erster Hook-Sitzung)

Same column layout as Teil 2. **Echtzeit** is now *gemessen* (sum of hook-recorded session durations for that day), not derived from the tier. **Solo-Dev-Äquivalenz** still comes from the S/M/L/XL tier (AI judgment), since no measurement of that is possible. Header notes this distinction.

**Cutover:** Teil 2 covers everything up to and including the day hooks are installed (today's work lands in the backfill, since it was not hook-measured). Teil 3 begins with the first calendar day whose sessions are fully captured by the hooks. No day appears in both parts.

---

## 3. Automation Architecture

### 3.1 Data capture (hooks)

Two Claude Code hooks write JSON state to `.claude/state/` (gitignored, per-worktree).

**SessionStart hook** — writes `.claude/state/session-current.json`:

```json
{ "startedAt": "2026-04-22T20:12:05+02:00", "headSha": "6003fc6" }
```

**Stop hook** — appends one line to `.claude/state/sessions.jsonl`:

```json
{"startedAt":"...","endedAt":"...","durationMin":47,"headStart":"7f1419d","headEnd":"6003fc6","commits":2,"filesChanged":4}
```

`commits` and `filesChanged` are derived from `git log headStart..headEnd` and `git diff --stat headStart..headEnd`. These two fields are only used to decide whether a session is "work" (any ≥ 1) or "consultation" (both 0) — they are **not** the source of truth for Aktivitäten. The promotion step derives Aktivitäten from `git log` of the whole day, not from per-session fields. Uncommitted work-in-progress is therefore not lost: when the user commits the next day, that commit appears under the next day's row.

**Note on sessions that span days:** if `startedAt` and `endedAt` fall on different calendar days, the entry is attributed to the `endedAt` day. No splitting.

**Note on worktrees:** state is per-worktree. The user is expected to keep `docs/development/TIMESHEET.md` merges clean; if a worktree produces new rows, they propagate via the normal merge flow.

### 3.2 Data promotion (CLAUDE.md rule)

CLAUDE.md gains a new section — **Timesheet auto-update** — with this rule:

> At session start, read `.claude/state/sessions.jsonl`. For every calendar day whose sessions are **not already present** as a row in Teil 3 of `docs/development/TIMESHEET.md`:
>
> 1. Aggregate all sessions for that day.
> 2. Drop sessions where `commits === 0 && filesChanged === 0` (consultation-only).
> 3. If no sessions remain for the day, skip.
> 4. Otherwise sum `durationMin` across remaining sessions → **Echtzeit**.
> 5. Judge the day's Solo-Dev-Äquiv. tier (S/M/L/XL) from `git log` of that day and your session memory.
> 6. Write a one-line Aktivitäten summary.
> 7. Append the row to Teil 3 in chronological order.
> 8. Recompute and rewrite the Executive Summary block.

The rule fires when the user opens Claude Code. Today's work is written on the next day's first session — 1-day lag, acceptable per user preference ("just for retro, approximate is fine").

### 3.3 Fallback — session-end wrap-up

Secondary trigger: if the user signals session end in a message ("danke", "thanks", "wir sind fertig", "ok das wars"), I run the same promotion logic before signing off — captures the current day in the same session. Non-mandatory; a missed signal just means the row shows up next session.

---

## 4. Retrospective Backfill Procedure

One-time job during implementation, then never repeated:

1. `git log --author="Yannik Dorth" --since="2026-01-10" --until="2026-04-22" --pretty=format:'%ad %h %s' --date=short`
2. Group by date. For each date:
   - Compute earliest/latest commit time → Echtzeit (capped 8h)
   - Count commits
   - Read commit messages; assign tier S/M/L/XL
   - Write Aktivitäten summary
3. Append rows to Teil 2 in chronological order.
4. Recompute Executive Summary.

This is executed once by me during implementation, not by the automation.

---

## 5. Pricing & Rate

- **Hourly rate:** 95 €/h (per user decision).
- **Positioning note** (rendered in the Executive Summary): *"95 €/h — günstig für Senior Full-Stack-Entwicklung (Marktüblich 90–130 €/h)"*. Makes clear the rate is on the low side of market, strengthening the price argument.
- **MVP-Wert formula:** Solo-Dev-Äquivalenz × 95 € (what a client would pay for equivalent scope from a traditional senior dev).
- Pricing tables from the existing document (Option A/B/C at different rates) are preserved in Teil 1 unchanged. A new single-rate line is added to the Executive Summary.

---

## 6. File Locations

| Path | Gitignored | Purpose |
|---|---|---|
| `docs/development/TIMESHEET.md` | no | Published document |
| `.claude/state/session-current.json` | **yes** | Current session start marker |
| `.claude/state/sessions.jsonl` | **yes** | Append-only session log |
| `.gitignore` | — | New entry: `.claude/state/` |
| `.claude/settings.json` | no | Hook definitions added here |
| `CLAUDE.md` | no | "Timesheet auto-update" section added |

---

## 7. Out of Scope

- Per-feature or per-commit time attribution (too granular for a pricing doc).
- Token/cost metrics from the Claude API (not visible to hooks in this environment).
- Multi-developer support (single-dev project).
- Idle-time exclusion during a session (a session is counted wall-clock; user said not to overthink).
- Prior Sprint 1–5 rewriting (Teil 1 is frozen).

---

## 8. Open Risks

- **Hook portability:** hook invocation conventions may differ across Claude Code updates. Spec assumes current stable hook schema; adjustments at implementation time are allowed without re-approval.
- **Clock skew across worktrees:** if multiple worktrees are active same-day, their sessions.jsonl files are independent. Row deduplication relies on day+sessionId, so duplicate rows are possible if the promotion step runs in both worktrees before either commits TIMESHEET.md. Acceptable — user can delete duplicates manually.
- **Subjective tier assignment:** S/M/L/XL judgment introduces AI variance. Mitigated by writing the tier alongside hours (transparent) and user can override.

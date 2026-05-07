# Timesheet Auto-Update

**Purpose**: The timesheet at `docs/development/TIMESHEET.md` is auto-populated by Claude at session-start (and as a fallback at session-end). This doc defines the procedure.

**Linked from**: [CLAUDE.md](../../CLAUDE.md) Housekeeping Cadence § Timesheet.

**Cadence**: end-of-day only (or session-end fallback). **Never mid-session.** This is the opposite of the Backlog (continuous updates) — see [BACKLOG-WORKFLOW.md](./BACKLOG-WORKFLOW.md).

---

## 1. Procedure

1. Read `.claude/state/sessions.jsonl` (if missing, skip — no work to log).
2. For each calendar day (YYYY-MM-DD, local time from `startedAt`) with ≥1 entry:
   - Check whether a row for that date already exists in **Teil 3 — Live-Tracking** of `docs/development/TIMESHEET.md`.
   - If yes → skip.
   - If no → build a new row for that day.
3. For each day to log:
   - Drop sessions where `commits == 0 && filesChanged == 0` (consultation-only).
   - If no sessions remain for the day, skip.
   - Sum `durationMin` across remaining sessions → convert to `X.Y h` (one decimal) → **Echtzeit**.
   - Run `git log --author="Yannik Dorth" --since="<day>" --until="<day+1>" --pretty=format:'%h %s'` to get the day's commits.
   - Judge complexity tier per spec §2.3 (S=2h / M=6h / L=16h / XL=32h solo-dev equivalent).
   - Write one-line German Aktivitäten summary from commit messages.
   - Append row to Teil 3 in chronological order.
4. After appending, recompute the Executive Summary block (sum Echtzeit across all three parts, sum Solo-Dev-Äquiv., efficiency factor, MVP-Wert = Solo × 95 €).
5. Commit the timesheet change with message: `docs(timesheet): auto-log <YYYY-MM-DD>`.

---

## 2. Session-end fallback

If the user signals session end ("danke", "thanks", "das wars", "wir sind fertig", "ok fertig"), run the same procedure before signing off. This captures the current day without the 1-day lag.

---

## 3. Non-triggers

- Do not update the timesheet **mid-session**.
- Do not update if no entries are new (idempotent check via existing Teil 3 rows).
- Do not touch **Teil 1** (MVP-Start) or **Teil 2** (Retro) — they are frozen.

---

## 4. Source of truth for the procedure

The full design (complexity tiers, time-equivalent table, executive-summary computation) lives in [docs/superpowers/specs/2026-04-22-timesheet-autotrack-design.md](../superpowers/specs/2026-04-22-timesheet-autotrack-design.md). This file is the operational summary.

---

## Changelog

- **2026-05-07** — Extracted from CLAUDE.md to slim it down. Content unchanged. Cadence rule made explicit (Backlog continuous vs. Timesheet end-of-day-only).

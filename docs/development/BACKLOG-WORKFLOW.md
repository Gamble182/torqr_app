# Backlog Workflow

**Purpose**: `docs/BACKLOG.md` is the single source of truth for planned work, known bugs, and technical decisions. This doc defines how Claude reads and updates it.

**Linked from**: [CLAUDE.md](../../CLAUDE.md) Housekeeping Cadence § Backlog.

---

## 1. `/backlog` — Session-start procedure

**Trigger phrase**: `"/backlog"` or at the start of any development session.

1. **Read** `docs/BACKLOG.md` — load all open items.
2. **Present** the open items as a numbered list with priority and area.
3. **Ask**: "Which item(s) should we work on? Or should I recommend the next logical task?"
4. **On selection**: implement or discuss the item fully.
5. **On completion**: update `docs/BACKLOG.md` *immediately* (not at end of session).
   - Move the item from **Open Items** to **Completed / Resolved**.
   - Add the resolved date (`YYYY-MM-DD`).
   - If the item spawns follow-up tasks, add those as new open items.
6. **End of session**: confirm backlog state is up to date before signing off.

---

## 2. Cadence rule

The Backlog is updated **continuously**, not at end-of-day:

- Add a new item the moment a bug, decision, or follow-up is discovered.
- Move an item to "Completed" the moment it's actually done.
- Do not batch updates. The backlog must always reflect reality at any point during a session.

The Timesheet works the opposite way — see [TIMESHEET-AUTOTRACK.md](./TIMESHEET-AUTOTRACK.md): only update at end-of-day or session-end.

---

## 3. Backlog item format

**Open Items table**:

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|

**Completed table**:

| # | Area | Description | Resolved |
|---|------|-------------|----------|

---

## 4. Priority levels

- **Critical** — blocks production or causes data loss
- **High** — user-facing feature gap or recurring error
- **Medium** — quality improvement, nice-to-have feature
- **Low** — minor polish, decision record, future consideration

---

## 5. Rules

- Never implement a backlog item without reading the current `docs/BACKLOG.md` state first.
- Always mark items as resolved immediately after completion — not at end of session.
- New bugs or decisions discovered during a session must be added as new backlog items before the session ends.
- Do not silently fix something that belongs in the backlog without recording it.

---

## 6. Archival cadence

**Goal**: Keep `docs/BACKLOG.md` lean enough for one Read call. Items resolved more than 30 days ago move to `docs/BACKLOG-ARCHIVE.md`.

**Trigger check**: On every `/backlog` session-start (after loading open items), scan the **oldest entries** at the bottom of the Completed / Resolved section. Compare each sprint section's `Resolved` date(s) against `today − 30 days`.

**Rule**:

- If **every** row in a sprint section has a `Resolved` date ≥ 30 days before today, move the **entire sprint section** (heading + table) from `BACKLOG.md` into `BACKLOG-ARCHIVE.md`.
- Sprint sections are **atomic**: move the whole section or none of it. Do not split a section by date.
- Insert the moved section at the **top** of the archive's `Completed / Resolved (archived)` (newest archived sprint first). Do not interleave with older archived sprints.
- Preserve the exact heading format (`### Sprint N — Title (YYYY-MM-DD)`) and table shape. Content is moved **verbatim** — not compressed, summarised, or rewritten.
- Update the archive's own `Changelog` section with a one-line entry naming the moved sprint(s) and reason.

**Frequency**: Tripwire, not a scheduled task. Most sessions move zero sprints. Only act when the check above actually fires.

**Cross-link discipline**: `BACKLOG.md` keeps a permanent hint above its Completed section pointing to the archive. Never remove or weaken that hint.

**Post-archive step**: After moving sprint(s), rebuild the Documentation knowledge graph (`/graphify docs/ --update`) so cross-references in the Docs graph reflect the new file layout. Skip the rebuild if no sprint was actually moved this session.

---

## Changelog

- **2026-05-11** — Added § 6 Archival cadence. Items resolved > 30 days ago move atomically as full sprint sections to `BACKLOG-ARCHIVE.md`, newest-first. Tripwire on session-start, not scheduled. Initial migration: Sprint 1, 2, 3 (Januar-Initial-Setup).
- **2026-05-07** — Extracted from CLAUDE.md to slim it down. Content unchanged.

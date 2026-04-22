# Timesheet Auto-Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docs/development/TIMESHEET.md` self-updating via Claude Code hooks + a CLAUDE.md rule, and backfill the 10.01.2026 – 22.04.2026 gap from git history.

**Architecture:** Two shell-script hooks write session metadata to `.claude/state/` (gitignored). A new CLAUDE.md rule instructs Claude to promote unlogged days from that state file into `TIMESHEET.md` at the start of each session. The document gets three parts: preserved MVP-start section, git-derived retro, and live-tracked section.

**Tech Stack:** Bash (Git Bash on Windows), Claude Code hooks API, markdown, git CLI.

**Spec reference:** `docs/superpowers/specs/2026-04-22-timesheet-autotrack-design.md`.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `.gitignore` | modify | Add `.claude/state/` |
| `.claude/hooks/session-start.sh` | create | Capture start timestamp + HEAD SHA |
| `.claude/hooks/stop.sh` | create | Append session record with duration, commits, filesChanged |
| `.claude/state/` | create (empty, gitignored) | Runtime state dir for hooks |
| `.claude/settings.json` | modify | Register SessionStart + Stop hooks |
| `CLAUDE.md` | modify | Add "Timesheet auto-update" rule section |
| `docs/development/TIMESHEET.md` | rewrite | New three-part structure + retro rows |

No application code is touched. All changes are tooling + documentation.

---

## Task 1: Gitignore the state directory

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Append state dir to gitignore**

Append to `.gitignore`:

```
# Claude Code session state for timesheet auto-tracking
.claude/state/
```

- [ ] **Step 2: Verify**

Run: `git check-ignore -v .claude/state/anything`
Expected: prints a line starting with `.gitignore:` — confirms pattern matches.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore(timesheet): gitignore .claude/state for hook-written session log"
```

---

## Task 2: SessionStart hook script

**Files:**
- Create: `.claude/hooks/session-start.sh`

- [ ] **Step 1: Write the script**

Create `.claude/hooks/session-start.sh` with exactly this content:

```bash
#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
state_dir="$repo_root/.claude/state"
mkdir -p "$state_dir"

started=$(date -Iseconds)
head=$(git rev-parse HEAD 2>/dev/null || echo "")

cat > "$state_dir/session-current.json" <<EOF
{"startedAt":"$started","headSha":"$head"}
EOF

exit 0
```

- [ ] **Step 2: Make executable**

Run: `chmod +x .claude/hooks/session-start.sh`

- [ ] **Step 3: Dry-run**

Run: `bash .claude/hooks/session-start.sh && cat .claude/state/session-current.json`
Expected output (timestamp will differ):

```
{"startedAt":"2026-04-22T22:15:30+02:00","headSha":"35962b8"}
```

- [ ] **Step 4: Clean up the test file**

Run: `rm .claude/state/session-current.json`

---

## Task 3: Stop hook script

**Files:**
- Create: `.claude/hooks/stop.sh`

- [ ] **Step 1: Write the script**

Create `.claude/hooks/stop.sh` with exactly this content:

```bash
#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
state_dir="$repo_root/.claude/state"
current_file="$state_dir/session-current.json"
log_file="$state_dir/sessions.jsonl"

[[ -f "$current_file" ]] || exit 0

# Extract fields with grep (avoids jq dependency)
started=$(grep -oE '"startedAt":"[^"]+"' "$current_file" | sed 's/"startedAt":"\(.*\)"/\1/')
head_start=$(grep -oE '"headSha":"[^"]*"' "$current_file" | sed 's/"headSha":"\(.*\)"/\1/')

ended=$(date -Iseconds)
head_end=$(git rev-parse HEAD 2>/dev/null || echo "")

# Duration in minutes
started_ts=$(date -d "$started" +%s 2>/dev/null || echo 0)
ended_ts=$(date -d "$ended" +%s 2>/dev/null || echo 0)
duration_min=$(( (ended_ts - started_ts) / 60 ))

# Commit + file counts
commits=0
files=0
if [[ -n "$head_start" && -n "$head_end" && "$head_start" != "$head_end" ]]; then
  commits=$(git log --oneline "$head_start..$head_end" 2>/dev/null | wc -l | tr -d ' ')
  files=$(git diff --name-only "$head_start..$head_end" 2>/dev/null | wc -l | tr -d ' ')
fi

printf '{"startedAt":"%s","endedAt":"%s","durationMin":%d,"headStart":"%s","headEnd":"%s","commits":%d,"filesChanged":%d}\n' \
  "$started" "$ended" "$duration_min" "$head_start" "$head_end" "$commits" "$files" \
  >> "$log_file"

rm -f "$current_file"
exit 0
```

- [ ] **Step 2: Make executable**

Run: `chmod +x .claude/hooks/stop.sh`

- [ ] **Step 3: Dry-run (simulate a session)**

```bash
bash .claude/hooks/session-start.sh
sleep 2
bash .claude/hooks/stop.sh
cat .claude/state/sessions.jsonl
```

Expected: one JSON line with `durationMin: 0`, `commits: 0`, `filesChanged: 0`.

- [ ] **Step 4: Clean up**

Run: `rm -f .claude/state/sessions.jsonl .claude/state/session-current.json`

- [ ] **Step 5: Commit both hook scripts**

```bash
git add .claude/hooks/session-start.sh .claude/hooks/stop.sh
git commit -m "feat(timesheet): add SessionStart + Stop hook scripts for auto-tracking"
```

---

## Task 4: Register hooks in Claude Code settings

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 1: Read current settings**

Run: `cat .claude/settings.json`

Keep the existing `permissions`, `additionalDirectories`, `enableAllProjectMcpServers`, and `enabledPlugins` fields untouched. We're only adding a `hooks` key.

- [ ] **Step 2: Add hooks section**

Edit `.claude/settings.json` — add this top-level key alongside the existing ones (place it after `permissions`):

```json
"hooks": {
  "SessionStart": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "bash .claude/hooks/session-start.sh"
        }
      ]
    }
  ],
  "Stop": [
    {
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "bash .claude/hooks/stop.sh"
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Validate JSON**

Run: `python -c "import json; json.load(open('.claude/settings.json'))"`
Expected: no output (exit 0). Any output = broken JSON, fix syntax.

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json
git commit -m "feat(timesheet): register SessionStart + Stop hooks"
```

---

## Task 5: Add Timesheet auto-update section to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Locate insertion point**

Insert the new section AFTER the "Backlog Workflow — Key Feature" section (before "Developer Profile"). Use Grep to confirm the anchor: `grep -n "## Developer Profile" CLAUDE.md`

- [ ] **Step 2: Insert the section**

Insert immediately before the `## Developer Profile` heading:

```markdown
---

## Timesheet Auto-Update

The timesheet at `docs/development/TIMESHEET.md` is auto-populated. You MUST follow this rule at the start of every session.

### Procedure

1. Read `.claude/state/sessions.jsonl` (if missing, skip — no work to log).
2. For each calendar day (YYYY-MM-DD, local time from `startedAt`) with ≥1 entry:
   - Check whether a row for that date already exists in **Teil 3 — Live-Tracking** of `docs/development/TIMESHEET.md`.
   - If yes → skip.
   - If no → build a new row for that day.
3. For each day to log:
   - Drop sessions where `commits == 0 && filesChanged == 0` (consultation-only).
   - If no sessions remain for the day, skip.
   - Sum `durationMin` across remaining sessions → convert to `X.Y h` (one decimal) → **Echtzeit**.
   - Run `git log --author="<user>" --since="<day>" --until="<day+1>" --pretty=format:'%h %s'` to get the day's commits.
   - Judge complexity tier per spec §2.3 (S=2h / M=6h / L=16h / XL=32h solo-dev equivalent).
   - Write one-line German Aktivitäten summary from commit messages.
   - Append row to Teil 3 in chronological order.
4. After appending, recompute the Executive Summary block (sum Echtzeit across all three parts, sum Solo-Dev-Äquiv., efficiency factor, MVP-Wert).
5. Commit the timesheet change with message: `docs(timesheet): auto-log <YYYY-MM-DD>`.

### Session-end fallback

If the user signals session end ("danke", "thanks", "das wars", "wir sind fertig", "ok fertig"), run the same procedure before signing off. This captures the current day without the 1-day lag.

### Non-triggers

- Do not update the timesheet mid-session.
- Do not update if no entries are new (idempotent check via existing Teil 3 rows).
- Do not touch Teil 1 (MVP-Start) or Teil 2 (Retro) — they are frozen.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(timesheet): add auto-update rule to CLAUDE.md"
```

---

## Task 6: Rewrite TIMESHEET.md into three-part structure

**Files:**
- Modify: `docs/development/TIMESHEET.md`

This is a large rewrite. The existing Sprint 1–5 content becomes Teil 1; we add a new Executive Summary on top, new Teil 2 (retro, filled in Task 7), and empty Teil 3.

- [ ] **Step 1: Read current content to preserve**

Run: `wc -l docs/development/TIMESHEET.md` — should be 288 lines.

Keep lines 22–287 (everything from "## 1. Geschätzte Entwicklungszeit" to the document end) — this becomes Teil 1.

- [ ] **Step 2: Construct the new document**

Write `docs/development/TIMESHEET.md` with the following structure. Preserve existing Sprint 1–5 content verbatim inside Teil 1.

```markdown
# Torqr MVP — Entwicklungszeiterfassung

**Projekt:** Torqr — Kundenverwaltungs- und Wartungsplattform
**Entwickler:** Y. Dorth
**Stundensatz:** 95 €/Std — *günstig für Senior Full-Stack (Marktüblich 90–130 €/h)*
**Stand:** 2026-04-22

---

## Executive Summary

| Metrik | Wert |
|---|---|
| Echtzeit gesamt (deine Arbeit mit Claude) | `<X> h` |
| Solo-Dev-Äquivalenz gesamt (Senior Full-Stack, ohne KI) | `<Y> h` |
| Effizienzfaktor (Y / X) | `<…> ×` |
| MVP-Wert @ 95 €/h | `<Y × 95> €` |

*95 €/h ist auf der günstigen Seite des marktüblichen Bands für Senior Full-Stack-Entwicklung (90–130 €/h). Der Effizienzfaktor zeigt, welchen Solo-Dev-Aufwand dieselbe Leistung konventionell gebunden hätte.*

---

## Teil 1 — MVP-Start (11.12.2025 – 09.01.2026)

> Historische Erfassung, unverändert. Sprints 1–5 mit detaillierter Phasen-Aufschlüsselung. Stundensatz 90–110 €/h (Originalkalkulation).

<PASTE EXISTING CONTENT FROM ORIGINAL LINE 22 TO LINE 287 HERE>

---

## Teil 2 — Retro-Rekonstruktion (10.01.2026 – 22.04.2026)

> Git-basierte Schätzung. Eine Zeile pro Arbeitstag (nur Tage mit ≥1 Commit). Tier S/M/L/XL bestimmt beide Werte gemeinsam.

Tier-Referenz:

| Tier | Echtzeit (du) | Solo-Dev-Äquiv. | Typisches Beispiel |
|---|---|---|---|
| S | 30 min | 2 h | Typo / Copy / 1-Datei-Tweak |
| M | 1 h | 6 h | Einzelfeature, 2–5 Dateien |
| L | 3 h | 16 h | Neue Seite / Flow / Multi-File-Refactor |
| XL | 5 h | 32 h | Sprint-Scope (Model / Migration / Cross-Cutting) |

| Datum | Tier | Echtzeit | Solo-Dev-Äquiv. | Sprint / Bereich | Aktivitäten | Commits |
|---|---|---|---|---|---|---|
<rows added in Task 7>

---

## Teil 3 — Live-Tracking (ab erster Hook-Sitzung)

> Echtzeit ist **gemessen** (Summe der Hook-erfassten Sitzungsdauern). Solo-Dev-Äquivalenz weiterhin per Tier (KI-Beurteilung).

| Datum | Tier | Echtzeit (gem.) | Solo-Dev-Äquiv. | Sprint / Bereich | Aktivitäten | Commits |
|---|---|---|---|---|---|---|
_(noch leer — wird bei jeder neuen Session automatisch ergänzt)_
```

- [ ] **Step 3: Verify the existing Sprint 1–5 content survived intact**

Run: `grep -c "Sprint 1" docs/development/TIMESHEET.md`
Expected: ≥ 3 (multiple mentions).

Run: `grep -c "Effizienzfaktor" docs/development/TIMESHEET.md`
Expected: ≥ 2 (one in new Executive Summary, at least one in Teil 1's original analysis).

- [ ] **Step 4: Commit**

```bash
git add docs/development/TIMESHEET.md
git commit -m "docs(timesheet): restructure into three-part format (Teil 1/2/3 + summary)"
```

---

## Task 7: Retro backfill for Teil 2

**Files:**
- Modify: `docs/development/TIMESHEET.md` (populate Teil 2 rows)

- [ ] **Step 1: Enumerate commit days in the gap**

Run:

```bash
git log --author="Yannik Dorth" --since="2026-01-10" --until="2026-04-23" --date=short --pretty=format:'%ad|%h|%s' > /tmp/commits-retro.txt
wc -l /tmp/commits-retro.txt
```

Expected: non-zero number (expected ~50–150 commits spread across ~20–40 active days).

- [ ] **Step 2: Group by date and classify**

For each unique date in the commit list, apply the tier rubric:

- **S** — 1 commit, single file, trivial scope (copy / typo / config tweak)
- **M** — 2–3 commits OR a single feature commit touching ≤5 files
- **L** — 4–8 commits OR multi-file feature (new page, hook, refactor)
- **XL** — ≥8 commits OR sprint-scale scope (new Prisma model/migration, cross-cutting rename, major rework)

Sanity-check by computing the commit window on each day:

```bash
git log --author="Yannik Dorth" --since="2026-01-15 00:00" --until="2026-01-15 23:59" --pretty=format:'%ad' --date=iso | sort
```

If the first-to-last commit span is wildly out of line with the tier's Echtzeit (e.g. tier S but 4h span), bump the tier up by one.

Cross-reference with `docs/BACKLOG.md` "Completed / Resolved" sprint sections — those date headers anchor sprint scope to specific days.

- [ ] **Step 3: Build the markdown rows**

For each active day, produce one row of this shape:

```markdown
| 2026-MM-DD | <Tier> | <30 min \| 1 h \| 3 h \| 5 h> | <2 h \| 6 h \| 16 h \| 32 h> | <Sprint/Bereich from BACKLOG> | <one-line German summary> | <N> |
```

Example day using real context — 22.04.2026 (Sprint 23 rollout + catalog + spec + 8 commits):

```markdown
| 2026-04-22 | XL | 5 h | 32 h | Sprint 23 + Catalog + Timesheet | Company-Multi-User Rollout, Admin-Split, Catalog-Validation-Fix, Seed-Expansion, Timesheet-Spec | 8 |
```

- [ ] **Step 4: Insert rows into Teil 2 in chronological order**

Place rows between the header row and the `---` that ends Teil 2. Sort ascending by date.

- [ ] **Step 5: Recompute and update Executive Summary**

Formula:
- Echtzeit gesamt = (Teil 1 actual hours: use the existing "~20 Stunden" figure) + sum of Teil 2 Echtzeit + 0 (Teil 3 empty)
- Solo-Dev-Äquivalenz gesamt = (Teil 1 estimated solo: 145 h) + sum of Teil 2 Solo-Dev + 0
- Effizienzfaktor = Solo / Echtzeit (one decimal, e.g. `8.3 ×`)
- MVP-Wert = Solo × 95 € (round to nearest hundred, e.g. `18.200 €`)

- [ ] **Step 6: Sanity-check**

Run: `grep -c "^| 2026-" docs/development/TIMESHEET.md`
Expected: one row per active day in the retro period. Cross-reference the count with `git log --since=2026-01-10 --format='%ad' --date=short | sort -u | wc -l`.

- [ ] **Step 7: Commit**

```bash
git add docs/development/TIMESHEET.md
git commit -m "docs(timesheet): backfill retro rows for 10.01–22.04 from git history"
```

---

## Task 8: End-to-end smoke test

- [ ] **Step 1: Simulate a fresh session**

```bash
rm -f .claude/state/session-current.json .claude/state/sessions.jsonl
bash .claude/hooks/session-start.sh
test -f .claude/state/session-current.json && echo "start OK" || echo "start FAIL"
```

Expected: `start OK`.

- [ ] **Step 2: Simulate session end with no commits**

```bash
bash .claude/hooks/stop.sh
cat .claude/state/sessions.jsonl
```

Expected: single line with `"commits":0,"filesChanged":0`. No `session-current.json` left behind.

- [ ] **Step 3: Verify gitignore holds**

Run: `git status`
Expected: `.claude/state/` NOT listed under untracked files.

- [ ] **Step 4: Cleanup test artifacts**

```bash
rm -f .claude/state/sessions.jsonl
```

---

## Task 9: Verify final state

- [ ] **Step 1: Visual inspection**

Open `docs/development/TIMESHEET.md` in the IDE. Confirm:
- Executive Summary values are non-zero and consistent
- Teil 1 content matches the original (spot check: "Sprint 3 - Heizungsverwaltung" header present)
- Teil 2 table has rows, sorted by date
- Teil 3 table has header only

- [ ] **Step 2: Confirm CLAUDE.md rule is discoverable**

Run: `grep -n "Timesheet Auto-Update" CLAUDE.md`
Expected: one match.

- [ ] **Step 3: Final commit log check**

Run: `git log --oneline -10`

Expected sequence (from newest to oldest, roughly):
- `docs(timesheet): backfill retro rows ...`
- `docs(timesheet): restructure into three-part format ...`
- `docs(timesheet): add auto-update rule to CLAUDE.md`
- `feat(timesheet): register SessionStart + Stop hooks`
- `feat(timesheet): add SessionStart + Stop hook scripts ...`
- `chore(timesheet): gitignore .claude/state ...`

---

## Rollback procedure

If hooks misbehave in real use:

1. Remove the `hooks` key from `.claude/settings.json`.
2. Delete `.claude/hooks/` and `.claude/state/` directories.
3. Revert or hand-edit `docs/development/TIMESHEET.md` as needed.
4. Revert the CLAUDE.md rule section.

Everything is additive — no application code is modified, so revert risk is zero.

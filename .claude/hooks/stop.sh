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

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

#!/usr/bin/env bash
# Fetch the SHRP "hours saved" aggregate and write it into the site as assets/data/live-metric.json.
# Run nightly by .github/workflows/live-metric.yml; also runnable locally to refresh a preview.
# Needs LIVE_METRIC_URL (the shrp-prod live-metric Edge Function) and LIVE_METRIC_TOKEN (its shared
# token). Both are secrets: the site and this repo never contain them, so nothing public points at
# production [Luke 2026-10-27]. Source of the number: SHRP repo, supabase/functions/live-metric/ and
# supabase/migrations/20261027180000_live_metric_hours_saved.sql.
# On any failure the existing file is left untouched (the site keeps showing the last good number with
# its real date; the SHRP heartbeat alerts when that date is over 48 hours old).
set -euo pipefail
: "${LIVE_METRIC_URL:?LIVE_METRIC_URL is not set}"
: "${LIVE_METRIC_TOKEN:?LIVE_METRIC_TOKEN is not set}"
out="$(dirname "$0")/../../assets/data/live-metric.json"

body="$(curl -sS --fail --max-time 30 -H "x-live-metric-token: ${LIVE_METRIC_TOKEN}" "$LIVE_METRIC_URL")"

# Only the three expected fields, with sane types, ever reach the public file.
echo "$body" | jq -e '
  (.total_hours | type == "number" and . >= 0) and
  (.users_counted | type == "number" and . >= 1 and floor == .) and
  (.updated | type == "string" and test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))' > /dev/null \
  || { echo "live-metric: unexpected response, file left unchanged" >&2; exit 1; }

mkdir -p "$(dirname "$out")"
echo "$body" | jq '{total_hours, users_counted, updated}' > "$out"
echo "live-metric: wrote $(jq -c . "$out")"

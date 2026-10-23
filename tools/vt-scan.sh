#!/usr/bin/env bash
# Scan a release's installer assets on VirusTotal (API v3) and append/replace a
# "VirusTotal" section in the release notes. Needs: gh (GH_TOKEN), curl, jq, VT_API_KEY.
# Usage: tools/vt-scan.sh <tag> [--no-edit]
set -euo pipefail
TAG="${1:?tag required}"; EDIT=1; [ "${2:-}" = "--no-edit" ] && EDIT=0
REPO="${GITHUB_REPOSITORY:-koala-1234/penny-chart}"
: "${VT_API_KEY:?VT_API_KEY is not set}"
VT=https://www.virustotal.com/api/v3
BEGIN='<!-- virustotal:start -->'; END='<!-- virustotal:end -->'
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
LAST=0
vt() { # rate-limited curl (free tier: 4/min -> 16s spacing), retries on 429/5xx
  local i code
  for i in 1 2 3 4 5; do
    local wait=$(( LAST + 16 - $(date +%s) )); [ $wait -gt 0 ] && sleep $wait
    LAST=$(date +%s)
    code=$(curl -sS -o "$WORK/resp" -w '%{http_code}' -H "x-apikey: $VT_API_KEY" "$@") || code=000
    case $code in 2??) cat "$WORK/resp"; return 0;; 404) return 4;; 429|5??|000) sleep $((60*i));; *) echo "VT HTTP $code" >&2; return 1;; esac
  done; echo "VT retries exhausted" >&2; return 1
}
gh release download "$TAG" -R "$REPO" -D "$WORK/a" -p '*.exe' -p '*.msi' -p '*.msix' -p '*.dmg' -p '*.pkg' -p '*.AppImage' -p '*.deb' -p '*.rpm' -p '*.apk'
LINES=()
for f in "$WORK"/a/*; do
  name=$(basename "$f"); size=$(stat -c%s "$f"); sha=$(sha256sum "$f" | cut -d' ' -f1)
  echo "== $name ($size bytes) sha256=$sha" >&2
  stats=""
  if rep=$(vt "$VT/files/$sha"); then
    stats=$(jq -c '.data.attributes.last_analysis_stats' <<<"$rep")
    [ "$(jq '[.[]]|add' <<<"$stats")" -gt 0 ] || stats=""
  fi
  if [ -z "$stats" ]; then
    [ "$size" -gt $((650*1024*1024)) ] && { LINES+=("- \`$name\`: too large for VT (>650MB) — SHA256 \`$sha\`"); continue; }
    url="$VT/files"
    [ "$size" -gt $((32*1024*1024)) ] && url=$(vt "$VT/files/upload_url" | jq -r .data)
    aid=$(vt -X POST -F "file=@$f" "$url" | jq -r .data.id)
    echo "   uploaded, analysis $aid" >&2
    for i in $(seq 1 40); do
      sleep 30
      st=$(vt "$VT/analyses/$aid" | jq -r .data.attributes.status)
      echo "   status $st" >&2
      [ "$st" = completed ] && break
    done
    rep=$(vt "$VT/files/$sha") || true
    stats=$(jq -c '.data.attributes.last_analysis_stats // empty' <<<"${rep:-{\}}")
  fi
  if [ -n "$stats" ]; then
    det=$(jq '.malicious+.suspicious' <<<"$stats"); tot=$(jq '.malicious+.suspicious+.undetected+.harmless' <<<"$stats")
    echo "   stats $stats" >&2
    LINES+=("- \`$name\`: **$det/$tot** — SHA256 \`$sha\` — https://www.virustotal.com/gui/file/$sha")
  else
    LINES+=("- \`$name\`: analysis pending — SHA256 \`$sha\` — https://www.virustotal.com/gui/file/$sha")
  fi
done
BLOCK=$(printf '%s\n' "$BEGIN" "## VirusTotal" "" "${LINES[@]}" "" "_Detections = malicious + suspicious / engines. 0 detections is not a guarantee of safety. Scanned $(date -u +%F)._" "$END")
echo "$BLOCK"
[ $EDIT = 1 ] || exit 0
gh release view "$TAG" -R "$REPO" --json body -q .body > "$WORK/body"
python3 - "$WORK/body" "$BEGIN" "$END" "$BLOCK" > "$WORK/new" <<'PY'
import sys,re
b,s,e,blk=open(sys.argv[1]).read(),*sys.argv[2:]
i=b.find(s); j=b.find(e,i)
print(b[:i]+blk+b[j+len(e):] if i>=0 and j>=0 else b.rstrip()+"\n\n"+blk)
PY
gh release edit "$TAG" -R "$REPO" --notes-file "$WORK/new" >/dev/null
echo "release notes updated" >&2

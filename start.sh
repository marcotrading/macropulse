#!/usr/bin/env bash
# Start MacroPulse (dashboard + /api/fred proxy run in one Next.js server).
#
# Usage:
#   ./start.sh          dev server (Turbopack)
#   ./start.sh prod     production build, then serve it
#   PORT=4000 ./start.sh   use a different port (default 3000)

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

MODE="${1:-dev}"
PORT="${PORT:-3000}"

fail() {
  echo "✖ $*" >&2
  exit 1
}

case "$MODE" in
  dev | prod) ;;
  *)
    echo "Usage: ./start.sh [dev|prod]   (PORT=<port> to override 3000)" >&2
    exit 1
    ;;
esac

# Node: Next.js 15 requires >= 18.18
command -v node >/dev/null 2>&1 || fail "Node.js not found. Install Node 18.18 or newer."
node -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 18 || (a === 18 && b >= 18) ? 0 : 1)' ||
  fail "Node $(node -v) is too old. Next.js 15 needs 18.18 or newer."

# FRED API key: without it /api/fred returns 500 and the dashboard shows no data
[[ -f .env.local ]] || fail ".env.local not found. Create it with NEXT_PUBLIC_FRED_API_KEY=<your key>."
api_key="$(grep -E '^NEXT_PUBLIC_FRED_API_KEY=' .env.local | tail -n 1 | cut -d= -f2- | tr -d "\"' \r")"
[[ -n "$api_key" ]] || fail "NEXT_PUBLIC_FRED_API_KEY is missing or empty in .env.local."

# Dependencies: install when missing or older than the lockfile
if [[ ! -f node_modules/.package-lock.json || package-lock.json -nt node_modules/.package-lock.json ]]; then
  echo "→ Installing dependencies (npm ci)..."
  npm ci
fi

# Port must be free
if (echo >"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  fail "Port $PORT is already in use. Stop that process or run PORT=<port> ./start.sh."
fi

if [[ "$MODE" == "prod" ]]; then
  echo "→ Building for production..."
  npm run build
  echo "→ Serving production build at http://localhost:$PORT"
  exec npm run start -- -p "$PORT"
fi

echo "→ Starting dev server at http://localhost:$PORT"
exec npm run dev -- -p "$PORT"

#!/usr/bin/env bash
# manage.sh — lifecycle management for the blog.waev.app Cloudflare Pages site.
# Usage: ./manage.sh <command>
#
#   blog:deploy    Build (production gate) and deploy to Cloudflare Pages (waev-blog)
#   blog:preview   Build with WAEV_PREVIEW=true and deploy as a non-production preview
#   blog:check     Clean production build, then list which posts would go live today
#
# This is the blog's own, standalone deploy entrypoint — it deliberately does
# NOT share the main waev monorepo's manage.sh (different repo, different Pages
# project, no D1 / ui-kit / ducting / secrets). It mirrors the safety idioms of
# that script's `site:deploy` target: dirty-tree guard, bounded Pages commit
# message, and a fresh build on every deploy.

set -euo pipefail

# Always run from the repo root, regardless of where the script is invoked from.
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

# ── Config (all overridable via env) ───────────────────────────────────────
# Pages project + production hostname for informational output. The CF account
# id is read from the environment so it can come from `~/.zshenv`, CI secrets,
# or be left to wrangler's own auth. Default matches .github/workflows/deploy.yml.
PAGES_PROJECT="${WAEV_BLOG_PAGES_PROJECT:-waev-blog}"
SITE_URL="${WAEV_BLOG_SITE_URL:-https://blog.waev.app}"
CF_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-21a39bcbcd9bc56b584615b83ef111ed}"
# Branch name used for preview deploys. Anything other than the project's
# production branch (`main`) lands as a *.waev-blog.pages.dev preview URL.
PREVIEW_BRANCH="${WAEV_BLOG_PREVIEW_BRANCH:-preview}"

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}▶${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }
die()   { echo -e "${RED}✘${NC}  $*" >&2; exit 1; }

require() { command -v "$1" &>/dev/null || die "Required tool not found: $1"; }
require npx

# Refuse to ship a dirty working tree to production when running in CI.
# Local (non-CI) deploys skip this guard — solo-dev iteration is the common
# case. Set WAEV_ALLOW_DIRTY=0 to re-enable locally; the `--commit-dirty=true`
# flag below tells wrangler to ACCEPT the dirty state for the Pages metadata.
guard_dirty_tree() {
  if [[ -n "$(git --no-pager status --porcelain 2>/dev/null)" && "${WAEV_ALLOW_DIRTY:-}" == "0" ]]; then
    die "Working tree is dirty. Commit/stash first, or unset WAEV_ALLOW_DIRTY to override."
  elif [[ -n "$(git --no-pager status --porcelain 2>/dev/null)" && -n "${CI:-}" && "${WAEV_ALLOW_DIRTY:-}" != "1" ]]; then
    die "Working tree is dirty (CI). Set WAEV_ALLOW_DIRTY=1 to override."
  fi
}

# `--commit-message` is bounded to `<short_sha> <subject>` because the
# Cloudflare Pages API rejects commit messages above ~3 KB with a misleading
# `Invalid commit message, it must be a valid UTF-8 string` (`code: 8000111`).
# Wrangler defaults to `git log -1` of the full message body, so any commit
# with a detailed body will fail the deploy once it crosses that limit.
# See https://github.com/cloudflare/workers-sdk/issues/4509.
pages_commit_msg() {
  git --no-pager log -1 --pretty=format:'%h %s' HEAD 2>/dev/null | cut -c1-256
}

CMD="${1:-help}"

case "$CMD" in

# ── blog:deploy ────────────────────────────────────────────────────────────
# Production deploy. The blog gates scheduled (future-dated) posts at BUILD
# time via src/lib/posts.ts: a production build only emits posts whose `date`
# has arrived. `WAEV_PREVIEW=true` bypasses that gate (used by blog:preview),
# so we explicitly UNSET it here — otherwise a preview flag lingering in the
# shell env would silently leak every scheduled post to blog.waev.app. This is
# the single most important safety net in this script; do not remove it.
blog:deploy)
  unset WAEV_PREVIEW
  guard_dirty_tree

  info "Building static site (production gate — scheduled posts stay hidden)..."
  npm run build

  info "Deploying to Cloudflare Pages ($PAGES_PROJECT)..."
  CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID" npx wrangler pages deploy dist \
    --project-name "$PAGES_PROJECT" \
    --commit-dirty=true \
    --commit-message "$(pages_commit_msg)"
  info "Blog deployed: ${SITE_URL}"
  ;;

# ── blog:preview ───────────────────────────────────────────────────────────
# Editorial preview. Builds with WAEV_PREVIEW=true so ALL scheduled posts are
# visible, and deploys to a non-production branch so it lands on a
# *.waev-blog.pages.dev preview URL instead of the production custom domain.
blog:preview)
  guard_dirty_tree

  info "Building static site (WAEV_PREVIEW=true — all scheduled posts visible)..."
  WAEV_PREVIEW=true npm run build

  info "Deploying preview to Cloudflare Pages ($PAGES_PROJECT, branch=$PREVIEW_BRANCH)..."
  CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID" npx wrangler pages deploy dist \
    --project-name "$PAGES_PROJECT" \
    --branch "$PREVIEW_BRANCH" \
    --commit-dirty=true \
    --commit-message "$(pages_commit_msg)"
  warn "Preview deploy is NOT production — use the printed *.pages.dev URL above."
  ;;

# ── blog:check ─────────────────────────────────────────────────────────────
# Dry-run confidence check: run a clean production build and list exactly which
# blog routes it emits, i.e. which posts would be live right now. Future-dated
# (scheduled) posts should be absent.
blog:check)
  unset WAEV_PREVIEW
  info "Clean production build to verify which posts would publish today..."
  npm run build >/dev/null
  info "Posts that would be LIVE now (production build output):"
  if [[ -d dist/blog ]]; then
    for d in dist/blog/*/; do
      [[ -d "$d" ]] && echo "  • $(basename "$d")"
    done
  else
    warn "No dist/blog directory — nothing built?"
  fi
  ;;

# ── help ───────────────────────────────────────────────────────────────────
*)
  echo "Usage: $0 <command>"
  echo ""
  echo "  blog:deploy    Build (production gate) + deploy to Cloudflare Pages ($PAGES_PROJECT)"
  echo "  blog:preview   Build with WAEV_PREVIEW=true + deploy as a non-production preview"
  echo "  blog:check     Clean production build, then list which posts would go live today"
  echo ""
  echo "Env overrides:"
  echo "  WAEV_ALLOW_DIRTY=0/1        Toggle the dirty-working-tree guard"
  echo "  CLOUDFLARE_ACCOUNT_ID       CF account id (default: baked-in waev account)"
  echo "  WAEV_BLOG_PAGES_PROJECT     Pages project name (default: waev-blog)"
  echo "  WAEV_BLOG_PREVIEW_BRANCH    Preview branch name (default: preview)"
  ;;
esac

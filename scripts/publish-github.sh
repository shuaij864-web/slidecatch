#!/usr/bin/env bash
set -euo pipefail

OWNER="${SLIDECATCH_GITHUB_OWNER:-shuaij864-web}"
REPO="${SLIDECATCH_GITHUB_REPO:-slidecatch}"
VISIBILITY="${SLIDECATCH_GITHUB_VISIBILITY:-public}"
TAG="${SLIDECATCH_GITHUB_TAG:-v0.1.0}"
FULL="$OWNER/$REPO"

case "$VISIBILITY" in
  public|private|internal) ;;
  *) echo "Visibility must be public, private, or internal." >&2; exit 1 ;;
esac

command -v git >/dev/null || { echo "git is required" >&2; exit 1; }
command -v gh >/dev/null || { echo "GitHub CLI (gh) is required" >&2; exit 1; }
gh auth status >/dev/null

[[ -d .git ]] || { echo "Run this script from the SlideCatch repository root." >&2; exit 1; }

npm run check

[[ -z "$(git status --porcelain)" ]] || {
  echo "Refusing to publish a dirty working tree. Commit or discard changes first." >&2
  exit 1
}
[[ "$(git rev-parse --abbrev-ref HEAD)" == "main" ]] || {
  echo "The publish script must run from the main branch." >&2
  exit 1
}
git rev-parse --verify "$TAG^{commit}" >/dev/null || {
  echo "Tag $TAG does not exist." >&2
  exit 1
}

if ! gh repo view "$FULL" >/dev/null 2>&1; then
  gh repo create "$FULL" --"$VISIBILITY" --description \
    "Privacy-first Chrome extension for collecting web slide images already loaded in the browser." \
    --source . --remote origin
elif ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$FULL.git"
else
  git remote set-url origin "https://github.com/$FULL.git"
fi

git push -u origin main
if git rev-parse "$TAG" >/dev/null 2>&1; then
  git push origin "$TAG"
fi

if [[ -f "release/slidecatch-${TAG}.zip" ]]; then
  git archive --format=zip --prefix="slidecatch-${TAG}/" \
    -o "release/slidecatch-${TAG}-source.zip" "$TAG"
  git bundle create "release/slidecatch-${TAG}.git.bundle" --all
  git bundle verify "release/slidecatch-${TAG}.git.bundle"
  cp VALIDATION_REPORT.md release/validation-report.md
  (cd release && sha256sum \
    "slidecatch-${TAG}.zip" \
    "slidecatch-${TAG}-source.zip" \
    "slidecatch-${TAG}.git.bundle" \
    validation-report.md > SHA256SUMS.txt && sha256sum -c SHA256SUMS.txt)
  assets=(
    "release/slidecatch-${TAG}.zip"
    "release/slidecatch-${TAG}-source.zip"
    "release/slidecatch-${TAG}.git.bundle"
    release/validation-report.md
    release/SHA256SUMS.txt
  )
  if gh release view "$TAG" --repo "$FULL" >/dev/null 2>&1; then
    gh release upload "$TAG" "${assets[@]}" --clobber --repo "$FULL"
  else
    gh release create "$TAG" "${assets[@]}" \
      --repo "$FULL" --verify-tag --generate-notes --title "SlideCatch ${TAG}"
  fi
fi

echo "Published: https://github.com/$FULL"

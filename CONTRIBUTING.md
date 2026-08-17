# Contributing to SlideCatch

Thank you for improving SlideCatch. Contributions are accepted only when they preserve the project's local-first, explicit-permission, and access-control boundaries.

## Before opening a change

1. Search existing issues and pull requests.
2. For a new platform adapter, collect a **non-sensitive, reproducible fixture**. Do not attach real private courseware, cookies, signed URLs, access tokens, or account identifiers.
3. For behavior changes, state the expected effect on permissions, stored data, false positives, false negatives, and export compatibility.
4. For security-sensitive changes, read [SECURITY.md](SECURITY.md) and [docs/threat-model.md](docs/threat-model.md).

## Development setup

Requirements:

- Node.js 20 or newer;
- npm 10 or newer;
- Chrome/Chromium 120 or newer for manual validation;
- Python 3.11+ and Playwright only for the optional full extension test.

The normal build is zero-dependency:

```bash
npm ci
npm run check
npm run test:e2e
```

For the full unpacked-extension test:

```bash
python -m pip install -r requirements-e2e.txt
python -m playwright install --with-deps chromium
npm run test:extension
```

## Repository conventions

- Source code uses modern JavaScript ES modules.
- Production extension pages must not use remotely hosted scripts, `eval`, `new Function`, or equivalent dynamic execution.
- Keep provider-specific behavior under `src/providers/` rather than adding platform checks to the core collector.
- Keep the production manifest free of mandatory website host permissions.
- Any new permission must be justified in `docs/permissions.md` and reflected in `PRIVACY.md`.
- Any storage-schema change must increment `DB_VERSION`, include an upgrade path, and add tests.
- Any export-format change must remain backwards-compatible or increment the manifest format identifier.
- User-visible strings belong in both `_locales/en/messages.json` and `_locales/zh_CN/messages.json`.

## Adding a provider

Read [docs/provider-development.md](docs/provider-development.md). A provider must:

- match only its intended page locations;
- request the narrowest practical host patterns;
- derive a stable session identity without exposing authentication material;
- score only resources already observed in the browser;
- canonicalize volatile signed-query parameters safely;
- never enumerate undisplayed pages or guess protected URLs;
- include unit tests and a synthetic fixture.

## Test expectations

Every pull request should pass:

```bash
npm run lint
npm test
npm run build
npm run validate
npm run package
npm run test:e2e
```

Changes affecting permissions, service-worker capture, IndexedDB persistence, export, or content-script registration should also pass:

```bash
npm run test:extension
```

The GitHub Actions workflow runs the full extension test in Playwright Chromium.

## Pull request content

A useful pull request includes:

- problem statement and scope;
- before/after behavior;
- tests added or updated;
- permission and privacy impact;
- rollback or compatibility notes;
- screenshots for material UI changes;
- a statement confirming that no private course content or credentials are included.

## Commit messages

Conventional Commit prefixes are recommended:

```text
feat: add provider adapter
fix: preserve page hint during deduplication
test: cover signed URL canonicalization
docs: clarify host permission flow
security: reject unsafe match patterns
```

## Certificate of contribution

By submitting a contribution, you certify that you have the right to license it under the repository's MIT License and that the submission contains no confidential or unauthorized third-party content.

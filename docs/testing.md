# Testing and validation

SlideCatch uses layered validation because browser extensions combine pure logic, generated bundles, browser APIs, persistence, permissions, and UI.

## 1. Static checks

```bash
npm run lint
```

Checks JavaScript and JSON syntax, local import resolution, and prohibited dynamic-code patterns.

```bash
npm run validate
```

Checks the production manifest, referenced files, permission shape, extension Content Security Policy, absence of mandatory host permissions/static production content scripts, and absence of remote executable code.

## 2. Unit tests

```bash
npm test
```

The unit suite covers:

- signed-query URL canonicalization;
- Chrome match-pattern parsing;
- generic session normalization;
- Chinese/English page-number inference;
- candidate scoring and thresholds;
- generic, Yuketang, and custom provider behavior;
- capture identity and signed-URL/token sanitization;
- permission-record reconciliation, overlapping host grants, and revocation behavior;
- session title/update behavior;
- sorting and missing-page analysis;
- dependency-free ZIP output and path safety.

## 3. Build and package checks

```bash
npm run build
npm run package
unzip -t release/slidecatch-v0.1.0.zip
```

The release archive must contain the root-level extension manifest and built resources, not an extra enclosing directory.

## 4. Managed-cloud browser harness

```bash
npm run test:e2e
```

This executes the actual built `content.js` and `popup.js` bundles in real Chromium with a deterministic mock of the required Chrome messaging APIs. The fixture verifies:

- `<img>` discovery;
- CSS background-image discovery;
- dynamic DOM mutation;
- page-number extraction;
- signed/data URL deduplication;
- possible missing page `3` from pages `1,2,4,5,6`;
- popup status rendering;
- immediate collector shutdown after simulated permission revocation;
- absence of browser console errors.

The harness is designed to run even in managed environments that prohibit unpacked extension installation.

## 5. Full unpacked-extension E2E

```bash
python -m pip install -r requirements-e2e.txt
python -m playwright install --with-deps chromium
npm run test:extension
```

The test builds `dist-e2e/`, launches a persistent Playwright Chromium context with the unpacked extension, serves a localhost fixture, and validates:

1. service-worker startup and extension ID;
2. dynamic/static content-script collection on a real web origin;
3. authorized cross-origin/localhost image retrieval through the service worker;
4. IndexedDB slide and session persistence;
5. URL/content deduplication;
6. page ordering and missing-page indication;
7. library rendering;
8. ZIP download and manifest contents;
9. persistence after extension-page reload;
10. immediate shutdown after site disable, with a post-disable resource ignored;
11. no console or page errors.

The GitHub Actions CI workflow runs this test on Ubuntu with Playwright Chromium.

## 6. Manual release smoke test

Before publishing a stable release:

1. Load `dist/` through `chrome://extensions`.
2. Confirm installation requests no site access.
3. Enable only a synthetic/local test site.
4. Confirm the browser permission prompt matches the expected page host.
5. Test images, CSS backgrounds, lazy-loaded mutation, duplicate slides, pause/resume, manual scan, and resource-host permission escalation.
6. Close and reopen Chrome; confirm dynamic registration and IndexedDB data persist.
7. Revoke the site; confirm the content script no longer starts there.
8. Export ZIP and PDF; inspect page order, MIME extensions, image bytes, and `slidecatch-manifest.json`.
9. Clear/delete a session and uninstall the extension; confirm expected local-data lifecycle.

## 7. Validation artifacts

The checked-in cloud record is documented in [CLOUD_VALIDATION.md](CLOUD_VALIDATION.md), with machine-readable results and screenshots under `docs/assets/`.

## 8. Known limits of automated testing

- Automated fixtures do not establish compatibility with every courseware platform.
- A passing generic fixture does not prove an authenticated production platform has not changed its DOM, CDN, or permission behavior.
- DRM, encrypted video, and server-rendered inaccessible resources are intentionally outside scope.
- Browser store review and real user profiles can impose policies not represented in CI.

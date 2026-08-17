# Cloud validation record — v0.1.0

**Validation date:** 2026-08-17  
**Target:** SlideCatch `0.1.0` source, production bundles, and release archive  
**Environment:** managed Debian 13 cloud runtime; Node.js 22.16.0; Python 3.13.5; Playwright 1.57.0; Chromium 144.0.7559.96

## Result summary

| Check | Result |
|---|---:|
| npm dependency audit | Passed — 0 known vulnerabilities |
| JavaScript/JSON/import/static policy lint | Passed — 110 files checked |
| Unit tests | Passed — 33/33 |
| Production build | Passed |
| Manifest, CSP, permission, locale, and remote-code validation | Passed |
| Release ZIP generation and independent archive verification | Passed |
| Release archive SHA-256 | `df3e57b363992a864dcdb5aac6475593e8048b887370bf5883d54fffebf5c80f` |
| Real-Chromium content bundle harness | Passed |
| Real-Chromium popup bundle harness | Passed |
| Permission-revocation stop behavior in Chromium harness | Passed |
| Full unpacked-extension E2E in this managed browser | Attempted; blocked by managed browser policy |
| Full unpacked-extension E2E workflow for unrestricted GitHub-hosted Chromium | Included |
| Authenticated live Yuketang account test | Not performed |

## Real-Chromium harness evidence

The policy-compatible cloud harness executed the generated `dist/content.js` and `dist/popup.js` bundles in a real Chromium process against a deterministic synthetic lecture fixture.

Observed result:

```json
{
  "capturedSlides": 5,
  "recognizedPages": [1, 2, 4, 5, 6],
  "missingPages": [3],
  "sources": ["background", "image"],
  "dynamicMutationObserved": true,
  "duplicateSuppressed": true,
  "permissionRevocationStopsCollector": true,
  "consoleErrors": []
}
```

This validates built production bundles rather than only isolated helper functions. The fixture includes:

- ordinary `<img>` slides;
- a CSS background slide;
- a slide inserted after startup through DOM mutation;
- a duplicate signed-resource variant;
- Chinese page-number labels;
- a deliberate page gap;
- explicit collector shutdown after permission revocation.

Evidence artifacts:

- [`assets/cloud-validation-result.json`](assets/cloud-validation-result.json)
- [`assets/cloud-validation-environment.json`](assets/cloud-validation-environment.json)
- [`assets/cloud-validation-content.png`](assets/cloud-validation-content.png)
- [`assets/cloud-validation-popup.png`](assets/cloud-validation-popup.png)
- [`assets/cloud-validation-static.log`](assets/cloud-validation-static.log)
- [`assets/cloud-validation-browser.log`](assets/cloud-validation-browser.log)

## Full unpacked-extension attempt and boundary

A genuine unpacked-extension startup test was also attempted with the production E2E package and system Chromium. Navigation to the deterministic extension origin was rejected with `net::ERR_BLOCKED_BY_CLIENT`, and a separate 10-second service-worker probe observed zero extension workers. The managed browser profile applies both an all-URL navigation block and an unpacked-extension installation block. The validation did not disable, modify, or bypass those policies.

The exact sanitized attempt log is retained at:

- [`assets/cloud-validation-full-extension-attempt.log`](assets/cloud-validation-full-extension-attempt.log)

Therefore, this cloud runtime cannot truthfully establish the complete service-worker, host-permission, IndexedDB, and download lifecycle of an unpacked extension. To close that gap on an unrestricted runner, the repository includes `tests/e2e/extension_test.py` and GitHub Actions jobs that use Playwright's bundled Chromium channel and validate:

- unpacked Manifest V3 extension loading;
- service-worker startup;
- per-site content-script execution;
- same-page and cross-origin image capture;
- IndexedDB persistence;
- page-gap rendering;
- ZIP download and embedded manifest;
- persistence after page reload and browser restart;
- absence of page, popup, and library console errors.

## Scope of the claim

The completed cloud checks support these conclusions:

- the source parses, builds, packages, and passes its current 33-test unit suite;
- the release ZIP is internally consistent and reproducibly verifiable;
- the production content and popup bundles execute successfully in real Chromium on the synthetic supported scenario;
- image/background discovery, dynamic capture, deduplication, page inference, missing-page reporting, popup rendering, and permission-revocation shutdown function in that scenario;
- the validator finds no mandatory host permission, remotely executed code, inline script, unsafe archive path, or prohibited dynamic-code primitive in the release package.

They do **not** establish that every learning platform is supported or that the authenticated Yuketang production site has not changed. A logged-in, authorized Yuketang smoke test remains a release acceptance step for the built-in provider.

## Reproduce

Static, unit, build, package, and release validation:

```bash
npm ci
npm run check
```

Policy-compatible Chromium bundle harness:

```bash
python -m pip install -r requirements-e2e.txt
CHROMIUM_PATH=/path/to/chromium npm run test:e2e
```

Full unpacked-extension E2E on an unrestricted machine or GitHub-hosted runner:

```bash
python -m pip install -r requirements-e2e.txt
python -m playwright install --with-deps chromium
SLIDECATCH_E2E_HEADLESS=1 npm run test:extension
```

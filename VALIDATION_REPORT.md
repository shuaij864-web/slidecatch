# SlideCatch v0.1.0 validation report

**Validation date:** 2026-08-17  
**Target:** source tree, generated production bundles, release ZIP, and browser-facing capture/UI behavior  
**Environment:** managed Debian 13 cloud runtime; Node.js 22.16.0; npm 10.9.2; Python 3.13.5; Playwright 1.57.0; Chromium 144.0.7559.96

## Executive result

SlideCatch v0.1.0 met the source, unit, build, package, static-security, and policy-compatible Chromium acceptance criteria defined for this release. The generated extension archive is internally consistent and the built content/popup bundles executed without console errors against a deterministic synthetic lecture fixture.

The managed browser profile blocked unpacked-extension installation and all URL navigation. The extension-origin page returned `net::ERR_BLOCKED_BY_CLIENT`, and a separate service-worker probe observed zero workers. Consequently, the complete Manifest V3 service-worker/host-permission/IndexedDB/download lifecycle could not be established inside this specific runtime. The repository contains a separate Playwright test and GitHub Actions job for that lifecycle on an unrestricted Playwright Chromium runner.

## Acceptance matrix

| Area | Acceptance criterion | Result | Evidence |
|---|---|---:|---|
| Dependency state | Clean install and no known npm vulnerabilities | Passed | `docs/assets/cloud-validation-static.log` |
| Source integrity | JavaScript/JSON syntax, import resolution, and prohibited dynamic-code checks | Passed — 110 files | `docs/assets/cloud-validation-static.log` |
| Unit behavior | Core URL, provider, permission, capture identity, sorting, page-gap, and ZIP tests | Passed — 33/33 | `docs/assets/cloud-validation-static.log` |
| Production build | Zero-dependency bundling completes | Passed | `dist/` generated |
| Manifest/security policy | MV3, reviewed permission allowlist, no mandatory host access, CSP, local code only | Passed | `npm run validate` output |
| Release archive | File set, CRC, paths, manifest identity, and SHA-256 verified independently | Passed | `release/slidecatch-v0.1.0.zip` |
| Release SHA-256 | Exact digest | `df3e57b363992a864dcdb5aac6475593e8048b887370bf5883d54fffebf5c80f` | `docs/assets/cloud-validation-static.log` |
| Browser capture harness | Built content bundle detects image/background/dynamic slides and suppresses duplicates | Passed | `docs/assets/cloud-validation-result.json` |
| Page inference | Recognized pages `1,2,4,5,6`; reported missing page `3` | Passed | same result JSON |
| Popup UI | Built popup bundle renders session/site status and controls | Passed | `docs/assets/cloud-validation-popup.png` |
| Permission revocation | Running collector stops when permission is revoked in the harness | Passed | result JSON |
| Browser errors | Page/popup console errors | None observed | result JSON |
| Full unpacked extension in managed runtime | Service worker and extension-page lifecycle completes | Blocked by enforced browser policy | `docs/assets/cloud-validation-full-extension-attempt.log` |
| Authenticated production Yuketang | Logged-in live-site smoke test | Not performed | Requires an authorized real account/browser profile |

## Browser-harness result

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

## Evidence-strength assessment

- **Strong:** source parsing, unit suite, deterministic build, manifest/CSP/permission validation, archive integrity, bundle-level Chromium behavior on the synthetic fixture.
- **Moderate:** generic platform compatibility for ordinary image/CSS-background slide renderers. The fixture exercises representative mechanisms but not every framework or CDN policy.
- **Not established:** current authenticated Yuketang production compatibility and the complete unpacked-extension lifecycle inside the managed cloud profile.

## Reproduction

```bash
npm ci
npm run check
python -m pip install -r requirements-e2e.txt
CHROMIUM_PATH=/path/to/chromium npm run test:e2e
```

On an unrestricted Playwright Chromium runner:

```bash
python -m playwright install --with-deps chromium
SLIDECATCH_E2E_HEADLESS=1 npm run test:extension
```

Detailed evidence and boundary analysis are in [`docs/CLOUD_VALIDATION.md`](docs/CLOUD_VALIDATION.md).

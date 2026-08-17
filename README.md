<div align="center">
  <img src="src/assets/icons/icon128.png" width="96" height="96" alt="SlideCatch logo">
  <h1>SlideCatch</h1>
  <p><strong>A privacy-first Chrome extension for collecting slide images already loaded in your browser.</strong></p>
  <p>
    <a href="README.zh-CN.md">简体中文</a> ·
    <a href="PRIVACY.md">Privacy</a> ·
    <a href="docs/architecture.md">Architecture</a> ·
    <a href="docs/provider-development.md">Provider development</a>
  </p>
</div>

[![CI](https://github.com/shuaij864-web/slidecatch/actions/workflows/ci.yml/badge.svg)](https://github.com/shuaij864-web/slidecatch/actions/workflows/ci.yml)
[![CodeQL](https://github.com/shuaij864-web/slidecatch/actions/workflows/codeql.yml/badge.svg)](https://github.com/shuaij864-web/slidecatch/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SlideCatch watches a web page that **you explicitly enable**, detects presentation-like images already delivered to that browser tab, caches the image bytes locally, restores page order where possible, reports possible gaps, and exports the result as ZIP or through the browser's print-to-PDF function.

It is not a crawler, DRM bypass, login bypass, or hidden-page enumerator.

## What it does

- Continuously observes `<img>`, `srcset`, CSS `background-image`, browser resource entries, and—when enabled—large `<canvas>` snapshots.
- Uses size, aspect ratio, URL families, nearby labels, and provider-specific rules to distinguish slides from logos, avatars, trackers, and icons.
- Stores image **bytes**, metadata, hashes, and aliases in local IndexedDB so an expiring signed URL does not invalidate a page already captured.
- Deduplicates repeated pages by canonical resource URL and SHA-256 content hash.
- Extracts page numbers from Chinese and English labels such as `第 21 页`, `Slide 9 of 40`, attributes, filenames, and provider rules.
- Reports possible missing page numbers without guessing URLs or fetching undisplayed pages.
- Stops an already-running collector immediately when the site is disabled or its host permission is revoked.
- Exports ordered images as a standards-readable ZIP with `slidecatch-manifest.json`, or as PDF through the browser print dialog.
- Includes a Rain Classroom / Yuketang provider and a generic detector for other slide-based sites.
- Has no server, telemetry, analytics, advertising SDK, or remotely executed code.

## Supported scope

| Mode | Status | Notes |
|---|---:|---|
| Generic web slide detection | Built in | Works where slides are rendered as browser-visible images or CSS backgrounds. |
| Rain Classroom / Yuketang | Built in | Recognizes Yuketang lesson sessions and `/slide/` CDN resources. |
| Custom platform rules | Built in | Local JSON rules can define host, slide URL, session, page-number, and permission patterns. |
| Canvas-only renderers | Optional | Disabled by default; cross-origin-tainted canvases may not be serializable. |
| Cross-origin iframes and shadow-root-only renderers | Not supported in v0.1 | The collector currently scans the ordinary top-level document DOM. |
| Video-only, encrypted, DRM, or server-side protected content | Not supported | SlideCatch does not bypass access controls. |
| Original editable PPT recovery | Not supported | Raster images cannot reconstruct animations, text boxes, fonts, or authoring structure losslessly. |

## Install an unpacked build

1. Download a release ZIP and extract it, or run `npm run build` from source.
2. Open `chrome://extensions/`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted release folder or this repository's `dist/` folder.
5. Pin SlideCatch if desired.

The production manifest requests no mandatory website access. On first use, click the extension and choose **Enable on this site**. Chrome then asks for only the relevant host patterns. If slide images arrive from a separate CDN, SlideCatch lists those resource hosts and asks for a second explicit permission.

## Use it during a live class

1. Open the authorized courseware page.
2. Click SlideCatch → **Enable on this site**.
3. Leave the lesson page open while the presenter advances. The badge and in-page overlay update as new pages are cached.
4. If a site lazy-loads thumbnails, scroll the slide list once and click **Scan now**.
5. Open **Library / export**, review page numbers and possible gaps, then download ZIP or print to PDF.

A reported gap means only that recognized page numbers are non-contiguous. It is evidence to review, not proof that the collector failed: a deck can intentionally omit numbers or contain unnumbered pages.

## Permission model

The production extension declares:

```json
{
  "permissions": ["activeTab", "scripting", "storage", "unlimitedStorage"],
  "optional_host_permissions": ["http://*/*", "https://*/*"]
}
```

`optional_host_permissions` defines what the extension is allowed to ask for; it does **not** grant all-site access at installation. Host access is requested from a user gesture for the current platform and registered as a persistent content-script rule only after approval. Disabling a site or externally revoking its host permission stops the currently loaded collector and prevents future session registration. See [docs/permissions.md](docs/permissions.md).

## Local data

- Database: browser IndexedDB, extension origin.
- Settings and enabled sites: `chrome.storage.local`.
- Current tab-to-session mapping: `chrome.storage.session`.
- Network upload: none.
- Telemetry: none.
- Remote JavaScript/WASM: none.

Clearing a session or deleting the extension removes data under the normal browser storage lifecycle. See [PRIVACY.md](PRIVACY.md).

## Development

Requirements:

- Node.js 20 or newer.
- Chrome or Chromium 120 or newer for manual testing.
- Python Playwright only for the optional full browser-extension test.

The build is deliberately zero-dependency: the repository includes a small deterministic ES-module bundler and ZIP writer.

```bash
npm ci
npm run lint
npm test
npm run build
npm run validate
npm run package
npm run verify:release
```

Outputs:

```text
dist/                         unpacked production extension
release/slidecatch-v0.1.0.zip installable release archive
```

For a policy-compatible real-Chromium bundle/UI harness:

```bash
npm run test:e2e
```

For a full unpacked-extension test on a normal CI runner with Playwright Chromium installed:

```bash
python -m pip install playwright==1.57.0
python -m playwright install --with-deps chromium
npm run test:extension
```

See [docs/testing.md](docs/testing.md), the checked-in [cloud validation record](docs/CLOUD_VALIDATION.md), and [VALIDATION_REPORT.md](VALIDATION_REPORT.md).

## Provider architecture

The core collector does not contain Yuketang-specific logic. Platform knowledge is isolated under `src/providers/`:

```text
src/
├── core/          scoring, page numbers, sorting, storage, URL normalization
├── content/       DOM/resource observers and in-page status overlay
├── background/    permissions, capture, deduplication, persistence, messaging
├── providers/     generic, Yuketang, and user-defined adapters
├── export/        dependency-free ZIP writer
└── ui/            popup, library, options
```

A provider controls location matching, permission planning, session identity, resource scoring, URL canonicalization, page-number hints, and whether a resource URL is sufficiently strong to accept before dimensions are known. See [docs/provider-development.md](docs/provider-development.md).

## Security and legal boundaries

Use SlideCatch only for content you are authorized to access and retain. The project intentionally does not:

- bypass login, paywalls, DRM, encryption, or course access controls;
- enumerate unpublished or undisplayed page numbers;
- guess signed URLs;
- replay authentication tokens outside the browser's permission model;
- recover original editable PPT objects from rasterized pages.

Web pages are untrusted input. SlideCatch enforces image-size limits, conservative match-pattern validation, Content Security Policy, no dynamic code execution, no remote code, content hashing, and explicit host permissions. Review [docs/threat-model.md](docs/threat-model.md) before adding broader capture mechanisms.

## Contributing

Bug reports, platform adapters, tests, and documentation improvements are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) first.

## License

MIT. See [LICENSE](LICENSE).

SlideCatch is an independent open-source project and is not affiliated with Rain Classroom, Yuketang, or their operators.

# SlideCatch architecture

## 1. Design goals

SlideCatch is a Manifest V3 browser extension designed around five properties:

1. **Local-first:** captured image bytes and metadata remain in the browser profile.
2. **Explicit authority:** the production build has no mandatory website host access; users enable sites and resource hosts deliberately.
3. **Observed-resource boundary:** the collector processes resources already present in the page, DOM, CSS, or browser resource timeline. It does not enumerate hidden pages.
4. **Provider isolation:** platform-specific knowledge is contained in adapters.
5. **Deterministic release:** the build and ZIP packaging path has no runtime or build-time third-party dependency.

## 2. Component map

```text
┌──────────────────────── target website tab ─────────────────────────┐
│ content.js                                                         │
│  ├─ DOM / MutationObserver                                         │
│  ├─ PerformanceObserver                                            │
│  ├─ image, srcset, CSS background, optional canvas detectors       │
│  ├─ provider selection and page-hint extraction                    │
│  └─ isolated Shadow DOM status overlay                             │
└───────────────────────────┬────────────────────────────────────────┘
                            │ chrome.runtime messaging
┌───────────────────────────▼────────────────────────────────────────┐
│ background.js — Manifest V3 service worker                         │
│  ├─ permission and dynamic content-script lifecycle                │
│  ├─ tab ↔ session association                                      │
│  ├─ authorized cross-origin image fetch + page-context fallback    │
│  ├─ dimension validation, scoring, SHA-256 deduplication            │
│  ├─ IndexedDB persistence                                          │
│  └─ status broadcast and action badge                              │
└───────────────┬──────────────────────────────┬─────────────────────┘
                │                              │
       ┌────────▼─────────┐           ┌────────▼────────────┐
       │ popup / options  │           │ library / export   │
       │ enable, pause,   │           │ review, reorder,   │
       │ permissions      │           │ ZIP, print-to-PDF  │
       └──────────────────┘           └─────────────────────┘
```

## 3. Source layout

| Path | Responsibility |
|---|---|
| `src/core/` | URL normalization, candidate scoring, settings, page-number inference, ordering, missing-page analysis, IndexedDB access, i18n helpers. |
| `src/providers/` | Generic, Rain Classroom/Yuketang, and local custom adapters. |
| `src/content/` | Page observers, candidate construction, fallback fetch, canvas handling, overlay. |
| `src/background/` | Permissions, registered content scripts, sessions, capture, deduplication, persistence, message routing. |
| `src/export/` | Standards-readable, dependency-free ZIP encoder. |
| `src/ui/` | Popup, library/export page, and settings page. |
| `scripts/` | Deterministic bundler, build, validation, packaging, and repository release helpers. |
| `tests/` | Unit tests plus real-Chromium harnesses. |

## 4. Capture data flow

### 4.1 Discovery

The content script observes:

- `<img src>` and `currentSrc`;
- `srcset` on images and `<source>` elements;
- CSS `background-image` on sufficiently large elements;
- resource timing entries whose initiator type can represent an image/resource request;
- optional large `<canvas>` elements, when the user enables canvas capture.

Each observation becomes a candidate containing the URL, source type, intrinsic/rendered dimensions, visibility, URL-family count, and the best available page hint.

Version 0.1 scans the ordinary top-level document DOM. It does not traverse cross-origin frames, open or closed shadow roots, or privileged browser surfaces; providers must not imply support for content visible only inside those boundaries.

### 4.2 Candidate scoring

The generic detector combines:

- dimensions and area;
- plausible presentation aspect ratio;
- common 16:9 and 4:3 ratios;
- positive and negative URL tokens;
- repeated URL family evidence;
- page-number evidence;
- provider score;
- configured strict/balanced/permissive threshold.

A platform provider can strongly accept a known resource pattern, but the background worker still verifies the returned object is a bounded image and applies post-fetch scoring unless the resource is explicitly strong.

### 4.3 Permission boundary

A page host is enabled by user gesture. If a discovered image is served from another origin, capture stops at a pending-permission state. The user must grant that resource-origin pattern before the service worker can re-request and cache the image. Disabling the site or externally revoking its page permission stops the running collector, clears its tab mapping, and prevents new session registration.

### 4.4 Retrieval and validation

The background worker attempts an authorized fetch with omitted credentials first, then included credentials, then a page-context fallback limited to URLs that the content script actually observed. It enforces configured byte limits, decodes or derives dimensions, and rejects non-image payloads or implausible candidates.

### 4.5 Deduplication

Two independent keys are used:

1. **Resource alias:** provider-canonicalized URL, with volatile signature/query parameters removed according to adapter policy.
2. **Content identity:** SHA-256 of the image bytes within the session.

A repeated alias or hash updates last-seen metadata and can improve page hints without creating another slide record.

### 4.6 Persistence

IndexedDB stores three object stores:

```text
sessions   key: sessionKey
slides     key: id; unique index: [sessionKey, contentHash]
aliases    key: sessionKey|resourceKey → slideId
```

Image `Blob` objects live in `slides`. Settings and enabled-site records use `chrome.storage.local`; tab-to-session links use `chrome.storage.session`.

## 5. Session identity

- **Generic provider:** hashes origin plus a normalized page path.
- **Yuketang provider:** uses the lesson identifier when present, otherwise hashes the stable path.
- **Custom provider:** hashes a user-defined session URL match.

Session identifiers never intentionally include cookies, authorization headers, or raw signed query strings.

## 6. Export

The library orders slides by recognized page number when reliable, then by capture sequence. Users can correct page hints locally. ZIP output contains:

```text
slides/001.<ext>
slides/002.<ext>
...
slidecatch-manifest.json
```

The manifest records metadata and source-independent identifiers, not authentication headers or browser cookies. PDF output uses a local extension page and the browser print dialog.

## 7. Build architecture

The source is authored as ES modules. `scripts/bundle.mjs` resolves local static imports, wraps modules, and emits deterministic single-file bundles for the service worker, content script, and UI entry points. `scripts/build.mjs` copies static assets and generates either:

- `dist/`: production manifest with optional host permissions and no static content scripts;
- `dist-e2e/`: test-only manifest with localhost permissions and fixture content-script registration.

`dist-e2e/` is not a release artifact.

## 8. Extension points

The stable extension boundary is the provider interface documented in [provider-development.md](provider-development.md). Detection, storage, permission, and export changes should remain platform-neutral whenever possible.

# Threat model

## 1. Scope and security objective

SlideCatch runs with browser-extension authority on sites explicitly approved by the user. Its security objective is to collect only presentation-like image resources already observed by an authorized browser session, retain them locally, and export them without leaking credentials or expanding access rights.

This document covers the extension, its local database, generated exports, configured providers, and interactions with untrusted web pages. It does not claim to secure the third-party course platform itself.

## 2. Assets

- captured slide image bytes;
- course/session titles and page URLs;
- page-number annotations and capture metadata;
- enabled-site and resource-origin permissions;
- extension settings and custom provider rules;
- integrity of the extension package and export archive;
- browser profile confidentiality.

Authentication cookies and tokens are not intentionally stored by SlideCatch, but image requests may execute within a browser context that possesses them.

## 3. Trust boundaries

```text
Untrusted website DOM / CSS / URLs
        │
        ▼
Content-script candidate parser
        │ structured messages
        ▼
Extension service worker and Chrome permission checks
        │
        ├── authorized network image response
        ├── extension IndexedDB
        └── export ZIP / print page

User-authored custom provider JSON is trusted as local configuration but not as safe code.
```

## 4. Adversaries and misuse cases

1. A malicious enabled page tries to make the extension fetch arbitrary URLs or local-network resources.
2. A page supplies huge, malformed, polyglot, or misleading image payloads.
3. A page repeats signed URLs to exhaust storage or create duplicates.
4. A crafted title/page label injects markup into extension UI or exported metadata.
5. A custom regular expression causes pathological backtracking.
6. Another extension or local actor accesses the same browser profile.
7. A maintainer introduces remote code, telemetry, broader permissions, or a supply-chain dependency.
8. A user attempts to use the project to bypass access control or enumerate hidden pages.

## 5. Controls

### Authority and network access

- No mandatory production host permission.
- Site/resource origins require explicit user approval.
- Capture requests require a registered sender tab and matching tab/session association.
- Page-context fallback accepts only URLs already observed by that content script.
- Only HTTP(S), data, or blob candidates are considered; privileged browser schemes are excluded.
- The project does not synthesize neighboring page URLs or scan numerical ranges.

### Input validation

- Candidate dimensions, area, aspect ratio, URL tokens, provider evidence, and visibility are scored.
- Per-image byte limit is configurable and bounded.
- Image MIME and dimensions are validated before persistence.
- Data URLs have an independent hard size bound.
- Match patterns are sanitized to conservative HTTP(S) host forms.
- UI uses `textContent` for untrusted titles, labels, and errors.

### Persistence and deduplication

- Resource URLs are canonicalized by provider policy; volatile authorization-like query parameters are removed before persistence.
- Inline data/blob/canvas captures persist a local content identity rather than the source page URL.
- Image bytes are hashed with SHA-256 within each session.
- IndexedDB enforces unique `[sessionKey, contentHash]` records.
- ZIP filenames are generated internally and do not use untrusted path fragments.
- Exports exclude cookies, request headers, and raw authorization material.

### Extension integrity

- Manifest V3 Content Security Policy permits only self-hosted scripts.
- No `eval`, `new Function`, remote JavaScript, remote WASM, analytics SDK, or application server.
- Build and packaging are zero-dependency and validated in CI.
- CodeQL and static checks run on pushes and pull requests.

## 6. Residual risks

| Risk | Residual condition | Mitigation/decision |
|---|---|---|
| Enabled-site request abuse | A malicious page can expose a URL on an origin the user separately approved. | Scope permissions narrowly; show pending resource hosts; require explicit approval; never approve broad patterns silently. |
| Local-network origin | Optional host permission can technically include an intranet host if the user approves it. | No automatic expansion; users and reviewers must verify prompts. Future versions may add private-address warnings. |
| Credentialed re-fetch | Some images require cookies; an approved origin may receive a credentialed request. | Try `credentials: omit` first; include only on the same explicitly approved URL; never expose cookies to extension UI/export. |
| Storage exhaustion | Long sessions can contain many large images. | Per-image cap, deduplication, visible session size, manual clear/delete, browser quota controls. A future release may add per-session caps. |
| Regex denial of service | Custom provider rules are user-authored JavaScript regexes. | Length limit, local-only configuration, documentation to use anchored bounded patterns. A future rule engine may reject high-risk constructs. |
| SVG active content | SVG is stored/exported as an image Blob. Rendering environments can differ. | Extension pages do not inject SVG markup directly; consumers should treat exports as untrusted files. Future releases may rasterize or disable SVG by default. |
| Browser/profile compromise | Same-profile malware or a hostile extension can access broader browser data. | Outside SlideCatch's trust boundary; use browser profile and OS security controls. |
| Platform terms/copyright | Authorization to view does not always imply authorization to retain or redistribute. | Prominent user-responsibility and legal-boundary documentation; no bypass functionality. |

## 7. Security invariants for changes

A release must not weaken these without an explicit security review:

1. Installation grants no mandatory website host access.
2. New origins require an explicit browser permission prompt.
3. Capture candidates originate from observed resources, not guessed sequences.
4. Background capture is bound to a sender tab/session.
5. Image size and type validation occurs before persistence.
6. No captured content leaves the browser profile through SlideCatch-controlled networking.
7. No remote executable code enters the extension.
8. Export paths are generated and traversal-safe.
9. Revoking a site unregisters its persistent content script and stops any currently loaded collector for that site.
10. Transient credentials, raw cookies, and signed authorization parameters are not written to exports or intentionally retained as source metadata.
11. Security-relevant failures are surfaced rather than silently bypassed.

## 8. Out of scope

- breaking DRM or encryption;
- bypassing account, course, paywall, or regional restrictions;
- recovering original editable PowerPoint objects from raster images;
- traversing cross-origin frames, shadow-root-only renderers, or privileged browser surfaces in version 0.1;
- protecting against a fully compromised browser/operating system;
- certifying compliance with a platform's terms or copyright law for a user's specific use.

## 9. Verification

Controls are checked through manifest validation, unit tests, a real-Chromium built-bundle harness, a full unpacked-extension Playwright test, ZIP integrity tests, CodeQL, and manual release review. See [testing.md](testing.md).

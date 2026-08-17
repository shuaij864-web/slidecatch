# Provider development

A provider is a small adapter that adds platform knowledge without coupling the collector core to one website.

## Interface

A provider object implements:

```js
{
  id,
  name,
  matchesLocation(rawUrl),
  permissionPlan(rawUrl),
  deriveSession({ url, title }),
  scoreCandidate(candidate),
  canonicalizeResource(rawUrl),
  extractPageHint({ url, text, attributes }),
  isStrongResource(rawUrl)
}
```

## Method requirements

### `matchesLocation(rawUrl)`

Return `true` only for pages owned by the provider. Validate parsed hostnames rather than using substring checks that can match attacker-controlled suffixes.

### `permissionPlan(rawUrl)`

Return:

```js
{
  pagePatterns: ['https://slides.example.edu/*'],
  resourcePatterns: ['https://cdn.example.edu/*']
}
```

Use the narrowest practical host patterns. Every pattern must be a valid HTTP(S) Chrome match pattern and must be explicitly approved by the user.

### `deriveSession({ url, title })`

Return a stable record:

```js
{
  sessionKey: 'example:stable-id',
  providerId: 'example',
  title: 'Lecture title',
  pageUrl: url,
  origin: 'https://slides.example.edu',
  stablePath: '/course/lecture'
}
```

Do not place cookies, bearer tokens, signed query strings, student identifiers, or other secrets in `sessionKey`.

### `scoreCandidate(candidate)`

Return an additive numeric score. Recommended guide:

| Evidence | Suggested score |
|---|---:|
| Definitive slide CDN path | `+18` to `+20` |
| Strong courseware path | `+8` to `+12` |
| Neutral same-platform resource | `0` |
| Clearly unrelated platform asset | `-8` to `-15` |

The generic detector adds dimensions, ratio, URL-family, and page-hint evidence. Avoid accepting every image from the platform host.

### `canonicalizeResource(rawUrl)`

Remove volatile authorization parameters so repeated signed URLs for the same image map to one resource identity. Preserve query parameters that actually select different slide variants. Do not transform one page number into another or synthesize URLs.

### `extractPageHint(...)`

Return the best hint:

```js
{ page: 21, confidence: 95, source: 'attribute' }
```

Use `choosePageHint`, `extractPageNumberFromText`, `extractPageNumberFromUrl`, and `pageHint` from `src/core/page-number.js`. Confidence should reflect source quality:

- explicit `data-page` or platform attribute: 95–100;
- nearby visible `第 X 页` / `Slide X`: 80–95;
- filename or URL inference: 55–75.

### `isStrongResource(rawUrl)`

Return `true` only for a resource pattern whose platform meaning is unambiguous. This permits a candidate to proceed before intrinsic dimensions are available, but byte limits, image validation, hash deduplication, and permission checks still apply.

## Built-in example

A minimal provider:

```js
import { fnv1a, originPattern, safeUrl, stripVolatileQuery } from '../core/url.js';
import { extractPageNumberFromText, pageHint } from '../core/page-number.js';

export const exampleProvider = Object.freeze({
  id: 'example',
  name: 'Example Slides',

  matchesLocation(rawUrl) {
    const url = safeUrl(rawUrl);
    return url?.hostname === 'slides.example.edu';
  },

  permissionPlan(rawUrl) {
    const page = originPattern(rawUrl);
    return {
      pagePatterns: page ? [page] : [],
      resourcePatterns: [page, 'https://cdn.example.edu/*'].filter(Boolean)
    };
  },

  deriveSession({ url, title = '' }) {
    const parsed = safeUrl(url);
    const stable = `${parsed.origin}${parsed.pathname}`;
    return {
      sessionKey: `example:${fnv1a(stable)}`,
      providerId: 'example',
      title: title || 'Example slides',
      pageUrl: url,
      origin: parsed.origin,
      stablePath: parsed.pathname
    };
  },

  scoreCandidate(candidate) {
    return /\/courseware\/slides\//i.test(candidate.url) ? 20 : -6;
  },

  canonicalizeResource(rawUrl) {
    return stripVolatileQuery(rawUrl);
  },

  extractPageHint({ text = '', attributes = [] }) {
    return pageHint(
      extractPageNumberFromText(`${attributes.join(' ')} ${text}`),
      92,
      'example-text'
    );
  },

  isStrongResource(rawUrl) {
    return /\/courseware\/slides\//i.test(rawUrl);
  }
});
```

Add the provider before `genericProvider` in `src/providers/index.js`; the generic provider must remain last because it matches every HTTP(S) page.

## Local custom rules

Users can add JSON rules in the options page without rebuilding the extension. A rule supports:

```json
{
  "id": "example",
  "name": "Example Slides",
  "hostRegex": "(^|\\.)example\\.edu$",
  "slideUrlRegex": "/courseware/slides/",
  "sessionUrlRegex": "/course/([^/?#]+)",
  "pageRegex": "(?:第|slide\\s*)(\\d+)",
  "permissionOrigins": ["https://cdn.example.edu/*"],
  "stripAllQuery": false
}
```

Custom regular expressions execute locally and are user-authored. Keep them anchored, bounded, and free of nested ambiguous repetition to avoid excessive backtracking.

## Required tests

A provider contribution should cover:

1. positive and negative location matching;
2. permission patterns;
3. stable session identity;
4. strong and unrelated resource scoring;
5. signed-query canonicalization;
6. page-hint extraction;
7. false-positive fixture images such as logos and avatars;
8. a synthetic browser fixture, not private course content.

## Prohibited behavior

A provider must not:

- enumerate pages not observed in the page or browser resource timeline;
- derive neighboring URLs from a page-number sequence;
- bypass login, authorization, DRM, encryption, or paywalls;
- transmit captured content or credentials;
- include private platform keys or copied proprietary client code;
- broaden permissions merely for implementation convenience.

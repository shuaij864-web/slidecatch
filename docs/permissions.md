# Permission model

## Production manifest

```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "unlimitedStorage"
  ],
  "optional_host_permissions": [
    "http://*/*",
    "https://*/*"
  ]
}
```

The extension does not declare production `content_scripts` or mandatory `host_permissions`.

## Why each permission exists

| Permission | Purpose | Boundary |
|---|---|---|
| `activeTab` | Allows the user-invoked popup flow to interact with the currently selected tab. | Temporary authority associated with a user gesture; not persistent all-site access. |
| `scripting` | Injects `content.js` immediately after a site is enabled and registers a persistent dynamic content script for that approved site. | Registration is limited to approved page match patterns. |
| `storage` | Stores settings, enabled-site records, and transient tab/session associations. | Captured slide bytes use IndexedDB, not sync storage. |
| `unlimitedStorage` | Reduces quota/eviction risk for authorized local slide archives. | Does not grant network or website access. Per-image byte limits still apply. |
| `optional_host_permissions` | Defines the HTTP(S) origin patterns SlideCatch may ask the user to approve. | No origin is granted merely by installation; requests occur from explicit UI actions. |

## Enable-site sequence

```text
User opens popup on an HTTP(S) page
  → provider proposes page/resource host patterns
  → chrome.permissions.request() displays browser permission UI
  → only after approval: enabled-site record is stored
  → a dynamic content script is registered for pagePatterns
  → content.js is injected into the current tab
```

If the page uses a distinct CDN:

```text
Content script observes a slide URL
  → background worker detects missing resource-origin permission
  → session records the pending origin
  → popup lists the pending host
  → user clicks “Grant resource hosts”
  → browser prompts for those origins
  → approved patterns are appended to the enabled-site record
  → pending captures are rescanned
```

SlideCatch does not silently expand permissions.

## Revocation

Disabling a site:

1. sends a stop message to every currently mapped tab and removes the in-page collector immediately;
2. removes the dynamic content-script registration;
3. removes its enabled-site record and tab/session mappings;
4. removes page/resource origin permissions that are not still required by another enabled site;
5. leaves previously captured local sessions intact until the user deletes them.

The background service worker also listens for external host-permission removal. It reconciles enabled-site records and stops any active collector that no longer has the required page permission. The options page can revoke sites individually; browser extension settings can revoke or remove all permissions externally.

## Test-only manifest

`npm run build:e2e` generates `dist-e2e/manifest.json` with localhost host permission and a static fixture content script. This exists only to permit deterministic Playwright testing and is never included in the production release ZIP.

## Review checklist for permission changes

Any change that adds or broadens authority must document:

- exact API and origin patterns;
- user gesture and prompt sequence;
- data accessed;
- why a narrower mechanism is insufficient;
- revocation behavior;
- tests proving no access before approval;
- updates to `PRIVACY.md`, `SECURITY.md`, and the threat model.

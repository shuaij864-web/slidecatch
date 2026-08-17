# SlideCatch Privacy Notice

## Summary

SlideCatch is local-first. It has no application server, account system, analytics, telemetry, advertising SDK, crash-reporting endpoint, or remote code loader.

## Data processed

When enabled on a website, SlideCatch may process:

- image URLs already observed in the page;
- image bytes returned to the browser;
- image dimensions, MIME type, content hash, capture timestamp, and source type;
- nearby page labels and selected HTML attributes used to infer page numbers;
- page URL, origin, document title, provider identifier, and local session name;
- user settings and host-permission records.

## Local storage

- Slide images and capture metadata are stored in IndexedDB under the extension origin.
- Settings and enabled-site records are stored in `chrome.storage.local`.
- Current tab-to-session associations are stored in `chrome.storage.session`.
- ZIP and PDF exports are written only after a user action through normal browser download or print flows.

## Network behavior

SlideCatch may re-request an image URL already observed in the page so it can cache the image bytes. Such a request is limited by Chrome host permissions. The extension does not send captured content to a SlideCatch-operated endpoint because no such endpoint exists.

## Permissions

Website access is optional and requested from a user gesture. The extension can only run persistently on sites the user enables. Separate resource hosts, such as CDNs, require explicit permission if they are not already covered.

## Retention and deletion

Data remains in the current browser profile until the user clears a session, deletes it from the library, clears extension site data, or uninstalls the extension. Browser profile synchronization is not used by SlideCatch.

## User responsibility

Users must have authorization to access and retain the courseware or presentation content they capture. SlideCatch does not alter platform access rights or licensing terms.

## Changes

Material privacy changes should be documented in `CHANGELOG.md` and reviewed as security-relevant code changes.

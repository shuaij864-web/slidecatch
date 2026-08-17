# Changelog

All notable changes are documented here. This project follows Semantic Versioning.

## [Unreleased]

## [0.1.0] - 2026-08-17

### Added

- Generic web slide collector for images, `srcset`, CSS backgrounds, resource entries, and optional canvas snapshots.
- Rain Classroom / Yuketang provider.
- Custom provider rules.
- Explicit optional host-permission workflow and dynamic content-script registration.
- Local IndexedDB persistence of image blobs and metadata.
- URL and SHA-256 content deduplication.
- Chinese and English page-number inference, manual correction, sorting, and possible-gap detection.
- ZIP export with `slidecatch-manifest.json` and print-to-PDF workflow.
- English and Simplified Chinese extension localization.
- Zero-dependency build, package, validation, unit-test, browser-harness, and full Playwright extension-test workflows.
- GitHub Actions CI, release, and CodeQL workflows.

### Security and reliability

- Site disable and external host-permission revocation stop already-running collectors and clear tab mappings.
- Inline/data/canvas captures persist only a local content identity; transient source URLs and authorization-like query parameters are not stored.
- Resource/data URL length limits, image byte limits, conservative match-pattern validation, and ZIP path normalization are enforced.
- Release archives are deterministic and verified by file list, CRC, manifest consistency, and SHA-256.
- Broad/narrow origin-permission overlap is handled conservatively so disabling one site does not revoke permission still required by another.

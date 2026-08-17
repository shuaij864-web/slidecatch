# Security Policy

## Supported versions

| Version | Supported |
|---|---:|
| 0.1.x | Yes |
| Earlier prototypes | No |

## Reporting a vulnerability

Use the repository's **Private vulnerability reporting / Security advisory** function after the repository is published. Do not post working exploits, private course content, authentication tokens, signed URLs, or personally identifiable information in a public issue.

A useful report includes:

- affected version and browser version;
- exact permission state and provider;
- reproducible steps using non-sensitive fixtures;
- security impact and attacker prerequisites;
- whether the issue crosses website, extension, or browser-profile boundaries;
- suggested mitigation, if known.

## Security properties

The project intends to preserve these properties:

1. No mandatory website host access at installation.
2. Host access is requested from an explicit user gesture and scoped to platform/resource patterns.
3. No remote executable code, `eval`, or `new Function`.
4. No captured-content upload or telemetry endpoint.
5. No login, DRM, paywall, or access-control bypass.
6. No undisplayed-page enumeration or signed-URL guessing.
7. Captured image size is bounded and image content is treated as untrusted input.
8. Exports use safe relative ZIP paths and do not include authentication headers or raw cookies.

See [docs/threat-model.md](docs/threat-model.md).

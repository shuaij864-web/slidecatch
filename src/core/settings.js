export const DEFAULT_SETTINGS = Object.freeze({
  detectionMode: 'balanced',
  minWidth: 640,
  minHeight: 320,
  minArea: 260000,
  minAspectRatio: 1.05,
  maxAspectRatio: 2.4,
  scanBackgroundImages: true,
  captureCanvas: false,
  visibleOnly: false,
  showOverlay: true,
  pollIntervalMs: 2500,
  maxImageBytes: 30 * 1024 * 1024,
  customProviders: []
});

const MODES = new Set(['strict', 'balanced', 'permissive']);

function boundedString(value, maxLength) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

export function sanitizeCustomProviderRule(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const rule = {
    id: boundedString(input.id, 60),
    name: boundedString(input.name, 100),
    hostRegex: boundedString(input.hostRegex, 500),
    slideUrlRegex: boundedString(input.slideUrlRegex, 500),
    sessionUrlRegex: boundedString(input.sessionUrlRegex, 500),
    pageRegex: boundedString(input.pageRegex, 500),
    permissionOrigins: Array.isArray(input.permissionOrigins)
      ? input.permissionOrigins.filter((value) => typeof value === 'string').map((value) => value.slice(0, 300)).slice(0, 20)
      : [],
    stripAllQuery: input.stripAllQuery === true
  };
  return rule.id && rule.hostRegex && rule.slideUrlRegex ? rule : null;
}

function numberInRange(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export function sanitizeSettings(input = {}) {
  const customProviders = Array.isArray(input.customProviders) ? input.customProviders.map(sanitizeCustomProviderRule).filter(Boolean).slice(0, 50) : [];
  const minAspectRatio = numberInRange(input.minAspectRatio, DEFAULT_SETTINGS.minAspectRatio, 0.4, 4);
  const maxAspectRatio = Math.max(minAspectRatio + 0.05, numberInRange(input.maxAspectRatio, DEFAULT_SETTINGS.maxAspectRatio, 0.5, 6));
  return {
    detectionMode: MODES.has(input.detectionMode) ? input.detectionMode : DEFAULT_SETTINGS.detectionMode,
    minWidth: Math.round(numberInRange(input.minWidth, DEFAULT_SETTINGS.minWidth, 200, 7680)),
    minHeight: Math.round(numberInRange(input.minHeight, DEFAULT_SETTINGS.minHeight, 120, 4320)),
    minArea: Math.round(numberInRange(input.minArea, DEFAULT_SETTINGS.minArea, 50000, 30000000)),
    minAspectRatio,
    maxAspectRatio,
    scanBackgroundImages: input.scanBackgroundImages !== false,
    captureCanvas: Boolean(input.captureCanvas),
    visibleOnly: Boolean(input.visibleOnly),
    showOverlay: input.showOverlay !== false,
    pollIntervalMs: Math.round(numberInRange(input.pollIntervalMs, DEFAULT_SETTINGS.pollIntervalMs, 800, 30000)),
    maxImageBytes: Math.round(numberInRange(input.maxImageBytes, DEFAULT_SETTINGS.maxImageBytes, 1024 * 1024, 100 * 1024 * 1024)),
    customProviders
  };
}

export function detectionThreshold(mode) {
  if (mode === 'strict') return 9;
  if (mode === 'permissive') return 5;
  return 7;
}

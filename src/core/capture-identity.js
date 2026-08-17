import { SOURCE } from './constants.js';
import { safeUrl } from './url.js';

export function isLocalDataCapture(candidate = {}) {
  if (candidate.source === SOURCE.CANVAS) return true;
  const protocol = safeUrl(candidate.url)?.protocol || '';
  return protocol === 'data:' || protocol === 'blob:' || !['http:', 'https:'].includes(protocol);
}

export function dataCaptureIdentity(candidate, provider, contentHash) {
  const hash = String(contentHash || '');
  if (!hash) throw new Error('Content hash is required');
  if (isLocalDataCapture(candidate)) {
    return {
      local: true,
      resourceKey: `inline:${hash}`,
      sourceUrl: ''
    };
  }

  const resourceKey = provider?.canonicalizeResource?.(candidate?.url) || `data:${hash}`;
  return {
    local: false,
    resourceKey,
    sourceUrl: resourceKey
  };
}

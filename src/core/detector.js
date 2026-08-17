import { detectionThreshold } from './settings.js';
import { urlTokenScore } from './url.js';

export function aspectRatio(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  return w > 0 && h > 0 ? w / h : 0;
}

export function dimensionsPlausible(candidate, settings) {
  const width = Math.max(Number(candidate.width) || 0, Number(candidate.renderedWidth) || 0);
  const height = Math.max(Number(candidate.height) || 0, Number(candidate.renderedHeight) || 0);
  if (!width || !height) return false;
  const ratio = aspectRatio(width, height);
  return width >= settings.minWidth && height >= settings.minHeight && width * height >= settings.minArea && ratio >= settings.minAspectRatio && ratio <= settings.maxAspectRatio;
}

export function scoreCandidate(candidate, settings, providerScore = 0) {
  let score = Number(providerScore) || 0;
  const reasons = providerScore ? [`provider:${providerScore >= 0 ? '+' : ''}${providerScore}`] : [];
  const width = Math.max(Number(candidate.width) || 0, Number(candidate.renderedWidth) || 0);
  const height = Math.max(Number(candidate.height) || 0, Number(candidate.renderedHeight) || 0);
  const area = width * height;
  const ratio = aspectRatio(width, height);
  if (width && height) {
    if (width >= 1280 && height >= 640) { score += 4; reasons.push('dimensions:large+4'); }
    else if (width >= settings.minWidth && height >= settings.minHeight) { score += 3; reasons.push('dimensions:min+3'); }
    else if (width >= 400 && height >= 240) { score += 1; reasons.push('dimensions:medium+1'); }
    else { score -= 5; reasons.push('dimensions:small-5'); }
    if (area >= 900000) { score += 2; reasons.push('area:large+2'); }
    else if (area >= settings.minArea) { score += 1; reasons.push('area:min+1'); }
    if (ratio >= settings.minAspectRatio && ratio <= settings.maxAspectRatio) {
      score += 2; reasons.push('ratio:plausible+2');
      if (Math.abs(ratio - 16 / 9) < 0.12) { score += 2; reasons.push('ratio:16x9+2'); }
      else if (Math.abs(ratio - 4 / 3) < 0.1) { score += 1; reasons.push('ratio:4x3+1'); }
    } else { score -= 4; reasons.push('ratio:unlikely-4'); }
  } else reasons.push('dimensions:unknown');
  const urlScore = urlTokenScore(candidate.url); score += urlScore.score; reasons.push(...urlScore.reasons);
  if ((candidate.familyCount || 0) >= 2) { score += 2; reasons.push('family:repeat+2'); }
  if ((candidate.familyCount || 0) >= 5) { score += 1; reasons.push('family:series+1'); }
  if (candidate.pageHint?.page) { score += 2; reasons.push('page-hint+2'); }
  if (candidate.visible === false && settings.visibleOnly) { score -= 20; reasons.push('not-visible-20'); }
  if (candidate.source === 'canvas') { score += 2; reasons.push('canvas+2'); }
  const threshold = detectionThreshold(settings.detectionMode);
  const hasDimensions = Boolean(width && height);
  const strongProvider = providerScore >= 10;
  const accepted = score >= threshold && (hasDimensions || strongProvider || score >= threshold + 4);
  return { score, threshold, accepted, reasons, width, height, ratio, area };
}

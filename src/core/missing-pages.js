import { normalizePageNumber } from './page-number.js';
export function recognizedPages(slides) { return [...new Set((slides || []).map((slide) => normalizePageNumber(slide.pageHint)).filter(Boolean))].sort((a, b) => a - b); }
export function findMissingPages(slides, { maxSpan = 2000 } = {}) {
  const pages = recognizedPages(slides); if (pages.length < 2) return [];
  const min = pages[0], max = pages[pages.length - 1]; if (max - min > maxSpan) return [];
  const set = new Set(pages), missing = []; for (let page = min; page <= max; page += 1) if (!set.has(page)) missing.push(page); return missing;
}

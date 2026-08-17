export function t(key, substitutions, fallback = '') {
  try { const value = chrome.i18n.getMessage(key, substitutions); return value || fallback || key; } catch { return fallback || key; }
}
export function localizeDocument(root = document) {
  for (const element of root.querySelectorAll('[data-i18n]')) { const key = element.getAttribute('data-i18n'); element.textContent = t(key, undefined, element.textContent); }
  for (const element of root.querySelectorAll('[data-i18n-title]')) { const key = element.getAttribute('data-i18n-title'); element.title = t(key, undefined, element.title); }
  for (const element of root.querySelectorAll('[data-i18n-placeholder]')) { const key = element.getAttribute('data-i18n-placeholder'); element.placeholder = t(key, undefined, element.placeholder); }
}

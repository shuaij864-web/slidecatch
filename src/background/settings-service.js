import { DEFAULT_SETTINGS,sanitizeSettings } from '../core/settings.js';
const SETTINGS_KEY='settings';
export async function getSettings(){const result=await chrome.storage.local.get(SETTINGS_KEY);return sanitizeSettings({...DEFAULT_SETTINGS,...(result[SETTINGS_KEY]||{})});}
export async function updateSettings(patch={}){const current=await getSettings(),next=sanitizeSettings({...current,...patch});await chrome.storage.local.set({[SETTINGS_KEY]:next});return next;}
export async function resetSettings(){const next=sanitizeSettings(DEFAULT_SETTINGS);await chrome.storage.local.set({[SETTINGS_KEY]:next});return next;}

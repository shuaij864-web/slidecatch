import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const errors = [];
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'));

function fail(message) {
  errors.push(message);
}

function has(value, expected) {
  return Array.isArray(value) && value.includes(expected);
}

function sameSet(actual = [], expected = []) {
  return actual.length === expected.length &&
    expected.every((value) => actual.includes(value));
}

if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
if (manifest.version !== packageJson.version) fail('manifest version must match package.json');
if (manifest.default_locale !== 'en') fail('default_locale must be en');
if (!manifest.background?.service_worker) fail('background service worker missing');
if (manifest.background?.type !== 'module') fail('background service worker must be an ES module');
if (!manifest.action?.default_popup) fail('action popup missing');
if (!manifest.options_page) fail('options page missing');
if (!sameSet(manifest.permissions || [], ['activeTab', 'scripting', 'storage', 'unlimitedStorage'])) {
  fail('production permissions differ from the reviewed allowlist');
}
if (!sameSet(manifest.optional_host_permissions || [], ['http://*/*', 'https://*/*'])) {
  fail('optional host permissions differ from the reviewed HTTP(S) allowlist');
}
if (manifest.host_permissions?.length) fail('production manifest must not have mandatory host permissions');
if (manifest.content_scripts?.length) fail('production manifest must not have static content scripts');
if (manifest.externally_connectable) fail('externally_connectable is not permitted');
if (manifest.web_accessible_resources?.length) fail('web-accessible resources are not required');
if (manifest.content_security_policy?.extension_pages !== "script-src 'self'; object-src 'self'") {
  fail('extension Content Security Policy is missing or broader than reviewed');
}

const referenced = [
  manifest.background.service_worker,
  manifest.action?.default_popup,
  manifest.options_page,
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {})
].filter(Boolean);
for (const file of new Set(referenced)) {
  try {
    await access(path.join(dist, file));
  } catch {
    fail(`missing referenced file: ${file}`);
  }
}

for (const locale of ['en', 'zh_CN']) {
  try {
    const messages = JSON.parse(
      await readFile(path.join(dist, '_locales', locale, 'messages.json'), 'utf8')
    );
    for (const key of ['extensionName', 'extensionDescription', 'enableSite', 'openLibrary']) {
      if (!messages[key]?.message) fail(`locale ${locale} missing message: ${key}`);
    }
  } catch (error) {
    fail(`invalid or missing locale ${locale}: ${error.message}`);
  }
}

async function walk(dir) {
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else output.push(full);
  }
  return output;
}

for (const file of await walk(dist)) {
  const relative = path.relative(dist, file);
  if (file.endsWith('.js')) {
    const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (checked.status !== 0) fail(`invalid built JavaScript ${relative}: ${checked.stderr.trim()}`);
  }
  if (!/\.(?:js|html|json|css)$/i.test(file)) continue;
  const text = await readFile(file, 'utf8');
  if (/\beval\s*\(|new\s+Function\s*\(/.test(text)) {
    fail(`dynamic code execution found: ${relative}`);
  }
  if (/\bWebAssembly\.(?:compile|instantiate)\s*\(/.test(text)) {
    fail(`runtime WebAssembly execution found: ${relative}`);
  }
  if (/https?:\/\/(?!127\.0\.0\.1|localhost)/i.test(text) && file.endsWith('.js')) {
    fail(`hard-coded remote URL in executable code: ${relative}`);
  }
  if (file.endsWith('.html')) {
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(text)) fail(`inline script found: ${relative}`);
    if (/\son[a-z]+\s*=/i.test(text)) fail(`inline event handler found: ${relative}`);
    if (/<iframe\b/i.test(text)) fail(`iframe found in extension page: ${relative}`);
  }
}

if (errors.length) {
  console.error(errors.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log('Manifest, built syntax, files, permissions, CSP, locales, and remote-code policy validated.');

import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const files = (await walk(root)).filter((file) =>
  !file.includes(`${path.sep}dist${path.sep}`) &&
  !file.includes(`${path.sep}dist-e2e${path.sep}`) &&
  !file.includes(`${path.sep}release${path.sep}`) &&
  !file.includes(`${path.sep}.git${path.sep}`)
);

for (const file of files.filter((item) => /\.(?:js|mjs)$/.test(item))) {
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (checked.status !== 0) errors.push(`${path.relative(root, file)}: ${checked.stderr.trim()}`);
  const source = await readFile(file, 'utf8');
  if (/\beval\s*\(|new\s+Function\s*\(/.test(source)) errors.push(`${path.relative(root, file)}: dynamic code execution is forbidden`);
  const importRegex = /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importRegex)) {
    if (!match[1].startsWith('.')) continue;
    const target = path.resolve(path.dirname(file), match[1]);
    try { await readFile(path.extname(target) ? target : `${target}.js`); }
    catch { errors.push(`${path.relative(root, file)}: unresolved import ${match[1]}`); }
  }
}

for (const file of files.filter((item) => item.endsWith('.json'))) {
  try { JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { errors.push(`${path.relative(root, file)}: invalid JSON (${error.message})`); }
}

if (errors.length) {
  console.error(errors.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log(`Static checks passed for ${files.length} source and configuration files.`);

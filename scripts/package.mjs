import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildZip } from '../src/export/zip.js';

const root = process.cwd();
const dist = path.join(root, 'dist');
const release = path.join(root, 'release');
const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'));
const sourceDateEpoch = Number(process.env.SOURCE_DATE_EPOCH || 946684800);
const archiveDate = new Date(sourceDateEpoch * 1000);

async function collect(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    const name = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await collect(full, name));
    else if (entry.isFile()) {
      files.push({ name, data: await readFile(full), date: archiveDate });
    }
  }
  return files;
}

await mkdir(release, { recursive: true });
const files = await collect(dist);
const blob = await buildZip(files);
const output = path.join(release, `slidecatch-v${manifest.version}.zip`);
await writeFile(output, Buffer.from(await blob.arrayBuffer()));
console.log(output);

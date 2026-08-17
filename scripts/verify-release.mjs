import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'));
const archivePath = path.join(root, 'release', `slidecatch-v${manifest.version}.zip`);
const archive = await readFile(archivePath);

function u16(offset) {
  return archive.readUInt16LE(offset);
}

function u32(offset) {
  return archive.readUInt32LE(offset);
}

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function findEocd() {
  const signature = 0x06054B50;
  const minimum = Math.max(0, archive.length - 0xFFFF - 22);
  for (let offset = archive.length - 22; offset >= minimum; offset -= 1) {
    if (u32(offset) === signature) return offset;
  }
  throw new Error('ZIP end-of-central-directory record not found');
}

async function collectDist(dir, prefix = '') {
  const output = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    const name = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) output.push(...await collectDist(full, name));
    else if (entry.isFile()) output.push(name);
  }
  return output;
}

const eocd = findEocd();
const entryCount = u16(eocd + 10);
const centralSize = u32(eocd + 12);
const centralOffset = u32(eocd + 16);
if (centralOffset + centralSize > archive.length) throw new Error('Central directory exceeds archive size');

const decoder = new TextDecoder('utf-8', { fatal: true });
const entries = [];
let cursor = centralOffset;
for (let index = 0; index < entryCount; index += 1) {
  if (u32(cursor) !== 0x02014B50) throw new Error(`Invalid central directory signature at ${cursor}`);
  const flags = u16(cursor + 8);
  const method = u16(cursor + 10);
  const expectedCrc = u32(cursor + 16);
  const compressedSize = u32(cursor + 20);
  const uncompressedSize = u32(cursor + 24);
  const nameLength = u16(cursor + 28);
  const extraLength = u16(cursor + 30);
  const commentLength = u16(cursor + 32);
  const localOffset = u32(cursor + 42);
  const name = decoder.decode(archive.subarray(cursor + 46, cursor + 46 + nameLength));
  if (!(flags & 0x0800)) throw new Error(`Entry is not marked UTF-8: ${name}`);
  if (method !== 0) throw new Error(`Unexpected compression method for ${name}: ${method}`);
  if (!name || name.startsWith('/') || name.split('/').includes('..') || /^[A-Za-z]:/.test(name)) {
    throw new Error(`Unsafe archive path: ${name}`);
  }
  if (u32(localOffset) !== 0x04034B50) throw new Error(`Invalid local header for ${name}`);
  const localNameLength = u16(localOffset + 26);
  const localExtraLength = u16(localOffset + 28);
  const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
  const data = archive.subarray(dataOffset, dataOffset + compressedSize);
  if (data.length !== compressedSize || compressedSize !== uncompressedSize) {
    throw new Error(`Invalid stored size for ${name}`);
  }
  if (crc32(data) !== expectedCrc) throw new Error(`CRC mismatch for ${name}`);
  entries.push({ name, data });
  cursor += 46 + nameLength + extraLength + commentLength;
}
if (cursor !== centralOffset + centralSize) throw new Error('Central directory size mismatch');

const expected = await collectDist(dist);
const actualNames = entries.map((entry) => entry.name).sort();
const expectedNames = [...expected].sort();
if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
  throw new Error(`Archive file set differs from dist\nExpected: ${expectedNames.join(', ')}\nActual: ${actualNames.join(', ')}`);
}

const archivedManifest = entries.find((entry) => entry.name === 'manifest.json');
if (!archivedManifest) throw new Error('manifest.json missing from archive root');
if (archivedManifest.data.toString('utf8') !== await readFile(path.join(dist, 'manifest.json'), 'utf8')) {
  throw new Error('Archived manifest differs from dist/manifest.json');
}

const sha256 = createHash('sha256').update(archive).digest('hex');
console.log(JSON.stringify({
  archive: path.relative(root, archivePath),
  bytes: archive.length,
  entries: entries.length,
  version: manifest.version,
  sha256
}, null, 2));

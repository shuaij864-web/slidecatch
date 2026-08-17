import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { bundleEntry } from './bundle.mjs';

const e2e = process.argv.includes('--e2e');
const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const outdir = path.join(root, e2e ? 'dist-e2e' : 'dist');
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

for (const [entry, output] of [
  ['background/index.js', 'background.js'],
  ['content/index.js', 'content.js'],
  ['ui/popup.js', 'popup.js'],
  ['ui/library.js', 'library.js'],
  ['ui/options.js', 'options.js']
]) {
  await bundleEntry({
    entry: path.join(sourceRoot, entry),
    outfile: path.join(outdir, output),
    sourceRoot
  });
}

for (const page of ['popup', 'library', 'options']) {
  await cp(path.join(sourceRoot, `ui/${page}.html`), path.join(outdir, `${page}.html`));
  await cp(path.join(sourceRoot, `ui/${page}.css`), path.join(outdir, `${page}.css`));
}
await cp(path.join(sourceRoot, 'assets/icons'), path.join(outdir, 'icons'), { recursive: true });
await cp(path.join(sourceRoot, '_locales'), path.join(outdir, '_locales'), { recursive: true });

const manifest = JSON.parse(await readFile(path.join(sourceRoot, 'manifest.json'), 'utf8'));
if (e2e) {
  manifest.name = 'SlideCatch E2E';
  // Test-only public key gives the unpacked extension a stable ID so the harness can
  // seed explicit site authorization before the localhost fixture starts loading.
  manifest.key = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt/06NmybjTuSaGUySggOZV82anghzDfkGBqt2sLj0fETCS7oTiF649k20XhLOJpQkGT10IZNjU8E7lbPjbZSVt6dmF7J3wxnmFwbmUhoUf+U7DVBI1Pm2tWNlYyOA/UbMqsYqhsTlYzpXIuhRrOAPgnKxvXwgUiRF3pCn5iJTW//Q8W7FfqIwqschLYx/lCPdiyScHF6nkFGCG3BR8wHh9wJpVjXdGx4Y+irfnmdQrBHd9zLqFHI5W67f+OHNFWOzK5TxBdRNxEzkw6ybS2+kyuOWDxMAQRqJt/0/6XCRkogv+HozJ3KN/99AdAuv0GeIU1VKB8gzf4waIYmiIMs9QIDAQAB';
  manifest.host_permissions = ['http://127.0.0.1/*', 'http://localhost/*'];
  manifest.content_scripts = [{
    matches: ['http://127.0.0.1/*', 'http://localhost/*'],
    js: ['content.js'],
    run_at: 'document_start',
    all_frames: false
  }];
}
await writeFile(path.join(outdir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built ${e2e ? 'E2E' : 'production'} extension at ${path.relative(root, outdir)}`);

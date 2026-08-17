import { rm } from 'node:fs/promises';

for (const target of ['dist', 'dist-e2e']) {
  await rm(target, { recursive: true, force: true });
}

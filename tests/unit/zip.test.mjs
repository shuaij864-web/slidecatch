import test from 'node:test';
import assert from 'node:assert/strict';
import { buildZip } from '../../src/export/zip.js';

test('ZIP writer produces a PK archive',async()=>{const blob=await buildZip([{name:'slides/001.txt',data:'hello',date:new Date('2000-01-01T00:00:00Z')}]);const bytes=new Uint8Array(await blob.arrayBuffer());assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4b);});
test('ZIP writer rejects traversal paths',async()=>{await assert.rejects(()=>buildZip([{name:'../bad.txt',data:'x'}]),/Unsafe ZIP path/);});

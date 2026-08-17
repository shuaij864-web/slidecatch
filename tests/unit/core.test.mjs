import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPageNumberFromText,extractPageNumberFromUrl } from '../../src/core/page-number.js';
import { findMissingPages } from '../../src/core/missing-pages.js';
import { sortSlides } from '../../src/core/sort.js';
import { sanitizeSettings } from '../../src/core/settings.js';

test('page numbers are inferred from Chinese and English labels',()=>{assert.equal(extractPageNumberFromText('第 21 页'),21);assert.equal(extractPageNumberFromText('Slide 9 of 40'),9);assert.equal(extractPageNumberFromUrl('https://x.test/slide-14.jpg'),14);});
test('missing page detector does not invent endpoints',()=>{assert.deepEqual(findMissingPages([{pageHint:1},{pageHint:2},{pageHint:4}]),[3]);});
test('page sort uses page numbers when coverage is high',()=>{const items=sortSlides([{id:'b',pageHint:2,sequence:1},{id:'a',pageHint:1,sequence:2}]);assert.deepEqual(items.map(x=>x.pageHint),[1,2]);});
test('settings stay bounded',()=>{const s=sanitizeSettings({minWidth:-1,maxImageBytes:1});assert.ok(s.minWidth>=200);assert.ok(s.maxImageBytes>=1024*1024);});

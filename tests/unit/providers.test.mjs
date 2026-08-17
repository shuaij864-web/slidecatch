import test from 'node:test';
import assert from 'node:assert/strict';
import { yuketangProvider } from '../../src/providers/yuketang.js';
import { genericProvider } from '../../src/providers/generic.js';

test('Yuketang provider recognizes lesson pages and slide CDN resources',()=>{
  assert.equal(yuketangProvider.matchesLocation('https://www.yuketang.cn/lesson/fullscreen/v3/123/ppt/1'),true);
  assert.equal(yuketangProvider.isStrongResource('https://rain-private-qn.yuketang.cn/slide/123/cover001.jpg?token=x'),true);
  assert.equal(yuketangProvider.scoreCandidate({url:'https://rain-private-qn.yuketang.cn/slide/123/cover001.jpg'}),20);
  assert.equal(yuketangProvider.canonicalizeResource('https://rain-private-qn.yuketang.cn/slide/123/a.jpg?token=x&ts=1'),'https://rain-private-qn.yuketang.cn/slide/123/a.jpg');
});

test('generic provider only proposes the current origin',()=>{
  const plan=genericProvider.permissionPlan('https://example.com/course/1');
  assert.deepEqual(plan.pagePatterns,['https://example.com/*']);
});

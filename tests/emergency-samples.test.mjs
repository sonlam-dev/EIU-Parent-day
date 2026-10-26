import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampleWishes} from '../src/sampleWishes.ts';

test('All 120 emergency messages are unique, short wishes from parents to children',()=>{
  const samples=JSON.parse(readFileSync(new URL('../supabase/emergency-messages.json',import.meta.url),'utf8'));
  assert.equal(samples.length,120);
  assert.equal(new Set(samples.map(([,message])=>message)).size,120);
  for(const [recipient,message] of samples) {
    assert.equal(recipient,'Con yêu');
    assert.match(message,/ba mẹ/i);
    assert.ok(message.length>=10 && message.length<=90);
  }
});

test('Demo wishes use the same parent-to-child voice and all four colors',()=>{
  assert.equal(new Set(sampleWishes.map(w=>w.color)).size,4);
  assert.ok(sampleWishes.every(w=>w.recipient==='Con yêu' && /ba mẹ/i.test(w.message)));
});

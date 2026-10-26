import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RenderQuality,renderPixelRatio} from '../src/RenderQuality.ts';

test('Resolution remains bounded on high-DPI phones and projectors',()=>{
  for(const [width,height,dpr] of [[390,844,3],[1920,1080,2],[3840,2160,2]]) {
    const ratio=renderPixelRatio(width,height,dpr);
    assert.ok(ratio>=.6 && ratio<=1.25 && ratio<=dpr);
  }
});

test('Alternating slow and fast samples cannot cause resolution oscillation',()=>{
  const quality=new RenderQuality();let ratio=1.2;
  ratio=quality.sample(ratio,1.2,35,2);
  assert.ok(ratio<1.2);
  const lowered=ratio;
  for(let i=0;i<20;i++) {
    ratio=quality.sample(ratio,1.2,i%2 ? 55 : 60,2);
    assert.equal(ratio,lowered);
  }
});

test('Sustained headroom recovers quality, with cooldown and a fixed ceiling',()=>{
  const quality=new RenderQuality();let ratio=.8;
  for(let i=0;i<5;i++) assert.equal(quality.sample(ratio,1,60,2),ratio);
  ratio=quality.sample(ratio,1,60,2);assert.ok(ratio>.8);
  assert.equal(quality.sample(ratio,1,30,2),ratio);
  for(let i=0;i<60;i++) ratio=quality.sample(ratio,1,60,2);
  assert.equal(ratio,1);
});

test('Resize resets old performance samples before evaluating a new viewport',()=>{
  const quality=new RenderQuality();
  for(let i=0;i<5;i++) quality.sample(.8,1,60,2);
  quality.reset();
  assert.equal(quality.sample(.8,1,60,2),.8);
});

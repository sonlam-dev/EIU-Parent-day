import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEnvelopeContacts } from '../src/EnvelopePhysics.ts';

const body=(x,vx=0) => ({x,y:0,z:0,vx,vy:0,vz:0,roll:0,spin:0});

test('Touching letters separate and transfer momentum into bounce and rotation',() => {
  const a=body(0,1),b=body(.3,-1);
  assert.equal(resolveEnvelopeContacts([a,b],.55),1);
  assert.ok(Math.abs(b.x-a.x-.55)<1e-8);
  assert.ok(a.vx<0 && b.vx>0);
  assert.ok(a.spin*b.spin<0);
  assert.ok(Math.abs(a.vx+b.vx)<1e-8);
});

test('Distant letters do not collide; coincident letters stay finite',() => {
  const a=body(0),b=body(2);
  assert.equal(resolveEnvelopeContacts([a,b],.55),0);
  const c=body(0);
  assert.equal(resolveEnvelopeContacts([a,c],.55),1);
  assert.ok(Object.values(a).every(Number.isFinite));
  assert.ok(Object.values(c).every(Number.isFinite));
  assert.ok(Math.abs(a.x-c.x)>=.55);
});

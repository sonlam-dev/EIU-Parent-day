import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {daylightBalance} from '../src/Daylight.ts';

test('Orbit compensation stays bounded, continuous, and independent of zoom distance',()=>{
  const sun=new THREE.Vector3(-.95,.28,-1).normalize();
  let previous;
  for(let i=0;i<=720;i++) {
    const angle=i*Math.PI/360,view=new THREE.Vector3(Math.sin(angle),.1,Math.cos(angle));
    const balance=daylightBalance(view,sun),distant=daylightBalance(view.clone().multiplyScalar(50),sun);
    assert.ok(balance.fill>=.38 && balance.fill<=.72);
    assert.ok(balance.exposure>=.94 && balance.exposure<=.985);
    assert.ok(Math.abs(balance.fill-distant.fill)<1e-12);
    if(previous) assert.ok(Math.abs(balance.fill-previous.fill)<.004);
    previous=balance;
  }
  assert.ok(daylightBalance(sun.clone().negate(),sun).fill>daylightBalance(sun,sun).fill);
});

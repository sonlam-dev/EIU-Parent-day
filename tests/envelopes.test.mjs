import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { envelopeSlot,dropStart } from '../src/EnvelopeLayout.ts';
import { createParentDayDecor } from '../src/ParentDayDecor.ts';
import {colors} from '../src/types.ts';

// Canvas drawing is browser-owned; these tests inspect real Three.js instance buffers.
globalThis.document={createElement:() => ({width:512,height:352,getContext:() => new Proxy({createLinearGradient:() => ({addColorStop(){}}),createRadialGradient:() => ({addColorStop(){}})},{get:(target,key) => target[key] || (() => {}),set:(target,key,value) => {target[key]=value;return true;}})})};
const wish = (i,status='approved') => ({id:`wish-${i}`,name:'Test',recipient:'Family',message:'A warm wish for the family',color:'green',status,created_at:new Date(1700000000000+i).toISOString()});
const anchors=Array.from({length:128},(_,i) => new THREE.Vector3(Math.sin(i * Math.PI / 64) * 6,6.8 + (i % 3) * .2,Math.cos(i * Math.PI / 64) * 6));
function setup(reduced=false) {
  const scene=new THREE.Scene(),decor=createParentDayDecor(scene,anchors,reduced);
  return {decor,meshes:() => scene.children[0].children};
}
test('Exactly one envelope per approved wish; history is not replayed',() => {
  const {decor,meshes}=setup(); assert.equal(decor.count,0); decor.sync([wish(1)],0); decor.update(0);
  assert.equal(decor.count,1); assert.equal(decor.activeDrops,0);
  assert.deepEqual(meshes().map(m => m.count),[1,1,1]);
  decor.dispose();
});
test('10,000 simultaneous arrivals each get an envelope and finish dropping in 3.4 seconds',() => {
  const {decor,meshes}=setup(); decor.sync([],0); decor.update(0);
  const batch=Array.from({length:10000},(_,i) => wish(i));
  decor.sync(batch,10); assert.equal(decor.count,10000);
  decor.update(10); assert.equal(decor.activeDrops,10000);
  decor.sync([...batch],10.1); // A repeated poll must not restart the drop.
  decor.highlight('wish-9999'); decor.update(13.41);
  assert.equal(decor.activeDrops,0); assert.equal(decor.count,10000);
  assert.equal(meshes().length,3); // Constant draw calls as the event grows.
  for (const mesh of meshes()) {
    assert.equal(mesh.count,10000);
    assert.ok(mesh.instanceMatrix.array.every(Number.isFinite));
  }
  decor.sync([batch[0],batch[0],wish(10001,'pending')],15); decor.update(15);
  assert.equal(decor.count,1); // Deletions/moderation remove the matching physical envelopes.
  decor.dispose();
});
test('Overlapping bursts do not cancel older drops and reduced motion settles immediately',() => {
  const {decor}=setup(); decor.sync([],0); decor.update(0);
  decor.sync([wish(1)],10); decor.update(10);
  decor.sync([wish(2),wish(1)],11); decor.update(11);
  assert.equal(decor.count,2); assert.equal(decor.activeDrops,2);
  decor.update(12.3); assert.equal(decor.activeDrops,1);
  decor.update(13.3); assert.equal(decor.activeDrops,0);
  const reduced=setup(true).decor; reduced.sync([],0); reduced.sync([wish(1)],10); reduced.update(10);
  assert.equal(reduced.activeDrops,0); decor.dispose(); reduced.dispose();
});
test('Natural slots keep varied branch lengths and stable positions',() => {
  const slots=Array.from({length:100},(_,i) => envelopeSlot(i,anchors));
  assert.ok(new Set(slots.map(s => s.drop.toFixed(2))).size>50);
  assert.ok(Math.min(...slots.map(s => s.x)) < -5);
  assert.ok(Math.max(...slots.map(s => s.x)) > 5);
  assert.deepEqual(envelopeSlot(4,anchors),slots[4]);
  assert.equal(dropStart(10,9999,10000,false),11.2);
});

test('Picking a visible envelope returns its wish ID after capacity growth and moderation',() => {
  const {decor,meshes}=setup();
  decor.sync(Array.from({length:50},(_,i) => wish(i)),0); decor.update(0);
  function pickInstance(index) {
    const cards=meshes()[0],matrix=new THREE.Matrix4(); cards.updateMatrixWorld(true); cards.getMatrixAt(index,matrix);
    const point=new THREE.Vector3().setFromMatrixPosition(matrix);
    const normal=new THREE.Vector3(0,0,1).transformDirection(matrix);
    const raycaster=new THREE.Raycaster(point.clone().addScaledVector(normal,.02),normal.clone().negate(),0,.04);
    return decor.pick(raycaster);
  }
  assert.equal(pickInstance(0),'wish-0');
  assert.equal(pickInstance(49),'wish-49');
  decor.sync([wish(49)],1); decor.update(1);
  assert.equal(pickInstance(0),'wish-49');
  decor.dispose();
});

test('Curved cords have subdivisions and extra slack during a drop',() => {
  const {decor,meshes}=setup(); decor.sync([],0); decor.update(0);
  decor.sync([wish(1)],1); decor.update(1.1);
  const cords=meshes()[1].geometry;
  assert.equal(cords.parameters.heightSegments,12);
  const dropping=cords.getAttribute('aCordSlack').getX(0);
  for(let time=1.12;time<5;time+=.02) decor.update(time);
  assert.ok(dropping>cords.getAttribute('aCordSlack').getX(0));
  assert.ok(meshes()[0].instanceMatrix.array.every(Number.isFinite));
  decor.dispose();
});

test('Wind updates transforms without uploading unchanged envelope colors',()=>{
  const {decor,meshes}=setup();decor.sync([wish(1),wish(2)],0);decor.update(0);
  const cards=meshes()[0],version=cards.instanceColor.version;
  const colors=Array.from(cards.instanceColor.array);
  decor.update(1/60);decor.update(2/60);
  assert.equal(cards.instanceColor.version,version);
  assert.deepEqual(Array.from(cards.instanceColor.array),colors);
  decor.highlight('wish-1');decor.update(3/60);
  assert.equal(cards.instanceColor.version,version+1);
  assert.notDeepEqual(Array.from(cards.instanceColor.array),colors);
  decor.highlight('wish-2');decor.update(4/60);
  assert.deepEqual(Array.from(cards.instanceColor.array).slice(0,3),colors.slice(0,3));
  decor.dispose();
});

test('Envelope instance colors match form selections and follow color edits',()=>{
  const {decor,meshes}=setup();
  const wishes=colors.map((color,i)=>({...wish(i),color:color.id}));
  decor.sync(wishes,0);decor.update(0);
  const actual=new THREE.Color();
  colors.forEach((color,i)=>{
    meshes()[0].getColorAt(i,actual);
    assert.equal(actual.getHexString(),new THREE.Color(color.hex).getHexString());
  });
  decor.sync(wishes.map(w=>({...w,color:'pink'})),1);decor.update(1);
  colors.forEach((_,i)=>{
    meshes()[0].getColorAt(i,actual);
    assert.equal(actual.getHexString(),new THREE.Color(colors.find(c=>c.id==='pink').hex).getHexString());
  });
  decor.dispose();
});

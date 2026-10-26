import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFlowerLayout } from '../src/FlowerLayout.ts';
import { createMorningSky } from '../src/MorningSky.ts';
import { createYellowFlowers } from '../src/Flowers.ts';

globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>new Proxy({
  createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),
},{get:(target,key)=>target[key]||(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}})})};

test('New flowers fill local gaps and leave occupied flower positions intact',()=>{
  const {positions,patches}=createFlowerLayout(),original=positions.slice(0,1800);
  assert.equal(positions.length,2520); assert.equal(patches.length,12);
  for(const point of positions.slice(1800)) {
    assert.ok(Math.hypot(point.x,point.z)<17);
    assert.ok(patches.some(p=>Math.hypot(p.x-point.x,p.z-point.z)<=1.251));
    assert.ok(original.every(p=>Math.hypot(p.x-point.x,p.z-point.z)>=.449));
  }
});

test('Sun stays fixed as the camera orbits and flocks overlap throughout each loop',()=>{
  const scene=new THREE.Scene(),direction=new THREE.Vector3(),morning=createMorningSky(scene,direction,false,createFlowerLayout().patches);
  const birds=scene.getObjectByName('Distant circling birds'),matrix=new THREE.Matrix4(),point=new THREE.Vector3();
  const fixedDirection=direction.clone();
  assert.equal(scene.getObjectByName('Fine sun rays over flower patches').count,48);
  for(const aspect of [16/9,.5]) for(const zoom of [1,1.8]) for(let angle=0;angle<6;angle++) {
    const camera=new THREE.PerspectiveCamera(38,aspect,.1,3000); camera.zoom=zoom;
    camera.position.set(Math.sin(angle)*40,11,Math.cos(angle)*40); camera.lookAt(0,7,0); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    for(let time=0;time<90;time+=2) {
      morning.update(time,camera); assert.ok(direction.y>0);
      assert.ok(direction.equals(fixedDirection),'Camera orbit must not drag the sun around the tree');
      let visible=0;
      for(let i=0;i<birds.count;i++) {
        birds.getMatrixAt(i,matrix); point.setFromMatrixPosition(matrix).project(camera);
        if(Math.abs(point.x)<1 && Math.abs(point.y)<1 && point.z<1) visible++;
      }
      assert.ok(visible>0,`No flock at angle ${angle}, zoom ${zoom}, time ${time}`);
    }
  }
  assert.ok(birds.instanceMatrix.array.every(Number.isFinite));
});

test('Reduced motion freezes the flock without removing sunlight',()=>{
  const scene=new THREE.Scene(),direction=new THREE.Vector3(),morning=createMorningSky(scene,direction,true);
  const camera=new THREE.PerspectiveCamera(38,16/9,.1,3000); camera.position.set(21,11,34); camera.lookAt(0,7,0); camera.updateMatrixWorld();
  morning.update(0,camera); const birds=scene.getObjectByName('Distant circling birds'),before=birds.instanceMatrix.array.slice();
  morning.update(20,camera); assert.deepEqual(birds.instanceMatrix.array,before);
  assert.ok(scene.getObjectByName('Morning sun and halo').visible);
});

test('Petal detail stays in one existing bed without adding geometry or per-frame buffer uploads',()=>{
  const scene=new THREE.Scene(),flowers=createYellowFlowers(scene,false);
  const petals=scene.getObjectByName('Yellow cosmos petals');
  const {positions,patches}=createFlowerLayout();
  const patch=patches.reduce((best,p)=>(p.x-6)**2+(p.z-7)**2<(best.x-6)**2+(best.z-7)**2 ? p : best);
  const detail=petals.geometry.getAttribute('aFlowerDetail');
  assert.equal(scene.children.length,4);
  assert.deepEqual(scene.children.map(mesh=>mesh.count),[20160,2520,2520,5040]);
  assert.equal(scene.children.reduce((sum,mesh)=>sum+mesh.geometry.index.count/3*mesh.count,0),372960);
  let detailedCount=0;
  positions.forEach((point,i)=>{
    const expected=(point.x-patch.x)**2+(point.z-patch.z)**2<=4 ? 1 : 0;
    detailedCount+=expected;
    for(let petal=0;petal<8;petal++) assert.equal(detail.getX(i*8+petal),expected);
  });
  assert.ok(detailedCount>0 && detailedCount<positions.length/10);
  const versions=scene.children.map(mesh=>mesh.instanceMatrix.version);
  const colors=scene.children.map(mesh=>mesh.instanceColor?.version);
  flowers.update(1);flowers.update(10);
  assert.deepEqual(scene.children.map(mesh=>mesh.instanceMatrix.version),versions);
  assert.deepEqual(scene.children.map(mesh=>mesh.instanceColor?.version),colors);
});

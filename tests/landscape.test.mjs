import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFlowerLayout } from '../src/FlowerLayout.ts';
import { createMorningSky } from '../src/MorningSky.ts';

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

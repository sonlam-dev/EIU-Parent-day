import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAncientOak} from '../src/ancientTree.ts';
import {installBangFoliage} from '../src/BangFoliage.ts';

globalThis.document={createElement:()=>({width:512,height:1024,getContext:()=>new Proxy({
  createLinearGradient:()=>({addColorStop(){}}),
},{get:(target,key)=>target[key]||(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}})})};

test('Dense hardwood crown stays within a bounded geometry and draw-call budget',()=>{
  const {oak,roots}=createAncientOak();
  const foliage=installBangFoliage(oak);
  assert.ok(oak.shoots.length>=1500 && oak.shoots.length<=1800);
  const leaves=oak.getObjectByName('Veined botanical leaves');
  const meshes=[...oak.children,roots];
  const triangles=meshes.reduce((total,mesh)=>total+mesh.geometry.index.count/3*(mesh instanceof THREE.InstancedMesh ? mesh.count : 1),0);
  assert.equal(meshes.length,3,'Wood, roots and instanced foliage should require only three meshes');
  assert.ok(triangles<100000);
  assert.ok(leaves.instanceMatrix.array.every(Number.isFinite));
  const wood=oak.getObjectByName('Continuous branching trunk'),positions=wood.geometry.attributes.position;
  let baseRadius=0;
  for(let i=0;i<positions.count;i++) if(positions.getY(i)<.2) baseRadius=Math.max(baseRadius,Math.hypot(positions.getX(i),positions.getZ(i)));
  assert.ok(baseRadius>1.8,'The hardwood base must be broad and flared');
  const versions=[leaves.instanceMatrix.version,leaves.instanceColor.version];
  foliage.update(1);foliage.update(12);
  assert.deepEqual([leaves.instanceMatrix.version,leaves.instanceColor.version],versions,'Wind must not upload instance buffers each frame');
  for(const sx of [-1,1]) for(const sz of [-1,1]) assert.ok(foliage.anchors.some(p=>p.x*sx>3 && p.z*sz>2 && p.y>5));
});

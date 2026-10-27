import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWishLeaves} from '../src/WishLeaves.ts';
import {readSavedLeaves,saveLeaf} from '../src/SavedLeaves.ts';
import {wrapLeafText,drawWishLeaf,leafPng} from '../src/LeafArtwork.ts';

const rendered=[];
const context=new Proxy({
  measureText:text=>({width:Array.from(text).length*16}),
  fillText:text=>rendered.push(text),
  createLinearGradient:()=>({addColorStop(){}}),
},{get:(target,key)=>target[key]||(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
globalThis.document={fonts:{ready:Promise.resolve()},createElement:()=>({width:0,height:0,getContext:()=>context,toBlob:callback=>callback(new Blob(['png'],{type:'image/png'}))})};
const wish=(i,status='approved')=>({id:`wish-${i}`,name:'Mẹ Lan',recipient:'Hoàng Mỹ',message:'Chúc con luôn mạnh khỏe và tự tin trên con đường đã chọn.',color:'green',status,created_at:new Date(1700000000000+i).toISOString()});
const anchors=Array.from({length:80},(_,i)=>new THREE.Vector3(Math.sin(i)*6,7+i%5,Math.cos(i)*6));

function foliage(count=32) {
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial(),count);
  for(let i=0;i<count;i++){mesh.setMatrixAt(i,new THREE.Matrix4().makeTranslation(i*2,8,0));mesh.setColorAt(i,new THREE.Color('#476e35'));}
  return mesh;
}

test('Wishes only recolour existing crown leaves without changing geometry or transforms',()=>{
  const mesh=foliage(),scene=new THREE.Scene();scene.add(mesh);
  const matrices=mesh.instanceMatrix.array.slice(),original=mesh.instanceColor.array.slice();
  const leaves=createWishLeaves(mesh);
  leaves.sync([wish(1),{...wish(2),color:'pink'},wish(3,'pending')],0);leaves.update(20);
  assert.equal(leaves.count,2);assert.equal(scene.children.length,1);assert.equal(mesh.count,32);
  assert.deepEqual(mesh.instanceMatrix.array,matrices);
  let changed=0;
  for(let i=0;i<mesh.count;i++)if(original.slice(i*3,i*3+3).some((value,k)=>value!==mesh.instanceColor.array[i*3+k]))changed++;
  assert.equal(changed,16);
  const version=mesh.instanceColor.version;leaves.sync([wish(1),{...wish(2),color:'pink'},wish(3,'pending')],2);leaves.update(30);
  assert.equal(mesh.instanceColor.version,version);
  leaves.sync([],40);assert.deepEqual(mesh.instanceColor.array,original);
});

test('Each live or Emergency arrival glows on eight distinct leaves for 1–2 seconds without replaying history',()=>{
  const mesh=foliage(80),leaves=createWishLeaves(mesh);
  const history=wish(1),live={...wish(2),color:'pink'},sample={...wish(3),source:'emergency',color:'gold'};
  leaves.sync([history],0);
  const pulse=mesh.geometry.getAttribute('wishPulse');
  assert.ok(Array.from({length:80},(_,i)=>pulse.getX(i)).every(t=>t===-10),'History must not flash');
  const slots=[];
  for(const [index,row] of [live,sample].entries()) {
    const now=10+index*3;
    leaves.sync([history,live,...(index ? [sample] : [])],now);
    leaves.announce(row.id,now);
    const active=Array.from({length:80},(_,i)=>i).filter(i=>pulse.getX(i)>=now);
    assert.equal(active.length,8);
    assert.equal(new Set(active).size,8);
    for(const slot of active) {
      assert.ok(pulse.getX(slot)>=now && pulse.getX(slot)<now+.18);
      assert.ok(pulse.getX(slot)+pulse.getY(slot)>now+1 && pulse.getX(slot)+pulse.getY(slot)<now+2);
    }
    slots.push(active);
  }
  assert.ok(slots[0].every(slot=>!slots[1].includes(slot)),'Use fresh leaves while the crown has space');
  const shader={uniforms:{},vertexShader:'#include <color_vertex>',fragmentShader:'#include <emissivemap_fragment>'};
  mesh.material.onBeforeCompile(shader,{});
  assert.ok(shader.vertexShader.includes('smoothstep(0.0,0.45,wishAge)'));
  assert.ok(shader.fragmentShader.includes('totalEmissiveRadiance +='));
  const versions=[pulse.version,mesh.instanceColor.version];
  leaves.update(13.8);assert.equal(shader.uniforms.uWishTime.value,13.8);
  leaves.update(16);assert.deepEqual([pulse.version,mesh.instanceColor.version],versions,'Animation only advances a uniform, without per-frame buffer uploads');
  leaves.sync([history,live],17);
  for(const slot of slots[1])assert.equal(pulse.getX(slot),-10,'Hiding a wish stops its glow');
  leaves.dispose();assert.equal(mesh.geometry.getAttribute('wishPulse'),undefined);
});

test('Reduced motion keeps all eight colours while suppressing the arrival pulse',()=>{
  const mesh=foliage(),leaves=createWishLeaves(mesh,true);
  leaves.sync([wish(1)],0);leaves.announce('wish-1',1);
  const pulse=mesh.geometry.getAttribute('wishPulse');
  assert.ok(Array.from({length:32},(_,i)=>pulse.getX(i)).every(t=>t===-10));
  assert.equal(leaves.count,1);
});

test('Large events reuse existing foliage and picking opens the associated wish',()=>{
  const mesh=foliage(1),leaves=createWishLeaves(mesh);
  leaves.sync([wish(1)],0);mesh.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(0,8,10),new THREE.Vector3(0,0,-1));
  assert.equal(leaves.pick(ray),'wish-1');
  leaves.sync([{...wish(1),message:'Edited message',color:'gold'}],1);
  assert.equal(leaves.pick(ray),'wish-1');
  const batch=Array.from({length:10000},(_,i)=>wish(i));leaves.sync(batch,2);
  assert.equal(leaves.count,10000);assert.equal(mesh.count,1);
  assert.equal(leaves.pick(ray),'wish-9999');leaves.highlight('wish-9999');
  assert.equal(leaves.pick(ray),'wish-9998');
  leaves.dispose();
});

test('Scanning the same QR after a reload restores saved personal leaves without duplicating retries',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  assert.equal(saveLeaf(wish(1,'pending'),storage),true);
  assert.deepEqual(readSavedLeaves(storage),[wish(1,'pending')]);
  saveLeaf(wish(1),storage);saveLeaf(wish(2),storage);
  assert.deepEqual(readSavedLeaves(storage).map(row=>row.id),['wish-2','wish-1']);
  const broken={getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}};
  assert.deepEqual(readSavedLeaves(broken),[]);assert.equal(saveLeaf(wish(1),broken),false);
  for(const key of values.keys())values.set(key,'invalid json');
  assert.deepEqual(readSavedLeaves(storage),[]);
});

test('Leaf artwork wraps words naturally and exports a PNG with the complete message',async()=>{
  const lines=wrapLeafText(context,'Chúc con luôn mạnh khỏe',150);
  assert.deepEqual(lines,['Chúc con','luôn mạnh','khỏe']);
  assert.equal(wrapLeafText(context,'a'.repeat(50),150).join(''),'a'.repeat(50));
  const long={...wish(3),message:'Chúc con luôn mạnh khỏe và tự tin. '.repeat(14).slice(0,500)};
  rendered.length=0;drawWishLeaf(context,long,1000,760);
  assert.ok(rendered.join(' ').includes(long.message.trim()));
  const blob=await leafPng(long);assert.equal(blob.type,'image/png');
});

import * as THREE from 'three';
import type {Wish} from './types.ts';
import {colors} from './types.ts';

/** Recolour existing foliage instances; never add leaves, labels or floating cards. */
export function createWishLeaves(foliage:THREE.InstancedMesh) {
  const original=new Float32Array(foliage.instanceColor!.array);
  const byWish=new Map<string,number>();
  const buckets=new Map<number,Wish[]>(),cycles=new Map<number,number>();
  const color=new THREE.Color();
  // Spread changes throughout the existing crown instead of colouring one clump.
  const slots=Array.from({length:foliage.count},(_,i)=>i).sort((a,b)=>{
    const score=(n:number)=>{const v=Math.sin(n*127.1+73.7)*43758.5453;return v-Math.floor(v);};
    return score(a)-score(b);
  });
  let snapshot='',size=0;
  function sync(wishes:Wish[],_time=0) {
    const approved=[...new Map(wishes.filter(w=>w.status==='approved').map(w=>[w.id,w])).values()].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
    const next=JSON.stringify(approved);if(next===snapshot)return;snapshot=next;
    const allowed=new Set(approved.map(w=>w.id));
    for(const id of byWish.keys())if(!allowed.has(id))byWish.delete(id);
    const load=new Uint32Array(foliage.count);
    for(const slot of byWish.values())load[slot]++;
    let cursor=0;
    for(const wish of approved)if(!byWish.has(wish.id)) {
      // All existing leaves fill once before an exceptionally large event shares leaves.
      while(cursor<slots.length && load[slots[cursor]]>0)cursor++;
      const slot=slots[cursor<slots.length ? cursor : approved.indexOf(wish)%slots.length];
      byWish.set(wish.id,slot);load[slot]++;
    }
    buckets.clear();cycles.clear();
    for(const wish of approved) {
      const slot=byWish.get(wish.id)!;
      const bucket=buckets.get(slot)||[];bucket.push(wish);buckets.set(slot,bucket);
    }
    const attribute=foliage.instanceColor!;
    (attribute.array as Float32Array).set(original);
    for(const [slot,wishes] of buckets) {
      const wish=wishes[wishes.length-1];
      color.set(colors.find(option=>option.id===wish.color)?.hex||colors[0].hex);
      foliage.setColorAt(slot,color);
    }
    attribute.needsUpdate=true;size=approved.length;
  }
  function pick(raycaster:THREE.Raycaster) {
    const hit=raycaster.intersectObject(foliage,false).find(hit=>hit.instanceId!==undefined&&buckets.has(hit.instanceId));
    if(hit?.instanceId===undefined)return;
    const bucket=buckets.get(hit.instanceId)!,cycle=cycles.get(hit.instanceId)||0;
    return bucket[bucket.length-1-cycle%bucket.length].id;
  }
  return {sync,pick,update(_time:number,_wind=0){},highlight(id:string){const slot=byWish.get(id);if(slot!==undefined){const bucket=buckets.get(slot)!;const index=bucket.findIndex(w=>w.id===id);cycles.set(slot,bucket.length-index);}},get count(){return size;},dispose(){(foliage.instanceColor!.array as Float32Array).set(original);foliage.instanceColor!.needsUpdate=true;byWish.clear();buckets.clear();}};
}

import * as THREE from 'three';
import type {Wish} from './types.ts';
import {colors} from './types.ts';

function randomFor(id:string) {
  let seed=2166136261;
  for(const char of id)seed=Math.imul(seed^char.charCodeAt(0),16777619);
  return ()=>{seed+=0x6D2B79F5;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};
}

/** Eight existing leaves per wish; a brief GPU glow adds no meshes or lights. */
export function createWishLeaves(foliage:THREE.InstancedMesh,reducedMotion=false) {
  const original=new Float32Array(foliage.instanceColor!.array);
  const byWish=new Map<string,number[]>();
  const buckets=new Map<number,Wish[]>(),cycles=new Map<number,number>();
  const color=new THREE.Color(),time={value:0};
  const pulse=new THREE.InstancedBufferAttribute(new Float32Array(foliage.count*2),2);
  for(let i=0;i<foliage.count;i++)pulse.setXY(i,-10,1.5);
  pulse.setUsage(THREE.DynamicDrawUsage);
  const baseColor=new THREE.InstancedBufferAttribute(original.slice(),3);
  foliage.geometry.setAttribute('wishPulse',pulse);
  foliage.geometry.setAttribute('wishBaseColor',baseColor);
  const material=foliage.material as THREE.Material;
  const compile=material.onBeforeCompile,cacheKey=material.customProgramCacheKey;
  material.onBeforeCompile=function(shader,renderer) {
    compile.call(this,shader,renderer);
    shader.uniforms.uWishTime=time;
    shader.vertexShader=`attribute vec2 wishPulse;
attribute vec3 wishBaseColor;
uniform float uWishTime;
varying float vWishGlow;
${shader.vertexShader}`.replace('#include <color_vertex>',`
      #include <color_vertex>
      float wishAge=max(0.0,uWishTime-wishPulse.x);
      float wishProgress=clamp(wishAge/wishPulse.y,0.0,1.0);
      vWishGlow=sin(wishProgress*3.14159265);
      vWishGlow*=vWishGlow;
      #ifdef USE_INSTANCING_COLOR
        vColor.rgb=mix(wishBaseColor,vColor.rgb,smoothstep(0.0,0.45,wishAge));
      #endif
    `);
    shader.fragmentShader=`varying float vWishGlow;\n${shader.fragmentShader}`.replace('#include <emissivemap_fragment>',`
      #include <emissivemap_fragment>
      totalEmissiveRadiance += mix(diffuseColor.rgb,vec3(1.0,0.9,0.65),0.35)*vWishGlow*1.35;
    `);
  };
  material.customProgramCacheKey=()=>`${cacheKey.call(material)}-wish-glow-v1`;
  material.needsUpdate=true;
  let snapshot='',size=0;
  function sync(wishes:Wish[],seconds=0) {
    time.value=seconds;
    const approved=[...new Map(wishes.filter(w=>w.status==='approved').map(w=>[w.id,w])).values()].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
    const next=JSON.stringify(approved);if(next===snapshot)return;snapshot=next;
    const allowed=new Set(approved.map(w=>w.id));
    for(const id of byWish.keys())if(!allowed.has(id))byWish.delete(id);
    const load=new Uint32Array(foliage.count);
    for(const slots of byWish.values())for(const slot of slots)load[slot]++;
    const available=Array.from({length:foliage.count},(_,i)=>i).filter(i=>load[i]===0);
    for(const wish of approved)if(!byWish.has(wish.id)) {
      const random=randomFor(wish.id),chosen:number[]=[];
      while(chosen.length<Math.min(8,foliage.count)) {
        let slot:number;
        if(available.length) {
          const index=Math.floor(random()*available.length);
          slot=available[index];available[index]=available[available.length-1];available.pop();
        } else {
          slot=Math.floor(random()*foliage.count);
          while(chosen.includes(slot))slot=(slot+1)%foliage.count;
        }
        chosen.push(slot);load[slot]++;
      }
      byWish.set(wish.id,chosen);
    }
    buckets.clear();cycles.clear();
    for(const wish of approved)for(const slot of byWish.get(wish.id)!) {
      const bucket=buckets.get(slot)||[];bucket.push(wish);buckets.set(slot,bucket);
    }
    const attribute=foliage.instanceColor!;
    (attribute.array as Float32Array).set(original);
    for(const [slot,wishes] of buckets) {
      const wish=wishes[wishes.length-1];
      color.set(colors.find(option=>option.id===wish.color)?.hex||colors[0].hex);
      foliage.setColorAt(slot,color);
    }
    for(let slot=0;slot<foliage.count;slot++)if(!buckets.has(slot))pulse.setXY(slot,-10,1.5);
    pulse.needsUpdate=true;attribute.needsUpdate=true;size=approved.length;
  }
  function announce(id:string,seconds:number) {
    const slots=byWish.get(id);if(!slots || reducedMotion)return;
    const random=randomFor(`${id}:glow`);
    for(const slot of slots) {
      const previous=buckets.get(slot)?.filter(w=>w.id!==id).at(-1);
      if(previous) {
        color.set(colors.find(option=>option.id===previous.color)?.hex||colors[0].hex);
        baseColor.setXYZ(slot,color.r,color.g,color.b);
      } else baseColor.setXYZ(slot,original[slot*3],original[slot*3+1],original[slot*3+2]);
      // Slightly staggered pulses, each finishing within 1–2 seconds of arrival.
      pulse.setXY(slot,seconds+random()*.18,1.1+random()*.7);
    }
    time.value=seconds;pulse.needsUpdate=true;baseColor.needsUpdate=true;
  }
  function pick(raycaster:THREE.Raycaster) {
    const hit=raycaster.intersectObject(foliage,false).find(hit=>hit.instanceId!==undefined&&buckets.has(hit.instanceId));
    if(hit?.instanceId===undefined)return;
    const bucket=buckets.get(hit.instanceId)!,cycle=cycles.get(hit.instanceId)||0;
    return bucket[bucket.length-1-cycle%bucket.length].id;
  }
  return {sync,announce,pick,update(seconds:number,_wind=0){time.value=seconds;},highlight(id:string){for(const slot of byWish.get(id)||[]){const bucket=buckets.get(slot)!;const index=bucket.findIndex(w=>w.id===id);cycles.set(slot,bucket.length-index);}},get count(){return size;},dispose(){
    (foliage.instanceColor!.array as Float32Array).set(original);foliage.instanceColor!.needsUpdate=true;
    foliage.geometry.deleteAttribute('wishPulse');foliage.geometry.deleteAttribute('wishBaseColor');
    material.onBeforeCompile=compile;material.customProgramCacheKey=cacheKey;material.needsUpdate=true;
    byWish.clear();buckets.clear();
  }};
}

import * as THREE from 'three';
import type { Wish } from './types.ts';
import { colors } from './types.ts';
import { arrivalGlow, DROP_SECONDS, GLOW_SECONDS, dropStart, envelopeSlot } from './EnvelopeLayout.ts';
import { resolveEnvelopeContacts, type EnvelopeBody } from './EnvelopePhysics.ts';

function envelopeTexture() {
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=352;
  const ctx=canvas.getContext('2d')!;
  const paper=ctx.createLinearGradient(0,0,512,352);
  paper.addColorStop(0,'#fffdf1'); paper.addColorStop(.6,'#f7e8c9'); paper.addColorStop(1,'#e4cca2');
  ctx.fillStyle=paper; ctx.fillRect(0,0,512,352);
  ctx.strokeStyle='#c5a97c'; ctx.lineWidth=3; ctx.strokeRect(8,8,496,336);
  ctx.fillStyle='#f4e3bf'; ctx.beginPath(); ctx.moveTo(8,344); ctx.lineTo(256,147); ctx.lineTo(504,344); ctx.fill();
  ctx.strokeStyle='#cfb58b'; ctx.beginPath(); ctx.moveTo(8,344); ctx.lineTo(256,147); ctx.lineTo(504,344); ctx.stroke();
  ctx.shadowColor='#846e4b55'; ctx.shadowBlur=9; ctx.shadowOffsetY=5;
  ctx.fillStyle='#fff4db'; ctx.beginPath(); ctx.moveTo(8,8); ctx.lineTo(256,203); ctx.lineTo(504,8); ctx.closePath(); ctx.fill();
  ctx.shadowBlur=0; ctx.shadowOffsetY=0; ctx.stroke();
  ctx.fillStyle='#b77d58'; ctx.beginPath(); ctx.arc(256,197,30,0,Math.PI * 2); ctx.fill();
  ctx.strokeStyle='#dbb18b'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(256,197,25,0,Math.PI * 2); ctx.stroke();
  ctx.fillStyle='#fff0d3'; ctx.beginPath(); ctx.moveTo(256,210); ctx.bezierCurveTo(225,191,246,175,256,188); ctx.bezierCurveTo(266,175,287,191,256,210); ctx.fill();
  ctx.fillStyle='#a38d69'; ctx.font='14px Georgia'; ctx.textAlign='center'; ctx.fillText('WITH LOVE · PARENT DAY',256,305);
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; return texture;
}

type Pendant={id:string;born:number;color:THREE.Color;position:THREE.Vector3;anchor:THREE.Vector3;body:EnvelopeBody;phase:number};

export function createParentDayDecor(scene:THREE.Scene,anchors:THREE.Vector3[],reducedMotion:boolean,camera?:THREE.Camera,crownLift=0) {
  const group=new THREE.Group(); group.name='Parent Day hanging wish envelopes'; scene.add(group);
  if (!camera) { const fallback=new THREE.PerspectiveCamera(38,16 / 9,.1,400); fallback.position.set(18,9,29); fallback.lookAt(0,5.3,0); camera=fallback; }
  const texture=envelopeTexture(),cardGeometry=new THREE.PlaneGeometry(.82,.56),threadGeometry=new THREE.CylinderGeometry(.005,.005,1,4,12);
  const cardMaterial=new THREE.MeshStandardMaterial({map:texture,roughness:.88,side:THREE.DoubleSide});
  const threadMaterial=new THREE.MeshLambertMaterial({color:'#b89a63'});
  const glowCanvas=document.createElement('canvas'); glowCanvas.width=256; glowCanvas.height=192;
  const ctx=glowCanvas.getContext('2d')!,gradient=ctx.createRadialGradient(128,96,15,128,96,125);
  gradient.addColorStop(0,'rgba(255,244,179,.6)'); gradient.addColorStop(.55,'rgba(255,213,99,.3)'); gradient.addColorStop(1,'rgba(255,200,80,0)');
  ctx.fillStyle=gradient; ctx.fillRect(0,0,256,192);
  const glowTexture=new THREE.CanvasTexture(glowCanvas); glowTexture.colorSpace=THREE.SRGBColorSpace;
  const glowGeometry=new THREE.PlaneGeometry(1.05,.76),glowMaterial=new THREE.MeshBasicMaterial({map:glowTexture,color:'#ffe8a3',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const clock={value:0},wind={value:0};
  // Endpoints stay attached; the middle bows and ripples with delayed wind response.
  threadMaterial.onBeforeCompile=shader => {
    shader.uniforms.uCordTime=wind;
    shader.vertexShader=`uniform float uCordTime; attribute float aCordPhase; attribute float aCordSlack;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      float t=clamp(position.y + .5,0.0,1.0);
      float bow=sin(3.14159265*t);
      transformed.x += bow * aCordSlack * (1.0 + .28*sin(uCordTime*1.15 + aCordPhase - t*2.0));
      transformed.z += bow * aCordSlack * .4*sin(uCordTime*.87 + aCordPhase + t*2.7);
    `);
  };
  threadMaterial.customProgramCacheKey=() => 'soft-hanging-cord-v1';
  const glowVertex=`
    attribute float aLandedAt;
    uniform float uArrivalTime;
    varying float vArrivalGlow;
  `;
  const glowCalculation=`
    float age=uArrivalTime - aLandedAt;
    vArrivalGlow=age >= 0.0 && age < ${GLOW_SECONDS.toFixed(1)} ? min(1.0,min((age + .02) / .18,(${GLOW_SECONDS.toFixed(1)} - age) / .35)) : 0.0;
  `;
  cardMaterial.onBeforeCompile=shader => {
    shader.uniforms.uArrivalTime=clock; shader.uniforms.uEnvelopeWind=wind;
    shader.vertexShader=`${glowVertex} uniform float uEnvelopeWind;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      ${glowCalculation}
      float phase=instanceMatrix[3].x * 2.3 + instanceMatrix[3].z;
      transformed.z += sin(uEnvelopeWind * .85 + phase) * .018 * (.5 - position.y);
    `);
    shader.fragmentShader=`varying float vArrivalGlow;\n${shader.fragmentShader}`.replace('#include <emissivemap_fragment>',`
      #include <emissivemap_fragment>
      totalEmissiveRadiance += vec3(1.0,.72,.27) * vArrivalGlow * .9;
    `);
  };
  cardMaterial.customProgramCacheKey=() => 'envelope-independent-arrival-glow-v1';
  glowMaterial.onBeforeCompile=shader => {
    shader.uniforms.uArrivalTime=clock;
    shader.vertexShader=`${glowVertex}\n${shader.vertexShader}`.replace('#include <begin_vertex>',`#include <begin_vertex>\n${glowCalculation}`).replace('#include <project_vertex>',`#include <project_vertex>\nif (vArrivalGlow <= 0.0) gl_Position=vec4(2.0,2.0,2.0,1.0);`);
    shader.fragmentShader=`varying float vArrivalGlow;\n${shader.fragmentShader}`.replace('#include <map_fragment>',`#include <map_fragment>\ndiffuseColor.a *= vArrivalGlow;`);
  };
  glowMaterial.customProgramCacheKey=() => 'envelope-arrival-halo-v1';
  let capacity=0;
  let cards!:THREE.InstancedMesh,threads!:THREE.InstancedMesh,halos!:THREE.InstancedMesh;
  let landings:THREE.InstancedBufferAttribute;
  let cordPhases:THREE.InstancedBufferAttribute,cordSlack:THREE.InstancedBufferAttribute;
  let pendants:Pendant[]=[]; const byId=new Map<string,Pendant>(),dirty=new Set<number>();
  let initialized=false,lastTime=0,scale=1,snapshot='',focused:string | undefined;
  const dummy=new THREE.Object3D(),tint=new THREE.Color(),highlightColor=new THREE.Color('#ffe5a3');
  const up=new THREE.Vector3(0,1,0),end=new THREE.Vector3(),direction=new THREE.Vector3(),worldUp=new THREE.Vector3(0,1,0);
  const orientation=new THREE.Quaternion(0,0,0,0);
  const rotation=new THREE.Quaternion(),euler=new THREE.Euler();
  let simulationTime=0,contacts=0;
  const supportCells=new Map<string,THREE.Vector3>();
  for (const point of anchors) {
    if (point.y <= 5.5+crownLift || point.y >= 10.8+crownLift) continue;
    const key=`${Math.floor(point.x)}:${Math.floor(point.z)}`;
    if (!supportCells.has(key) || point.y < supportCells.get(key)!.y) supportCells.set(key,point);
  }
  const supports=[...supportCells.values()];
  function reserve(required:number) {
    if (required <= capacity) return;
    capacity=Math.max(32,2 ** Math.ceil(Math.log2(required)));
    if (cards) { group.remove(cards,threads,halos); cards.dispose(); threads.dispose(); halos.dispose(); }
    landings=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1); landings.setUsage(THREE.DynamicDrawUsage);
    cardGeometry.setAttribute('aLandedAt',landings); glowGeometry.setAttribute('aLandedAt',landings);
    cordPhases=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1);
    cordSlack=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1); cordSlack.setUsage(THREE.DynamicDrawUsage);
    threadGeometry.setAttribute('aCordPhase',cordPhases); threadGeometry.setAttribute('aCordSlack',cordSlack);
    cards=new THREE.InstancedMesh(cardGeometry,cardMaterial,capacity);
    threads=new THREE.InstancedMesh(threadGeometry,threadMaterial,capacity);
    halos=new THREE.InstancedMesh(glowGeometry,glowMaterial,capacity); halos.instanceMatrix=cards.instanceMatrix;
    cards.name='One envelope per wish'; threads.name='Envelope suspension cords'; halos.name='Three second arrival glow';
    for (const mesh of [cards,threads,halos]) { mesh.frustumCulled=false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(mesh); }
  }
  function layout() {
    scale=Math.min(1,Math.cbrt(180 / Math.max(180,pendants.length)));
    pendants.forEach((p,i) => {
      const slot=envelopeSlot(i,supports,crownLift);
      p.anchor.set(slot.anchor.x,slot.anchor.y,slot.anchor.z);
      p.position.set(slot.x,slot.anchor.y-slot.drop,slot.z);
      if (!p.phase) {
        p.phase=i * 2.399963 + .1;
        Object.assign(p.body,{x:p.position.x,y:p.position.y,z:p.position.z});
      }
      landings.setX(i,p.born + DROP_SECONDS); dirty.add(i);
      cordPhases.setX(i,p.phase);
    });
    landings.needsUpdate=true;
    cordPhases.needsUpdate=true;
  }
  function add(id:string,born:number,color:string) {
    const pendant={id,born,color:new THREE.Color(color),position:new THREE.Vector3(),anchor:new THREE.Vector3(),phase:0,body:{x:0,y:0,z:0,vx:0,vy:0,vz:0,roll:0,spin:0}};
    byId.set(id,pendant); pendants.push(pendant);
  }
  const warmColors=['#fff9ec','#fff2d6','#ffede3','#eff3da'];
  for (let i=0;i<10;i++) add(`ornament-${i}`,-100,warmColors[i % 4]);
  reserve(10); cards.count=threads.count=halos.count=10; layout();
  function sync(wishes:Wish[],time:number) {
    const approved=[...new Map(wishes.filter(w => w.status === 'approved').map(w => [w.id,w])).values()];
    const signature=approved.map(w => `${w.id}:${w.color}`).sort().join('|');
    if (initialized && signature === snapshot) return;
    snapshot=signature;
    const allowed=new Set(approved.map(w => w.id));
    for (const p of pendants) if (!p.id.startsWith('ornament-') && !allowed.has(p.id)) byId.delete(p.id);
    pendants=pendants.filter(p => byId.has(p.id));
    for (const wish of approved) {
      const existing=byId.get(wish.id);
      if (existing) existing.color.set('#fff5dd').lerp(new THREE.Color(colors.find(c => c.id === wish.color)?.hex || '#68843b'),.12);
    }
    const added=approved.filter(w => !byId.has(w.id)).sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
    added.forEach((w,i) => {
      tint.set('#fff5dd').lerp(new THREE.Color(colors.find(c => c.id === w.color)?.hex || '#68843b'),.12);
      add(w.id,!initialized ? -100 : dropStart(time,i,added.length,reducedMotion),`#${tint.getHexString()}`);
    });
    reserve(pendants.length); cards.count=threads.count=halos.count=pendants.length;
    dirty.clear(); layout(); initialized=true;
  }
  function update(time:number) {
    const elapsed=Math.max(0,time-simulationTime); simulationTime=time;
    lastTime=time; clock.value=time; wind.value=reducedMotion ? 0 : time;
    const steps=Math.max(1,Math.ceil(Math.min(elapsed,.1)*120)),dt=Math.min(elapsed,.1)/steps;
    contacts=0;
    for (let step=0;step<steps;step++) {
      const at=time-(steps-step-1)*dt,bodies:EnvelopeBody[]=[];
      for (const p of pendants) {
        if (at<p.born) continue;
        const progress=THREE.MathUtils.clamp((at-p.born)/DROP_SECONDS,0,1),lift=3*(1-progress)**3,b=p.body;
        if (reducedMotion || elapsed>.3 || at-p.born<dt) {
          Object.assign(b,{x:p.position.x,y:p.position.y+lift,z:p.position.z,vx:0,vy:0,vz:0,roll:0,spin:0});
        } else {
          const length=Math.max(1,p.anchor.distanceTo(p.position)),stiffness=9.81/length;
          const gust=Math.sin(at*.72+p.anchor.x*.22+p.anchor.z*.18)+.35*Math.sin(at*1.47+p.phase);
          const rise=((b.x-p.position.x)**2+(b.z-p.position.z)**2)/(2*length);
          b.vx+=((p.position.x+gust*.22-b.x)*stiffness-b.vx*1.15)*dt;
          b.vy+=((p.position.y+lift+rise-b.y)*45-b.vy*7)*dt;
          b.vz+=((p.position.z+Math.cos(at*.63+p.phase)*.13-b.z)*stiffness-b.vz*1.15)*dt;
          b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt;
          b.spin+=(-b.roll*18-b.spin*3.4)*dt; b.roll+=b.spin*dt;
        }
        bodies.push(b);
      }
      if (!reducedMotion) contacts+=resolveEnvelopeContacts(bodies,.55*scale);
    }
    orientation.copy(camera!.quaternion);
    for (let i=0;i<pendants.length;i++) {
      const p=pendants[i],b=p.body,progress=THREE.MathUtils.clamp((time-p.born)/DROP_SECONDS,0,1);
      dummy.position.set(b.x,b.y,b.z);
      euler.set(reducedMotion ? 0 : Math.sin(time*.8+p.phase)*.055,Math.sin(p.phase)*.35,reducedMotion ? Math.sin(p.phase)*.08 : Math.sin(time*.9+p.phase)*.07+b.roll-b.vx*.08);
      rotation.setFromEuler(euler); dummy.quaternion.copy(orientation).multiply(rotation);
      dummy.scale.setScalar(progress<=0 ? .00001 : scale*(.9+.1*Math.sin(p.phase))); dummy.updateMatrix(); cards.setMatrixAt(i,dummy.matrix);
      cards.setColorAt(i,tint.copy(p.color).lerp(highlightColor,p.id === focused ? .18 : 0));
      end.set(0,.28,0).multiply(dummy.scale).applyQuaternion(dummy.quaternion).add(dummy.position); direction.subVectors(end,p.anchor);
      dummy.position.copy(p.anchor).add(end).multiplyScalar(.5); dummy.quaternion.setFromUnitVectors(worldUp,direction.clone().normalize());
      dummy.scale.set(progress<=0 ? .00001 : 1,Math.max(.00001,direction.length()),progress<=0 ? .00001 : 1); dummy.updateMatrix(); threads.setMatrixAt(i,dummy.matrix);
      cordSlack.setX(i,reducedMotion ? .025 : .045+(1-progress)*.18+Math.min(.16,Math.hypot(b.vx,b.vz)*.09));
      if (progress >= 1) dirty.delete(i);
    }
    cards.instanceMatrix.needsUpdate=true; threads.instanceMatrix.needsUpdate=true; if (cards.instanceColor) cards.instanceColor.needsUpdate=true;
    cordSlack.needsUpdate=true;
  }
  function pick(raycaster:THREE.Raycaster) {
    cards.computeBoundingSphere();
    const hit=raycaster.intersectObject(cards,false).find(hit => hit.instanceId!==undefined && lastTime>=pendants[hit.instanceId].born);
    return hit?.instanceId===undefined ? undefined : pendants[hit.instanceId].id;
  }
  function highlight(id:string) { const previous=focused; focused=id; pendants.forEach((p,i) => { if (p.id === id || p.id === previous) dirty.add(i); }); }
  return {sync,update,highlight,pick,get count(){return pendants.length;},get activeContacts(){return contacts;},get activeDrops(){return pendants.filter(p => lastTime<p.born+DROP_SECONDS).length;},get activeGlows(){return pendants.reduce((count,p) => count + (arrivalGlow(lastTime,p.born)>0 ? 1 : 0),0);},dispose(){texture.dispose();glowTexture.dispose();}};
}

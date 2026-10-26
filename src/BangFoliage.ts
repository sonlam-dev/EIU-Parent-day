import * as THREE from 'three';
import type { Tree } from '@dgreenheck/ez-tree';

/** Compact oval blade, repeated in clusters at each branch tip. */
export function createBangLeafGeometry() {
  const vertices:number[] = [],uvs:number[] = [],indices:number[] = [];
  const rows = 4;
  for (let j = 0; j <= rows; j++) {
    const t=j / rows,width=.34 * Math.pow(Math.sin(Math.PI * t),.64) * (.42 + .72 * t);
    for (let side=-1;side<=1;side++) {
      const x=side * width;
      vertices.push(x,t,Math.sin(t * Math.PI) * .075 - Math.abs(x) * .22 + Math.sin(t * 6) * .012);
      uvs.push(.5 + x / .8,t);
    }
    if (j < rows) for (let k=0;k<2;k++) { const i=j * 3 + k; indices.push(i,i + 1,i + 3,i + 1,i + 4,i + 3); }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function createVeinTexture() {
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d')!;
  const gradient=ctx.createLinearGradient(0,0,512,0);
  gradient.addColorStop(0,'#b9bfa7'); gradient.addColorStop(.43,'#f2f0d9'); gradient.addColorStop(.51,'#fff4d7'); gradient.addColorStop(.59,'#e9ebd3'); gradient.addColorStop(1,'#c4c9ae');
  ctx.fillStyle=gradient; ctx.fillRect(0,0,512,512);
  // Fine mottling and slightly different vein paths avoid a flat, uniform plastic surface.
  const rand=(i:number) => { const v=Math.sin(i * 127.1 + 39.7) * 43758.5453; return v - Math.floor(v); };
  for (let i=0;i<4000;i++) { ctx.fillStyle=i % 2 ? 'rgba(115,104,66,.025)' : 'rgba(255,255,236,.1)'; ctx.fillRect(rand(i) * 512,rand(i + 800) * 512,1 + rand(i + 900) * 2,1 + rand(i + 1000) * 2); }
  ctx.strokeStyle='#d0bd87'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(256,512); ctx.bezierCurveTo(250,350,263,170,256,0); ctx.stroke();
  ctx.strokeStyle='rgba(104,119,69,.42)'; ctx.lineWidth=1.4;
  for (let i=0;i<10;i++) {
    const t=.15 + i * .074,width=.34 * Math.pow(Math.sin(Math.PI * t),.64) * (.42 + .72 * t),y=(1 - t) * 512;
    for (const side of [-1,1]) {
      const endX=256 + side * width / .8 * 512 * .92,endY=y - 42 - rand(i + side + 20) * 15;
      ctx.beginPath(); ctx.moveTo(256,y + 18); ctx.bezierCurveTo(256 + side * 35,y + 6,endX - side * 10,endY + 20,endX,endY); ctx.stroke();
      ctx.lineWidth=.6;
      for (let k=1;k<=4;k++) { const f=k / 5,x=THREE.MathUtils.lerp(256,endX,f),yy=THREE.MathUtils.lerp(y + 18,endY,f); ctx.beginPath(); ctx.moveTo(x,yy); ctx.quadraticCurveTo(x + side * 10,yy - 20,x + side * 12,yy - 40); ctx.stroke(); }
      ctx.lineWidth=1.4;
    }
  }
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=8;
  return texture;
}

export function createLeafMaterial(texture:THREE.Texture,time={value:0}) {
  const material=new THREE.MeshPhongMaterial({map:texture,color:'#ffffff',side:THREE.DoubleSide,shininess:7,specular:'#667849'});
  material.onBeforeCompile=shader => {
    shader.uniforms.uTime=time; material.userData.shader=shader;
    shader.vertexShader=`uniform float uTime;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      vec3 leafOrigin=instanceMatrix[3].xyz;
      float phase=leafOrigin.x * .37 + leafOrigin.z * .29;
      float flutter=sin(uTime * 1.5 + phase) + .25 * sin(uTime * 2.2 - phase * 1.7);
      transformed.z += flutter * .055 * uv.y * uv.y;
      transformed.x += sin(uTime * 1.1 + phase * .7) * .025 * uv.y;
    `).replace('#include <project_vertex>',`
      vec4 leafWorld=modelMatrix * instanceMatrix * vec4(transformed,1.0);
      float flex=smoothstep(.8,9.0,leafWorld.y);
      leafWorld.x += sin(uTime * .75 + leafWorld.z * .22) * .075 * flex;
      leafWorld.z += sin(uTime * .55 + leafWorld.x * .2) * .045 * flex;
      vec4 mvPosition=viewMatrix * leafWorld;
      gl_Position=projectionMatrix * mvPosition;
    `);
  };
  material.customProgramCacheKey=() => 'small-leaf-gentle-breeze-v3';
  return material;
}

export function installBangFoliage(tree:Tree,crownLift=0) {
  const source=tree.leavesMesh,positions=source.geometry.attributes.position;
  const geometry=createBangLeafGeometry(),texture=createVeinTexture();
  const material=createLeafMaterial(texture);
  // Several small physical blades replace each pair of crossed photographic cards.
  const sourceCount=Math.floor(positions.count / 8),fillCount=6000,gapCount=5184,forkCount=3456;
  const count=sourceCount * 3 + fillCount + gapCount + forkCount,foliage=new THREE.InstancedMesh(geometry,material,count);
  const anchors:THREE.Vector3[] = [],base=new THREE.Vector3(),top=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),normal=new THREE.Vector3(),matrix=new THREE.Matrix4(),tint=new THREE.Color();
  const palette=['#476f3a','#567d43','#638b4d','#779a59','#89a76b','#9caf72','#b1b77d'];
  const random=(i:number) => THREE.MathUtils.seededRandom(i + 23399);
  const turn=new THREE.Matrix4(),small=new THREE.Matrix4();
  let instance=0;
  for (let i=0;i<sourceCount;i++) {
    const offset=i * 8;
    const p0=new THREE.Vector3().fromBufferAttribute(positions,offset),p1=new THREE.Vector3().fromBufferAttribute(positions,offset + 1),p2=new THREE.Vector3().fromBufferAttribute(positions,offset + 2),p3=new THREE.Vector3().fromBufferAttribute(positions,offset + 3);
    base.copy(p1).add(p2).multiplyScalar(.5); top.copy(p0).add(p3).multiplyScalar(.5);
    right.copy(p2).sub(p1); up.copy(top).sub(base); normal.crossVectors(right,up).normalize().multiplyScalar((right.length() + up.length()) * .5);
    // Three compact blades retain coverage with fewer vertices and fragments.
    for (let j=0;j<3;j++) {
      const n=i * 3 + j;
      const origin=base.clone().addScaledVector(right,(random(n * 7) - .5) * .8).addScaledVector(up,random(n * 7 + 1) * .85);
      matrix.makeBasis(right.clone().multiplyScalar(.65),up.clone().multiplyScalar(.65),normal.clone().multiplyScalar(.65));
      turn.makeRotationFromEuler(new THREE.Euler((random(n * 7 + 2) - .5) * 1.5,(random(n * 7 + 3) - .5) * 1.6,(random(n * 7 + 4) - .5) * 2.2));
      matrix.multiply(turn).setPosition(origin); foliage.setMatrixAt(instance,matrix);
      foliage.setColorAt(instance++,tint.set(palette[Math.floor(random(n * 7 + 5) * palette.length)]));
    }
    const anchor=base.clone().lerp(top,.56); tree.localToWorld(anchor); anchors.push(anchor);
  }
  // Fill the central crown in world space, including the open wedge between the main forks.
  // This volume is independent of the source cards so changing leaf size cannot reopen the gap.
  const point=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  const inverse=tree.matrixWorld.clone().invert();
  for (let i=0;i<fillCount;i++) {
    const angle=random(i * 11 + 1) * Math.PI * 2,z=random(i * 11 + 2) * 2 - 1;
    const radius=Math.cbrt(random(i * 11 + 3)),ring=Math.sqrt(1 - z * z);
    point.set(.4 + Math.cos(angle) * ring * radius * 4.4,9.6 + crownLift + z * radius * 2.6,Math.sin(angle) * ring * radius * 3.8);
    anchors.push(point.clone());
    rotation.setFromEuler(new THREE.Euler(random(i * 11 + 4) * Math.PI,random(i * 11 + 5) * Math.PI * 2,random(i * 11 + 6) * Math.PI * 2));
    scale.setScalar(.42 + random(i * 11 + 7) * .3);
    small.compose(point,rotation,scale); matrix.multiplyMatrices(inverse,small);
    foliage.setMatrixAt(instance,matrix); foliage.setColorAt(instance++,tint.set(palette[Math.floor(random(i * 11 + 8) * palette.length)]));
  }
  // Find underfilled pockets in the lower crown, then grow overlapping leaf clusters.
  // Count nearby leaves first so the extra foliage targets gaps rather than thick areas.
  const cells=new Map<string,number>(),cellSize=1.25;
  for(const anchor of anchors) {
    const key=`${Math.floor(anchor.x/cellSize)}:${Math.floor(anchor.y/cellSize)}:${Math.floor(anchor.z/cellSize)}`;
    cells.set(key,(cells.get(key)||0)+1);
  }
  const pockets:{point:THREE.Vector3;density:number}[]=[];
  for(let x=-5.5;x<=6;x+=1.1) for(let y=7.9;y<=11.6;y+=.85) for(let z=-4.8;z<=4.8;z+=1.1) {
    if(((x-.4)/6)**2+((y-9.6)/2.5)**2+(z/5.2)**2>1) continue;
    const point=new THREE.Vector3(x,y+crownLift,z);
    const cx=Math.floor(point.x/cellSize),cy=Math.floor(point.y/cellSize),cz=Math.floor(point.z/cellSize);
    let density=0;
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) for(let dz=-1;dz<=1;dz++) density+=cells.get(`${cx+dx}:${cy+dy}:${cz+dz}`)||0;
    pockets.push({point,density});
  }
  pockets.sort((a,b)=>a.density-b.density);
  const clusters:THREE.Vector3[]=[];
  for(const pocket of pockets) {
    if(clusters.every(p=>p.distanceToSquared(pocket.point)>.95**2)) clusters.push(pocket.point);
    if(clusters.length===72) break;
  }
  for(let i=0;i<gapCount;i++) {
    const seed=900000+i*13,cluster=clusters[i%clusters.length];
    const angle=random(seed)*Math.PI*2,vertical=random(seed+1)*2-1,r=Math.cbrt(random(seed+2)),ring=Math.sqrt(1-vertical*vertical);
    point.copy(cluster).add(new THREE.Vector3(Math.cos(angle)*ring*r*.85,vertical*r*.65,Math.sin(angle)*ring*r*.85));
    rotation.setFromEuler(new THREE.Euler(random(seed+3)*Math.PI,random(seed+4)*Math.PI*2,random(seed+5)*Math.PI*2));
    scale.setScalar(.42+random(seed+6)*.3); small.compose(point,rotation,scale); matrix.multiplyMatrices(inverse,small);
    foliage.setMatrixAt(instance,matrix); foliage.setColorAt(instance++,tint.set(palette[Math.floor(random(seed+7)*palette.length)]));
  }
  foliage.userData.gapClusters=clusters.length;
  // Grow smaller clusters on the exposed lower forks, below the existing crown fill.
  // Sample actual branches so the new leaves stay attached from every viewing angle.
  const branchVertices=tree.branchesMesh.geometry.attributes.position,forks:THREE.Vector3[]=[];
  tree.branchesMesh.updateWorldMatrix(true,false);
  for(let i=0;i<12000 && forks.length<48;i++) {
    const vertex=Math.floor(random(1300000+i)*branchVertices.count);
    point.fromBufferAttribute(branchVertices,vertex).applyMatrix4(tree.branchesMesh.matrixWorld);
    const radius=Math.hypot(point.x-.4,point.z);
    if(point.y<6.7+crownLift || point.y>9.4+crownLift || radius<1.1 || radius>5.6) continue;
    if(forks.every(p=>p.distanceToSquared(point)>.75**2)) forks.push(point.clone());
  }
  if(!forks.length) forks.push(new THREE.Vector3(.4,7.7+crownLift,0));
  for(let i=0;i<forkCount;i++) {
    const seed=1500000+i*13,cluster=forks[i%forks.length];
    const angle=random(seed)*Math.PI*2,vertical=random(seed+1)*2-1,r=Math.cbrt(random(seed+2));
    const ring=Math.sqrt(1-vertical*vertical);
    point.copy(cluster).add(new THREE.Vector3(Math.cos(angle)*ring*r*.8,.12+vertical*r*.58,Math.sin(angle)*ring*r*.8));
    rotation.setFromEuler(new THREE.Euler(random(seed+3)*Math.PI,random(seed+4)*Math.PI*2,random(seed+5)*Math.PI*2));
    scale.setScalar(.44+random(seed+6)*.25); small.compose(point,rotation,scale); matrix.multiplyMatrices(inverse,small);
    foliage.setMatrixAt(instance,matrix); foliage.setColorAt(instance++,tint.set(palette[Math.floor(random(seed+7)*palette.length)]));
  }
  foliage.userData.forkClusters=forks.length;
  foliage.castShadow=foliage.receiveShadow=true; foliage.frustumCulled=false;
  tree.remove(source); source.geometry.dispose(); (source.material as THREE.Material).dispose(); tree.leavesMesh=foliage; tree.add(foliage);
  return {geometry,texture,anchors};
}

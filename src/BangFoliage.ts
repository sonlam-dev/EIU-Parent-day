import * as THREE from 'three';
import type { BotanicalTree } from './ancientTree';

/** Cupped, pointed blade with a raised central rib and a softly folded edge. */
export function createBangLeafGeometry() {
  const vertices:number[] = [],uvs:number[] = [],indices:number[] = [];
  const rows = 6;
  for (let j = 0; j <= rows; j++) {
    const t=j / rows,width=.38 * Math.pow(Math.sin(Math.PI * t),.85);
    for (let side=-1;side<=1;side++) {
      const x=side * width;
      vertices.push(x,t,Math.sin(t * Math.PI) * .12 - Math.abs(x) * .28 + Math.sin(t * 6) * .012);
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
  gradient.addColorStop(0,'#929e7c'); gradient.addColorStop(.43,'#eef0d6'); gradient.addColorStop(.51,'#fff4d7'); gradient.addColorStop(.59,'#e5eacb'); gradient.addColorStop(1,'#a0ac88');
  ctx.fillStyle=gradient; ctx.fillRect(0,0,512,512);
  // Fine mottling and slightly different vein paths avoid a flat, uniform plastic surface.
  const rand=(i:number) => { const v=Math.sin(i * 127.1 + 39.7) * 43758.5453; return v - Math.floor(v); };
  for (let i=0;i<4000;i++) { ctx.fillStyle=i % 2 ? 'rgba(115,104,66,.025)' : 'rgba(255,255,236,.1)'; ctx.fillRect(rand(i) * 512,rand(i + 800) * 512,1 + rand(i + 900) * 2,1 + rand(i + 1000) * 2); }
  ctx.strokeStyle='#8e8054'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(256,512); ctx.bezierCurveTo(250,350,263,170,256,0); ctx.stroke();
  ctx.strokeStyle='rgba(82,103,51,.65)'; ctx.lineWidth=2.4;
  for (let i=0;i<10;i++) {
    const t=.15 + i * .074,width=.38 * Math.pow(Math.sin(Math.PI * t),.85),y=(1 - t) * 512;
    for (const side of [-1,1]) {
      const endX=256 + side * width / .8 * 512 * .92,endY=y - 42 - rand(i + side + 20) * 15;
      ctx.beginPath(); ctx.moveTo(256,y + 18); ctx.bezierCurveTo(256 + side * 35,y + 6,endX - side * 10,endY + 20,endX,endY); ctx.stroke();
      ctx.lineWidth=1;
      for (let k=1;k<=4;k++) { const f=k / 5,x=THREE.MathUtils.lerp(256,endX,f),yy=THREE.MathUtils.lerp(y + 18,endY,f); ctx.beginPath(); ctx.moveTo(x,yy); ctx.quadraticCurveTo(x + side * 10,yy - 20,x + side * 12,yy - 40); ctx.stroke(); }
      ctx.lineWidth=2.4;
    }
  }
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=8;
  return texture;
}

export function createLeafMaterial(texture:THREE.Texture,time={value:0}) {
  const material=new THREE.MeshPhongMaterial({map:texture,bumpMap:texture,bumpScale:.025,color:'#ffffff',side:THREE.DoubleSide,shininess:7,specular:'#687b43',emissive:'#45602e',emissiveIntensity:.045});
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
  material.customProgramCacheKey=() => 'botanical-leaf-breeze-v4';
  return material;
}

export function installBangFoliage(tree:BotanicalTree,_crownLift=0) {
  const geometry=createBangLeafGeometry(),texture=createVeinTexture(),time={value:0};
  const foliage=new THREE.InstancedMesh(geometry,createLeafMaterial(texture,time),tree.shoots.length);
  const palette=['#326c55','#55865c','#7aab53','#a4c64d','#c1d877','#4d896d','#d1df8b'];
  const dummy=new THREE.Object3D(),tint=new THREE.Color(),up=new THREE.Vector3(0,1,0);
  tree.shoots.forEach((shoot,i)=>{
    dummy.position.copy(shoot.point);dummy.quaternion.setFromUnitVectors(up,shoot.direction);
    // Rotate the cupped blade about its own stalk for volume from all orbit angles.
    dummy.rotateY(i*2.39996);dummy.scale.setScalar(shoot.size);dummy.updateMatrix();
    foliage.setMatrixAt(i,dummy.matrix);foliage.setColorAt(i,tint.set(palette[i%palette.length]));
  });
  foliage.name='Veined botanical leaves';foliage.castShadow=true;foliage.receiveShadow=true;
  foliage.computeBoundingSphere();tree.add(foliage);
  const anchors=tree.branchAnchors.map(point=>tree.localToWorld(point.clone()));
  return {geometry,texture,anchors,foliage,update(seconds:number){time.value=seconds;}};
}

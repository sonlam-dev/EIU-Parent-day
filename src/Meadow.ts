import * as THREE from 'three';

export function terrainHeight(x:number,z:number) {
  const near=Math.min(1,Math.hypot(x,z) / 22);
  return -.12 + near * (Math.sin(x * .085) * Math.cos(z * .055) * .8 + Math.sin(z * .035) * .7);
}
const random=(n:number) => { const v=Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

function soilTexture() {
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d')!;
  // Neutral fine texture lets the terrain's green/earth patches supply the colour.
  ctx.fillStyle='#d6d3b7'; ctx.fillRect(0,0,512,512);
  const palette=['#a4a589','#b6b39a','#e1dcc2','#c6c6a4','#e7dfc7','#a9ad8a'];
  for (let i=0;i<18000;i++) {
    ctx.globalAlpha=.16 + random(i + 7) * .27; ctx.fillStyle=palette[i % palette.length];
    const x=random(i * 3) * 512,y=random(i * 3 + 1) * 512,size=.5 + random(i * 3 + 2) * 3;
    ctx.fillRect(x,y,size,size * .55);
  }
  ctx.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping; texture.repeat.set(100,100); texture.anisotropy=4;
  return texture;
}

/** Continuous green meadow, with grass extending to the horizon. */
export function createMeadow(scene:THREE.Scene,reducedMotion:boolean) {
  const groundGeometry=new THREE.PlaneGeometry(1200,1200,300,300); groundGeometry.rotateX(-Math.PI / 2);
  const p=groundGeometry.attributes.position,groundColors=new Float32Array(p.count * 3),color=new THREE.Color();
  const green=new THREE.Color('#819b57'),variation=new THREE.Color('#6e8c4a');
  for (let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i); p.setY(i,terrainHeight(x,z));
    const mottling=Math.sin(x*.19+Math.sin(z*.14)*1.7)*Math.cos(z*.16-x*.045);
    color.copy(green).lerp(variation,THREE.MathUtils.smoothstep(mottling,-.8,.8)*.55);
    color.multiplyScalar(.92+.12*(Math.sin(x*.41+z*.27)*.5+.5)); color.toArray(groundColors,i * 3);
  }
  groundGeometry.setAttribute('color',new THREE.BufferAttribute(groundColors,3)); groundGeometry.computeVertexNormals();
  const ground=new THREE.Mesh(groundGeometry,new THREE.MeshLambertMaterial({map:soilTexture(),vertexColors:true}));
  ground.name='Continuous green meadow'; ground.receiveShadow=true; scene.add(ground);
  const makeTuft=(blades:number) => {
    const vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
    for (let blade=0;blade<blades;blade++) {
      const angle=blade * 2.1,c=Math.cos(angle),s=Math.sin(angle);
      for (let row=0;row<=2;row++) {
        const t=row / 2,width=.027 * (1 - t),bend=t * t * .045;
        for (const side of [-1,1]) { const x=side * width; vertices.push(x * c + bend * s,t * (.28 - blade * .035),-x * s + bend * c); uvs.push((side+1) / 2,t); }
        if (row<2) { const n=blade * 6 + row * 2; indices.push(n,n+1,n+2,n+1,n+3,n+2); }
      }
    }
    const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
  };
  const nearGeometry=makeTuft(2),farGeometry=makeTuft(1),time={value:0};
  const material=new THREE.MeshLambertMaterial({side:THREE.DoubleSide,color:'#d5dfb2'});
  material.onBeforeCompile=shader => {
    shader.uniforms.uMeadowTime=time;
    shader.vertexShader=`uniform float uMeadowTime; varying float vBladeHeight;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      vBladeHeight=uv.y;
      vec3 origin=instanceMatrix[3].xyz;
      float wind=sin(origin.x * .24 + origin.z * .18 + uMeadowTime * 1.3);
      transformed.x += wind * .055 * uv.y * uv.y;
    `);
    shader.fragmentShader=`varying float vBladeHeight;\n${shader.fragmentShader}`.replace('#include <color_fragment>',`
      #include <color_fragment>
      diffuseColor.rgb *= mix(vec3(.48,.52,.28),vec3(1.05,1.08,.8),vBladeHeight);
    `);
  };
  material.customProgramCacheKey=() => 'short-earth-grass-v1';
  const dummy=new THREE.Object3D(),patches:THREE.InstancedMesh[]=[];
  const tiles:{px:number;pz:number;size:number;near:boolean;count:number}[]=[];
  for (let px=-3;px<=3;px++) for (let pz=-3;pz<=3;pz++) {
    const near=Math.abs(px)<=1 && Math.abs(pz)<=1;
    tiles.push({px,pz,size:24,near,count:near ? 12000 : 4000});
  }
  for (let px=-2;px<=2;px++) for (let pz=-2;pz<=2;pz++) {
    if (Math.abs(px)<=1 && Math.abs(pz)<=1) continue;
    tiles.push({px,pz,size:56,near:false,count:7000});
  }
  for (const {px,pz,size,near,count} of tiles) {
    const mesh=new THREE.InstancedMesh(near ? nearGeometry : farGeometry,material,count);
    const seed=(px+7) * 30000 + (pz+7) * 1100 + size * 7919; let written=0;
    for (let i=0;i<count;i++) {
      const x=px * size + (random(seed+i)-.5) * size,z=pz * size + (random(seed+i+400)-.5) * size;
      const radius=Math.hypot(x,z),patch=Math.sin(x * .55 + Math.sin(z * .31) * 2) + Math.cos(z * .48 - x * .15);
      if (radius<2.1 || patch < -1.8) continue;
      dummy.position.set(x,terrainHeight(x,z),z); dummy.rotation.set(0,random(seed+i+800) * Math.PI * 2,0);
      dummy.scale.set((near ? 1 : 1.8) + random(i+5) * .9,1.2 + random(seed+i+1200) * 1.9,1); dummy.updateMatrix(); mesh.setMatrixAt(written,dummy.matrix);
      mesh.setColorAt(written++,color.setHSL(.205 + random(i+seed+3) * .06,.3 + random(i+7) * .16,.34 + random(i+11) * .14));
    }
    if (!written) { mesh.dispose(); continue; }
    mesh.count=written; mesh.name='Wild grass clumps'; mesh.computeBoundingSphere(); scene.add(mesh); patches.push(mesh);
  }
  return {update(elapsed:number){time.value=reducedMotion ? 0 : elapsed;},patches};
}

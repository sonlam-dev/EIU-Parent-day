import * as THREE from 'three';
import { terrainHeight } from './Meadow.ts';
import type { FlowerPoint } from './FlowerLayout';

/** Low morning sun, soft light shafts and a small flock well beyond the tree. */
export function createMorningSky(scene:THREE.Scene,sunDirection:THREE.Vector3,reducedMotion:boolean,flowerPatches:FlowerPoint[]=[]) {
  if(sunDirection.lengthSq()<.0001) sunDirection.set(-.95,.28,-1).normalize();
  const group=new THREE.Group(); group.name='Early morning atmosphere'; scene.add(group);
  const sunPosition=sunDirection.clone().multiplyScalar(220);
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!,glow=ctx.createRadialGradient(128,128,0,128,128,128);
  glow.addColorStop(0,'rgba(255,253,227,1)'); glow.addColorStop(.075,'rgba(255,247,205,1)');
  glow.addColorStop(.1,'rgba(255,232,169,.55)'); glow.addColorStop(.36,'rgba(255,224,164,.12)'); glow.addColorStop(1,'rgba(255,224,164,0)');
  ctx.fillStyle=glow; ctx.fillRect(0,0,256,256);
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
  sun.name='Morning sun and halo'; sun.position.copy(sunPosition); sun.scale.set(34,34,1); group.add(sun);

  const vertices=[
    0,0,.24, -.12,0,-.15, .12,0,-.15,
    -.06,0,.08, -.8,.1,-.02, -.35,0,-.2,
    .06,0,.08, .35,0,-.2, .8,.1,-.02,
  ];
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  const time={value:0},material=new THREE.MeshBasicMaterial({color:'#525e58',side:THREE.DoubleSide,fog:false});
  material.onBeforeCompile=shader => {
    shader.uniforms.uBirdTime=time;
    shader.vertexShader=`uniform float uBirdTime; attribute float aBirdPhase;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      transformed.y += sin(uBirdTime*4.2+aBirdPhase)*abs(position.x)*.5;
    `);
  };
  material.customProgramCacheKey=() => 'distant-morning-flock-v1';
  // Three staggered flocks overlap at the screen edges for an uninterrupted loop.
  const flockSize=18,flockCount=3,count=flockSize*flockCount,phases=new Float32Array(count),birds=new THREE.InstancedMesh(geometry,material,count);
  const dummy=new THREE.Object3D(),horizontal=new THREE.Vector3(),right=new THREE.Vector3(),worldUp=new THREE.Vector3(0,1,0);
  birds.name='Distant circling birds'; birds.frustumCulled=false; birds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<count;i++) phases[i]=i*2.399963;
  geometry.setAttribute('aBirdPhase',new THREE.InstancedBufferAttribute(phases,1)); group.add(birds);
  const beamMaterial=new THREE.MeshBasicMaterial({color:'#fff2c6',transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  beamMaterial.onBeforeCompile=shader => {
    shader.vertexShader=`varying vec2 vBeamUv;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`#include <begin_vertex>\nvBeamUv=uv; transformed.x *= mix(1.0,.22,uv.y);`);
    shader.fragmentShader=`varying vec2 vBeamUv;\n${shader.fragmentShader}`.replace('#include <color_fragment>',`#include <color_fragment>\ndiffuseColor.a *= pow(max(0.0,sin(vBeamUv.x*3.14159265)),2.0)*pow(max(0.0,sin(vBeamUv.y*3.14159265)),.8);`);
  };
  beamMaterial.customProgramCacheKey=()=> 'fine-flower-sunbeams-v1';
  const beamCount=flowerPatches.length*4,beams=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),beamMaterial,beamCount);
  beams.name='Fine sun rays over flower patches'; beams.frustumCulled=false; beams.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(beams);
  const beamRight=new THREE.Vector3(),beamNormal=new THREE.Vector3(),viewDirection=new THREE.Vector3(),basis=new THREE.Matrix4(),target=new THREE.Vector3();
  function update(elapsed:number,camera:THREE.Camera) {
    const t=reducedMotion ? 0 : elapsed; time.value=t;
    horizontal.set(-camera.position.x,0,-camera.position.z).normalize();
    if(horizontal.lengthSq()<.5) horizontal.set(0,0,-1);
    right.crossVectors(horizontal,worldUp).normalize();
    // A fixed world-space sun lets highlights and shadows change naturally as we orbit.
    sunPosition.copy(sunDirection).multiplyScalar(220); sun.position.copy(sunPosition);
    const halfView=camera instanceof THREE.PerspectiveCamera ? Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*camera.aspect/camera.zoom : .6;
    for(let i=0;i<count;i++) {
      const flock=Math.floor(i/flockSize),bird=i%flockSize,row=Math.ceil(bird/2),wing=bird%2 ? -1 : 1,phase=phases[i];
      const cycle=(t/45+flock/flockCount)%1;
      const depth=130+flock*12+row*.8,span=halfView*depth*1.5+10;
      const traverse=(cycle*2-1)*span+wing*row*1.8;
      dummy.position.copy(horizontal).multiplyScalar(depth).addScaledVector(right,traverse);
      dummy.position.y=24+flock*3+row*.15+Math.sin(t*.31+phase)*.55;
      dummy.rotation.set(.12,Math.atan2(right.x,right.z),Math.sin(t*.27+phase)*.13);
      dummy.scale.setScalar(1.3+(i%4)*.14); dummy.updateMatrix(); birds.setMatrixAt(i,dummy.matrix);
    }
    birds.instanceMatrix.needsUpdate=true;
    camera.getWorldDirection(viewDirection);
    beamRight.crossVectors(viewDirection,sunDirection).normalize();
    if(beamRight.lengthSq()<.5) beamRight.copy(right);
    beamNormal.crossVectors(beamRight,sunDirection).normalize(); basis.makeBasis(beamRight,sunDirection,beamNormal);
    for(let i=0;i<beamCount;i++) {
      const patch=flowerPatches[Math.floor(i/4)],offset=i%4,angle=i*2.399963;
      target.set(patch.x+Math.cos(angle)*(.3+offset*.25),0,patch.z+Math.sin(angle)*(.3+offset*.25));
      target.y=terrainHeight(target.x,target.z)+.65;
      const length=(4.5+(i%7)*.4)/sunDirection.y;
      dummy.position.copy(target).addScaledVector(sunDirection,length*.5); dummy.quaternion.setFromRotationMatrix(basis);
      dummy.scale.set(.12+(i%4)*.065,length,1); dummy.updateMatrix(); beams.setMatrixAt(i,dummy.matrix);
    }
    beams.instanceMatrix.needsUpdate=true;
  }
  return {update};
}

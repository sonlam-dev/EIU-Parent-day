import * as THREE from 'three';

/** Low morning sun, soft light shafts and a small flock well beyond the tree. */
export function createMorningSky(scene:THREE.Scene,sunDirection:THREE.Vector3,reducedMotion:boolean) {
  const group=new THREE.Group(); group.name='Early morning atmosphere'; scene.add(group);
  const sunPosition=sunDirection.clone().multiplyScalar(220);
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!,glow=ctx.createRadialGradient(128,128,0,128,128,128);
  glow.addColorStop(0,'rgba(255,253,227,1)'); glow.addColorStop(.075,'rgba(255,247,205,1)');
  glow.addColorStop(.1,'rgba(255,232,169,.55)'); glow.addColorStop(.36,'rgba(255,224,164,.12)'); glow.addColorStop(1,'rgba(255,224,164,0)');
  ctx.fillStyle=glow; ctx.fillRect(0,0,256,256);
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,fog:false,toneMapped:false}));
  sun.name='Morning sun and halo'; sun.position.copy(sunPosition); sun.scale.set(43,43,1); group.add(sun);

  const raysCanvas=document.createElement('canvas'); raysCanvas.width=256; raysCanvas.height=512;
  const raysContext=raysCanvas.getContext('2d')!,fade=raysContext.createLinearGradient(0,0,0,512);
  fade.addColorStop(0,'rgba(255,235,188,0)'); fade.addColorStop(.15,'rgba(255,235,188,.14)');
  fade.addColorStop(.55,'rgba(255,239,199,.055)'); fade.addColorStop(1,'rgba(255,239,199,0)');
  for (let i=0;i<7;i++) {
    const x=10+i*36;
    raysContext.fillStyle=fade; raysContext.beginPath(); raysContext.moveTo(128,0);
    raysContext.lineTo(x+28,512); raysContext.lineTo(x,512); raysContext.closePath(); raysContext.fill();
  }
  const raysTexture=new THREE.CanvasTexture(raysCanvas); raysTexture.colorSpace=THREE.SRGBColorSpace;
  const rays=new THREE.Sprite(new THREE.SpriteMaterial({map:raysTexture,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  rays.name='Soft morning sun rays'; rays.scale.set(115,140,1); group.add(rays);

  const vertices=[
    0,0,.24, -.12,0,-.15, .12,0,-.15,
    -.06,0,.08, -.8,.1,-.02, -.35,0,-.2,
    .06,0,.08, .35,0,-.2, .8,.1,-.02,
  ];
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  const time={value:0},material=new THREE.MeshBasicMaterial({color:'#525e58',side:THREE.DoubleSide});
  material.onBeforeCompile=shader => {
    shader.uniforms.uBirdTime=time;
    shader.vertexShader=`uniform float uBirdTime; attribute float aBirdPhase;\n${shader.vertexShader}`.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      transformed.y += sin(uBirdTime*4.2+aBirdPhase)*abs(position.x)*.5;
    `);
  };
  material.customProgramCacheKey=() => 'distant-morning-flock-v1';
  const count=24,phases=new Float32Array(count),birds=new THREE.InstancedMesh(geometry,material,count);
  const dummy=new THREE.Object3D(),up=new THREE.Vector3();
  birds.name='Distant circling birds'; birds.frustumCulled=false; birds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for(let i=0;i<count;i++) phases[i]=i*2.399963;
  geometry.setAttribute('aBirdPhase',new THREE.InstancedBufferAttribute(phases,1)); group.add(birds);
  function update(elapsed:number,camera:THREE.Camera) {
    const t=reducedMotion ? 0 : elapsed; time.value=t;
    up.set(0,1,0).applyQuaternion(camera.quaternion);
    rays.position.copy(sunPosition).addScaledVector(up,-70);
    const angle=t*.024;
    for(let i=0;i<count;i++) {
      const wing=i%2 ? -1 : 1,row=Math.ceil(i/2),phase=phases[i];
      const x=Math.sin(angle)*34+wing*row*1.15,z=Math.cos(angle)*15-row*.9;
      dummy.position.set(-35+x,25+Math.sin(t*.31+phase)*.65+row*.17,-115+z);
      dummy.rotation.set(.12,angle+Math.PI/2,Math.sin(t*.27+phase)*.13);
      dummy.scale.setScalar(.65+(i%4)*.07); dummy.updateMatrix(); birds.setMatrixAt(i,dummy.matrix);
    }
    birds.instanceMatrix.needsUpdate=true;
  }
  return {update};
}

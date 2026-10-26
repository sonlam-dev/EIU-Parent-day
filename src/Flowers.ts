import * as THREE from 'three';
import { terrainHeight } from './Meadow.ts';
import { createFlowerLayout,flowerRandom } from './FlowerLayout.ts';

/** Yellow cosmos: separate stems, pointed leaves, cupped petals and raised orange disks. */
export function createYellowFlowers(scene: THREE.Scene,reducedMotion: boolean) {
  const layout=createFlowerLayout(),count=layout.positions.length,rand=flowerRandom;
  const shape = new THREE.Shape(); shape.moveTo(0,0); shape.bezierCurveTo(-.13,.11,-.17,.32,-.08,.41); shape.quadraticCurveTo(0,.37,.08,.41); shape.bezierCurveTo(.17,.32,.13,.11,0,0);
  const petalGeometry = new THREE.ShapeGeometry(shape,3); const pp = petalGeometry.attributes.position;
  for (let i = 0; i < pp.count; i++) pp.setZ(i,Math.pow(pp.getY(i),2) * .65); petalGeometry.computeVertexNormals();
  const petalMaterial = new THREE.MeshStandardMaterial({color:'#ffc61e',roughness:.74,side:THREE.DoubleSide,emissive:'#9b5a00',emissiveIntensity:.1});
  const petals = new THREE.InstancedMesh(petalGeometry,petalMaterial,count * 8);
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(.085,8,5),new THREE.MeshStandardMaterial({color:'#c88114',roughness:.95}),count);
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(.009,.015,1,5),new THREE.MeshStandardMaterial({color:'#527b30',roughness:1}),count);
  const leafShape = new THREE.Shape(); leafShape.moveTo(0,0); leafShape.quadraticCurveTo(-.08,.22,0,.5); leafShape.quadraticCurveTo(.08,.22,0,0);
  const leaves = new THREE.InstancedMesh(new THREE.ShapeGeometry(leafShape,3),new THREE.MeshStandardMaterial({color:'#668b34',roughness:1,side:THREE.DoubleSide}),count * 2);
  const dummy = new THREE.Object3D(),orientation = new THREE.Object3D(),base = new THREE.Vector3(),color = new THREE.Color();
  const flowers: {x:number;z:number;y:number;h:number;s:number;tilt:number;phase:number}[] = [];
  for (let i = 0; i < count; i++) {
    const {x,z}=layout.positions[i],r=Math.hypot(x,z);
    const patch=.9 + .1*Math.sin(x*.23+Math.cos(z*.18));
    const taper=1-THREE.MathUtils.smoothstep(r,24,42)*.75;
    flowers.push({x,z,y:terrainHeight(x,z),h:(1.05 + rand(i + 13) * .85)*patch*taper,s:(.55 + rand(i + 74) * .6)*taper,tilt:(rand(i + 99) - .5) * .5,phase:rand(i + 41) * Math.PI * 2});
    petals.setColorAt(i * 8,color.setHSL(.12 + rand(i) * .025,.85,.55 + rand(i + 8) * .08));
    for (let j = 1; j < 8; j++) petals.setColorAt(i * 8 + j,color);
  }
  function update(time: number) {
    flowers.forEach((f,i) => {
      const sway = reducedMotion ? 0 : Math.sin(time * .9 + f.x * .13 + f.z * .1) * .045;
      base.set(f.x + sway * f.h,f.y + f.h,f.z);
      dummy.position.set(f.x + sway * f.h * .5,f.y + f.h * .5,f.z); dummy.rotation.set(0,0,-sway); dummy.scale.set(1,f.h,1); dummy.updateMatrix(); stems.setMatrixAt(i,dummy.matrix);
      orientation.rotation.set(-Math.PI / 2 + .2 + f.tilt,0,f.phase);
      for (let j = 0; j < 8; j++) {
        dummy.position.copy(base); dummy.quaternion.copy(orientation.quaternion); dummy.rotateZ(j / 8 * Math.PI * 2); dummy.scale.setScalar(f.s); dummy.updateMatrix(); petals.setMatrixAt(i * 8 + j,dummy.matrix);
      }
      dummy.position.copy(base).add(new THREE.Vector3(0,.025,0)); dummy.quaternion.copy(orientation.quaternion); dummy.scale.set(f.s,f.s,.48 * f.s); dummy.updateMatrix(); centers.setMatrixAt(i,dummy.matrix);
      for (let j = 0; j < 2; j++) { dummy.position.set(f.x,f.y + f.h * (.3 + j * .25),f.z); dummy.rotation.set(.5,j * Math.PI + f.phase,(j ? -1 : 1) * .8); dummy.scale.setScalar(.55); dummy.updateMatrix(); leaves.setMatrixAt(i * 2 + j,dummy.matrix); }
    });
    for (const mesh of [petals,centers,stems,leaves]) mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);
  for (const mesh of [petals,centers,stems,leaves]) { mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh); }
  const wind={value:0};
  for (const mesh of [petals,centers,stems,leaves]) {
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage); mesh.frustumCulled=true; mesh.receiveShadow=false; mesh.computeBoundingSphere();
    const material=mesh.material as THREE.MeshStandardMaterial;
    material.onBeforeCompile=shader => {
      shader.uniforms.uFlowerTime=wind;
      shader.vertexShader=`uniform float uFlowerTime;\n${shader.vertexShader}`.replace('#include <project_vertex>',`
        vec4 flowerWorld=modelMatrix * instanceMatrix * vec4(transformed,1.0);
        float bend=max(0.0,flowerWorld.y) * .04;
        flowerWorld.x += sin(uFlowerTime * 1.1 + flowerWorld.x * .13 + flowerWorld.z * .1) * bend;
        vec4 mvPosition=viewMatrix * flowerWorld;
        gl_Position=projectionMatrix * mvPosition;
      `);
    };
    material.customProgramCacheKey=() => 'sparse-wildflower-wind-v1';
  }
  return {lightTargets:layout.patches,update(time:number){wind.value=reducedMotion ? 0 : time;}};
}

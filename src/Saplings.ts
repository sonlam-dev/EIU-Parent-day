import * as THREE from 'three';
import { terrainHeight } from './Meadow.ts';
import { createLeafMaterial } from './BangFoliage.ts';

export function createSaplings(scene:THREE.Scene,leafGeometry:THREE.BufferGeometry,texture:THREE.Texture,reducedMotion:boolean) {
  const positions=[[-11,-3],[-8,-12],[1,-16],[11,-9],[13,3],[-12,9],[10,13]];
  const random=(n:number) => THREE.MathUtils.seededRandom(923 + n);
  const time={value:0},material=createLeafMaterial(texture,time);
  const leaves=new THREE.InstancedMesh(leafGeometry,material,positions.length * 320);
  const branches=new THREE.InstancedMesh(new THREE.CylinderGeometry(.65,1,1,6),new THREE.MeshLambertMaterial({color:'#6f563e'}),positions.length * 5);
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),color=new THREE.Color();
  positions.forEach(([x,z],tree) => {
    const y=terrainHeight(x,z),height=1.7 + random(tree * 13) * 1.5;
    for (let branch=0;branch<5;branch++) {
      const angle=branch * 2.4 + tree;
      start.set(x,y + (branch ? height * .48 : 0),z);
      end.set(x + (branch ? Math.cos(angle) * height * .28 : .08),y + height * (branch ? .83 : .9),z + (branch ? Math.sin(angle) * height * .28 : 0));
      direction.subVectors(end,start); dummy.position.copy(start).add(end).multiplyScalar(.5); dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());
      const thickness=height * (branch ? .019 : .043);
      dummy.scale.set(thickness,direction.length(),thickness); dummy.updateMatrix(); branches.setMatrixAt(tree * 5 + branch,dummy.matrix);
    }
    for (let i=0;i<320;i++) {
      const seed=tree * 4000 + i * 8,angle=random(seed) * Math.PI * 2,vertical=random(seed+1) * 2 - 1;
      const radius=Math.cbrt(random(seed+2)),ring=Math.sqrt(1 - vertical * vertical);
      dummy.position.set(x + Math.cos(angle) * ring * radius * height * .39,y + height * .9 + vertical * radius * height * .31,z + Math.sin(angle) * ring * radius * height * .35);
      dummy.rotation.set(random(seed+3) * Math.PI,random(seed+4) * Math.PI * 2,random(seed+5) * Math.PI * 2);
      dummy.scale.setScalar(.23 + random(seed+6) * .16); dummy.updateMatrix(); leaves.setMatrixAt(tree * 320 + i,dummy.matrix);
      leaves.setColorAt(tree * 320 + i,color.setHSL(.24 + random(seed+7) * .035,.3,.25 + random(seed+8) * .14));
    }
  });
  leaves.name='Seven young trees foliage'; branches.name='Young tree trunks and branches';
  leaves.castShadow=false; branches.castShadow=true;
  leaves.computeBoundingSphere(); branches.computeBoundingSphere(); scene.add(leaves,branches);
  return {update(elapsed:number){time.value=reducedMotion ? 0 : elapsed;}};
}

import * as THREE from 'three';
import { Tree,TreePreset } from '@dgreenheck/ez-tree';

export function createAncientOak() {
  const oak = new Tree(); oak.options.copy(TreePreset['Oak Large'] as typeof oak.options);
  oak.options.seed = 23399;
  oak.options.branch.length = {0:43,1:30,2:18,3:8};
  oak.options.branch.radius = {0:5.1,1:.63,2:.62,3:.57};
  oak.options.branch.start = {1:.68,2:.35,3:.28};
  oak.options.branch.angle = {1:58,2:46,3:32};
  oak.options.branch.gnarliness = {0:.022,1:.085,2:.07,3:.05};
  oak.options.branch.force.strength = .012;
  oak.options.branch.segments = {0:32,1:12,2:7,3:5};
  oak.options.branch.sections = {0:48,1:18,2:10,3:6};
  oak.options.leaves.count = 42; oak.options.leaves.size = 7.2; oak.options.leaves.sizeVariance = .38; oak.options.leaves.tint = 0xc7dca6;
  oak.generate();
  // The denser crown exceeds the library's 16-bit foliage index range. Preserve all leaf faces.
  if (oak.leavesMesh.geometry.attributes.position.count > 65535) {
    oak.leavesMesh.geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(oak.leaves.indices),1));
  }
  // Work around each trunk ring's actual center so the bark follows its natural curve.
  const geometry = oak.branchesMesh.geometry,p = geometry.attributes.position,uv=geometry.attributes.uv;
  const barkColors=new Float32Array(p.count*3).fill(1),barkTint=new THREE.Color();
  const ringSize = oak.options.branch.segments[0] + 1;
  for (let ring = 0; ring <= oak.options.branch.sections[0]; ring++) {
    const center = new THREE.Vector3();
    for (let j = 0; j < ringSize - 1; j++) center.add(new THREE.Vector3().fromBufferAttribute(p,ring * ringSize + j));
    center.multiplyScalar(1 / (ringSize - 1));
    for (let j = 0; j < ringSize; j++) {
      const i = ring * ringSize + j,x = p.getX(i) - center.x,z = p.getZ(i) - center.z,y = center.y;
      const angle = Math.atan2(z,x);
      const flare = Math.exp(-Math.max(0,y) * .19) * (.28 + .09 * Math.sin(angle * 5 + .6));
      const grooves = .038 * Math.sin(angle * 7 + y * .07 + .65 * Math.sin(angle * 3 - y * .08)) + .019 * Math.sin(angle * 11 - y * .13) + .008 * Math.sin(angle * 15 + y * .3);
      const knot = .15 * Math.exp(-Math.pow((y - 15) / 3.8,2)) * Math.exp(-Math.pow(Math.atan2(Math.sin(angle - .7),Math.cos(angle - .7)) / .65,2))
        + .11 * Math.exp(-Math.pow((y - 27) / 4,2)) * Math.exp(-Math.pow(Math.atan2(Math.sin(angle + 1.8),Math.cos(angle + 1.8)) / .7,2));
      const scale = 1 + flare + grooves + knot;
      p.setXYZ(i,center.x + x * scale,p.getY(i),center.z + z * scale);
      // Continuous vertical grain avoids a repeated horizontal seam at every ring.
      uv.setY(i,y/9);
      const valley=THREE.MathUtils.smoothstep(-grooves,-.015,.045);
      barkTint.set('#d9c4ae').lerp(new THREE.Color('#594638'),valley*.4);
      barkTint.lerp(new THREE.Color('#807653'),Math.exp(-Math.max(0,y)*.16)*(.04+.07*(.5+.5*Math.sin(angle*3))));
      barkTint.toArray(barkColors,i*3);
    }
  }
  // Lift a compact, deep crown above a clear lower trunk. The shared warp keeps all joints attached.
  for (const mesh of [oak.branchesMesh,oak.leavesMesh]) {
    const vertices = mesh.geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i),y = vertices.getY(i),z = vertices.getZ(i);
      const bendX = 3.2 * Math.sin(y * .065) + 1.35 * (1 - Math.cos(y * .045));
      const bendZ = 1.5 * Math.sin(y * .09) - .8 * Math.sin(y * .037);
      vertices.setXYZ(i,x + bendX,y <= 30 ? y : 30 + (y - 30) * .56,z + bendZ);
    }
    mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
  }
  const bounds = new THREE.Box3().setFromObject(oak),size = bounds.getSize(new THREE.Vector3());
  const height = 13.2,horizontalScale = height * 1.48 / Math.max(size.x,size.z);
  oak.scale.set(horizontalScale,height / size.y,horizontalScale); oak.position.y = -bounds.min.y * oak.scale.y; oak.updateMatrixWorld(true);
  // Lengthen the lower trunk without stretching the crown, bark width or roots.
  // Apply the same continuous warp to branches and source foliage at every joint.
  const trunkHeight=30 * oak.scale.y,crownLift=trunkHeight * .5;
  for (const mesh of [oak.branchesMesh,oak.leavesMesh]) {
    const vertices=mesh.geometry.attributes.position;
    for (let i=0;i<vertices.count;i++) {
      const worldY=vertices.getY(i)*oak.scale.y+oak.position.y;
      const lift=THREE.MathUtils.clamp(worldY,0,trunkHeight)*.5;
      vertices.setY(i,vertices.getY(i)+lift/oak.scale.y);
    }
    vertices.needsUpdate=true;
    mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingBox(); mesh.geometry.computeBoundingSphere();
  }
  const bark = oak.branchesMesh.material as THREE.MeshPhongMaterial;
  geometry.setAttribute('color',new THREE.BufferAttribute(barkColors,3));
  // The library's dark colour map multiplied by brown tint crushed the trunk to black.
  // Use the brown palette directly; normal mapping and geometry retain the bark grain.
  bark.map=null; bark.aoMapIntensity=.25;
  bark.vertexColors=true; bark.color.set('#8d715b'); bark.normalScale.set(.65,.65);
  bark.shininess=1; bark.specular.set('#2b221a');
  // A small indirect-light floor keeps bark readable beneath the dense crown.
  bark.emissive.set('#6b503c'); bark.emissiveIntensity=.14; bark.needsUpdate=true;
  oak.branchesMesh.castShadow = oak.branchesMesh.receiveShadow = true;
  oak.leavesMesh.castShadow = oak.leavesMesh.receiveShadow = true;
  const roots = new THREE.Group(); roots.name = 'Ancient oak exposed roots';
  const rootAngles = [.08,.91,1.72,2.83,3.54,4.58,5.63];
  for (let i = 0; i < rootAngles.length; i++) {
    const a = rootAngles[i],length = 2.65 + Math.sin(i * 3.7) * .7;
    const upper = 1.05 + Math.sin(i * 2.3) * .3,curveAngle = .08 + Math.sin(i * 1.7) * .12;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * .42,upper,Math.sin(a) * .42),
      new THREE.Vector3(Math.cos(a + curveAngle) * 1.1,.3 + upper * .1,Math.sin(a + curveAngle) * 1.1),
      new THREE.Vector3(Math.cos(a - curveAngle) * length * .72,.01,Math.sin(a - curveAngle) * length * .72),
      new THREE.Vector3(Math.cos(a + curveAngle) * length,-.22,Math.sin(a + curveAngle) * length),
    ]);
    const g = new THREE.TubeGeometry(curve,18,1,10,false),v = g.attributes.position;
    // The shared bark material uses vertex colours on both the trunk and the roots.
    const rootColors=new Float32Array(v.count*3);
    for (let j = 0; j < v.count; j++) {
      const t = Math.floor(j / 11) / 18,center = curve.getPointAt(t),radius = (.46 + Math.sin(i * 2.1) * .08) * Math.pow(1 - t,1.6) + .02;
      v.setXYZ(j,center.x + (v.getX(j) - center.x) * radius,center.y + (v.getY(j) - center.y) * radius * .65,center.z + (v.getZ(j) - center.z) * radius);
      const groove=.2+.12*Math.sin((j%11)/10*Math.PI*6+t*2+i);
      barkTint.set('#d9c4ae').lerp(new THREE.Color('#594638'),groove);
      barkTint.lerp(new THREE.Color('#807653'),.07);
      barkTint.toArray(rootColors,j*3);
    }
    g.setAttribute('color',new THREE.BufferAttribute(rootColors,3)); g.computeVertexNormals();
    const root = new THREE.Mesh(g,bark); root.castShadow = root.receiveShadow = true; roots.add(root);
  }
  return {oak,roots,crownLift};
}

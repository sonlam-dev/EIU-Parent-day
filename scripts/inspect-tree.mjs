// Geometry QA only: provide inert image elements for Three.js's TextureLoader in Node.
globalThis.document = { createElementNS: () => ({ addEventListener(){}, removeEventListener(){}, set src(_url){}, get src(){ return ''; } }) };
// The texture is drawn by the browser; inert 2D methods let this script inspect geometry only.
globalThis.document.createElement = () => ({width:512,height:512,getContext:() => new Proxy({createLinearGradient:() => ({addColorStop(){}})}, {get:(target,key) => target[key] || (() => {}),set:(target,key,value) => {target[key]=value;return true;}})});
const THREE = await import('three');
const {createAncientOak} = await import('../src/ancientTree.ts');
const {oak,roots,crownLift} = createAncientOak();
const {installBangFoliage} = await import('../src/BangFoliage.ts');
installBangFoliage(oak,crownLift);
const bounds = new THREE.Box3().setFromObject(oak),size = bounds.getSize(new THREE.Vector3());
oak.updateMatrixWorld(true);
const camera = new THREE.PerspectiveCamera(38,16 / 9,.1,400); camera.position.set(21,11,34); camera.lookAt(0,7,0); camera.setViewOffset(1920,1080,1920 * .11,0,1920,1080); camera.updateMatrixWorld(true);
let minX=1,maxX=-1,minY=1,maxY=-1;
for (const mesh of [oak.branchesMesh,oak.leavesMesh]) {
  const p=mesh.geometry.attributes.position;
  if (mesh.geometry.index?.array instanceof Uint16Array && p.count > 65535) throw Error('Geometry exceeds its 16-bit index capacity');
  const instances = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
  const matrix = new THREE.Matrix4();
  for (let instance=0;instance<instances;instance++) {
    if (mesh instanceof THREE.InstancedMesh) mesh.getMatrixAt(instance,matrix); else matrix.identity();
    for (let i=0;i<p.count;i++) { const world=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix); mesh.localToWorld(world); world.project(camera); minX=Math.min(minX,world.x); maxX=Math.max(maxX,world.x); minY=Math.min(minY,world.y); maxY=Math.max(maxY,world.y); if (![world.x,world.y,world.z].every(Number.isFinite)) throw Error('Invalid vertex'); }
  }
}
if (minY < -1 || maxY > 1) throw Error('Tree is vertically cropped');
console.log(JSON.stringify({height:size.y,width:size.x,treeCount:1,exposedRoots:roots.children.length,broadLeaves:oak.leavesMesh.count,leafGeometryVertices:oak.leavesMesh.geometry.attributes.position.count,screenPercent:{left:(minX+1)*50,right:(maxX+1)*50,top:(1-maxY)*50,bottom:(1-minY)*50}},null,2));


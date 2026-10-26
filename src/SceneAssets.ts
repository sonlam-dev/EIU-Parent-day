import * as THREE from 'three';

/** Wait for scene texture images before revealing the first rendered frames. */
export function waitForSceneTextures(scene:THREE.Scene) {
  const textures=new Set<THREE.Texture>();
  scene.traverse(object=>{
    if(!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite)) return;
    const materials=Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material=>Object.values(material).forEach(value=>{if(value instanceof THREE.Texture) textures.add(value);}));
  });
  let timer:ReturnType<typeof setTimeout>|undefined,finish=()=>{};
  const started=performance.now();
  const ready=new Promise<void>(resolve=>{
    finish=()=>{clearTimeout(timer);resolve();};
    function check() {
      const loaded=[...textures].every(texture=>{
        const image=texture.image;
        return !!image && (typeof image.complete!=='boolean' || image.complete);
      });
      if(loaded || performance.now()-started>8000) finish();
      else timer=setTimeout(check,32);
    }
    check();
  });
  return {ready,cancel:()=>finish()};
}

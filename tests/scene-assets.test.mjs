import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {waitForSceneTextures} from '../src/SceneAssets.ts';
test('Scene reveal waits for texture image loading to finish',async()=>{
  const texture=new THREE.Texture(),scene=new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:texture})));
  const wait=waitForSceneTextures(scene);let ready=false;void wait.ready.then(()=>{ready=true;});
  try {
    await Promise.resolve();assert.equal(ready,false);
    texture.image={complete:false};await Promise.resolve();assert.equal(ready,false);
    texture.image.complete=true;await wait.ready;assert.equal(ready,true);
  } finally {wait.cancel();}
});
test('Scene cleanup releases pending asset waits and generated textures are immediately ready',async()=>{
  const scene=new THREE.Scene(),texture=new THREE.Texture();
  scene.add(new THREE.Sprite(new THREE.SpriteMaterial({map:texture})));
  const wait=waitForSceneTextures(scene);wait.cancel();await wait.ready;
  texture.image={width:256,height:256};await waitForSceneTextures(scene).ready;
});

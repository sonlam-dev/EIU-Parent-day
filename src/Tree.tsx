import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Wish } from './types';
import type { Arrival } from './App';
import { createMeadow } from './Meadow';
import { createAncientOak } from './ancientTree';
import { createYellowFlowers } from './Flowers';
import { installBangFoliage } from './BangFoliage';
import { createParentDayDecor } from './ParentDayDecor';
import { adjustedPixelRatio,renderPixelRatio } from './RenderQuality';
import EnvelopeWish from './EnvelopeWish';
import { createMorningSky } from './MorningSky';

export type ViewSettings = {zoom:number;autoRotate:boolean;speed:number;reset:number};
type Props = { wishes: Wish[]; ready: boolean; arrival: Arrival | null; view:ViewSettings };

export default function Tree(props: Props) {
  const host = useRef<HTMLDivElement>(null); const state = useRef(props); state.current = props;
  const sync = useRef(() => {}); const launch = useRef(() => {}); const [failed,setFailed] = useState(false);
  const applyView = useRef(() => {});
  const [selectedId,setSelectedId]=useState<string | null>(null);
  const reading=useRef(false); reading.current=selectedId!==null;
  useEffect(() => { sync.current(); },[props.wishes,props.ready]);
  useEffect(() => { launch.current(); },[props.arrival]);
  useEffect(() => { applyView.current(); },[props.view]);
  useEffect(() => {
    const el = host.current!; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Refresh shadows only after a meaningful change in the viewing/sun angle.
    renderer.shadowMap.autoUpdate=false; renderer.shadowMap.needsUpdate=true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
    el.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-label','Cây tri ân 3D với tán lá nhỏ, dày. Mỗi lời chúc được treo lên cây bằng một bao thư thả dây xuống.');
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#93c8f0');
    const camera = new THREE.PerspectiveCamera(38,1,.1,3000); camera.position.set(21,11,34); camera.lookAt(0,7,0);
    const controls = new OrbitControls(camera,renderer.domElement); controls.target.set(0,7,0); controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 15; controls.maxDistance = 55; controls.minPolarAngle = .55; controls.maxPolarAngle = Math.PI * .49;
    let lastReset = state.current.view.reset;
    applyView.current = () => {
      camera.zoom = state.current.view.zoom; camera.updateProjectionMatrix();
      if (lastReset !== state.current.view.reset) { lastReset = state.current.view.reset; camera.position.set(21,11,34); controls.target.set(0,7,0); controls.update(); }
    }; applyView.current();
    const sunDirection=new THREE.Vector3(-.95,.18,-1).normalize();
    const sky = new Sky(); sky.scale.setScalar(2000); sky.material.uniforms.turbidity.value = 1.6; sky.material.uniforms.rayleigh.value = 2.1;
    sky.material.uniforms.mieCoefficient.value = .002; sky.material.uniforms.mieDirectionalG.value = .86;
    sky.material.uniforms.sunPosition.value.copy(sunDirection); scene.add(sky);
    scene.add(new THREE.HemisphereLight('#e4f0ff','#829266',1.8));
    const sun = new THREE.DirectionalLight('#fff0d6',3.05); sun.target.position.set(0,5,0); sun.position.copy(sunDirection).multiplyScalar(55).add(sun.target.position); sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left = -25; sun.shadow.camera.right = 25; sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -20; sun.shadow.camera.far = 100; sun.shadow.normalBias = .045; sun.shadow.bias = -.0002; scene.add(sun,sun.target);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const meadow = createMeadow(scene,motion.matches);
    const flowers = createYellowFlowers(scene,motion.matches);
    const morning=createMorningSky(scene,sunDirection,motion.matches,flowers.lightTargets);
    const shadowSun=new THREE.Vector3();
    const {oak,roots,crownLift} = createAncientOak(); scene.add(oak,roots); oak.updateMatrixWorld(true);
    const bang = installBangFoliage(oak,crownLift);
    bang.texture.anisotropy = Math.min(16,renderer.capabilities.getMaxAnisotropy());
    const decor = createParentDayDecor(scene,bang.anchors,motion.matches,camera,crownLift);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    let press:{x:number;y:number;id:number;dragged:boolean} | undefined,hoverTime=0;
    function pick(clientX:number,clientY:number) {
      const bounds=renderer.domElement.getBoundingClientRect();
      pointer.set((clientX-bounds.left)/bounds.width*2-1,-(clientY-bounds.top)/bounds.height*2+1);
      camera.updateMatrixWorld(); raycaster.setFromCamera(pointer,camera);
      return decor.pick(raycaster);
    }
    function pointerDown(event:PointerEvent) { if (event.button===0) press={x:event.clientX,y:event.clientY,id:event.pointerId,dragged:false}; }
    function pointerUp(event:PointerEvent) {
      const start=press; press=undefined;
      if (!start || start.dragged || start.id!==event.pointerId || Math.hypot(event.clientX-start.x,event.clientY-start.y)>6) return;
      const id=pick(event.clientX,event.clientY);
      if (id) { decor.highlight(id); setSelectedId(id); }
    }
    function pointerMove(event:PointerEvent) {
      if (press && Math.hypot(event.clientX-press.x,event.clientY-press.y)>6) press.dragged=true;
      if (press || performance.now()-hoverTime<90) return;
      hoverTime=performance.now(); renderer.domElement.style.cursor=pick(event.clientX,event.clientY) ? 'pointer' : 'grab';
    }
    function cancelPress() { press=undefined; }
    const canvas=renderer.domElement;
    canvas.addEventListener('pointerdown',pointerDown); canvas.addEventListener('pointerup',pointerUp);
    canvas.addEventListener('pointermove',pointerMove); canvas.addEventListener('pointercancel',cancelPress);
    let now=0,lastToken=-1;
    sync.current = () => {
      if (!state.current.ready) return;
      decor.sync(state.current.wishes,now);
      renderer.domElement.dataset.envelopeCount=String(decor.count);
      renderer.domElement.dataset.activeDrops=String(decor.activeDrops);
    }; sync.current();
    launch.current = () => {
      const event=state.current.arrival;
      if (!event || event.token === lastToken) return;
      lastToken=event.token; decor.highlight(event.id);
    }; launch.current();
    let resolution=1,resolutionCeiling=1;
    const resize = new ResizeObserver(() => {
      const {width,height} = el.getBoundingClientRect(); if (!width || !height) return;
      camera.aspect = width / height;
      if (width < 700) { camera.position.set(34,15,55); controls.target.set(0,7.8,0); camera.setViewOffset(width,height,0,-height * .08,width,height); }
      else { camera.position.set(21,11,34); controls.target.set(0,7,0); camera.setViewOffset(width,height,width * .11,0,width,height); }
      controls.update();
      resolutionCeiling=renderPixelRatio(width,height,devicePixelRatio); resolution=resolutionCeiling;
      renderer.setPixelRatio(resolution); camera.updateProjectionMatrix(); renderer.setSize(width,height);
    }); resize.observe(el);
    const clock = new THREE.Clock(); let frame = 0,sampleTime=0,sampleFrames=0;
    function render() {
      frame = requestAnimationFrame(render); const elapsed=clock.getDelta(); if (document.hidden) return; const dt=Math.min(elapsed,.12); now += dt;
      controls.autoRotate = state.current.view.autoRotate && !motion.matches && !reading.current; controls.autoRotateSpeed = state.current.view.speed * .8; controls.update(dt);
      morning.update(now,camera); meadow.update(now); flowers.update(now); decor.update(now); oak.update(motion.matches ? 0 : now);
      sky.material.uniforms.sunPosition.value.copy(sunDirection);
      sun.position.copy(sunDirection).multiplyScalar(55).add(sun.target.position);
      if(shadowSun.dot(sunDirection)<.9996) { shadowSun.copy(sunDirection); renderer.shadowMap.needsUpdate=true; }
      const azimuth=Math.atan2(camera.position.x,camera.position.z);
      renderer.toneMappingExposure=THREE.MathUtils.damp(renderer.toneMappingExposure,1+.025*Math.sin(azimuth)+.01*Math.cos(azimuth*2),2,dt);
      renderer.render(scene,camera);
      if (elapsed > 0 && elapsed < .5) { sampleTime+=elapsed; sampleFrames++; }
      if (sampleTime >= 2) {
        const fps=sampleFrames / sampleTime;
        if (now > 5) {
          const next=adjustedPixelRatio(resolution,resolutionCeiling,fps);
          if (Math.abs(next-resolution) > .01) { resolution=next; renderer.setPixelRatio(resolution); }
        }
        Object.assign(renderer.domElement.dataset,{activeDrops:String(decor.activeDrops),activeGlows:String(decor.activeGlows),fps:fps.toFixed(1),pixelRatio:resolution.toFixed(2),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles)});
        sampleTime=0; sampleFrames=0;
      }
    } render();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); controls.dispose();
      canvas.removeEventListener('pointerdown',pointerDown); canvas.removeEventListener('pointerup',pointerUp);
      canvas.removeEventListener('pointermove',pointerMove); canvas.removeEventListener('pointercancel',cancelPress);
      const geometries = new Set<THREE.BufferGeometry>(),materials = new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
      scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); if (o instanceof THREE.InstancedMesh) o.dispose(); } });
      scene.traverse(object => { if (object instanceof THREE.Sprite) materials.add(object.material); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => { Object.values(m).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }); m.dispose(); }); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  },[]);
  const selectedWish=props.wishes.find(wish => wish.id===selectedId && wish.status==='approved');
  return <><div ref={host} className="event-world">{failed && <div className="screen-loading"><span>🌳</span><p>Không khởi tạo được WebGL. Hãy mở màn hình chiếu bằng trình duyệt hỗ trợ tăng tốc đồ họa.</p></div>}</div>{selectedId && <EnvelopeWish key={selectedId} wish={selectedWish} onClose={() => setSelectedId(null)}/>}</>;
}


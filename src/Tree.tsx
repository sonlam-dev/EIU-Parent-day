import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createClearSky } from './ClearSky';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Wish } from './types';
import type { Arrival } from './App';
import { createMeadow } from './Meadow';
import { createAncientOak } from './ancientTree';
import { createYellowFlowers } from './Flowers';
import { installBangFoliage } from './BangFoliage';
import { createParentDayDecor } from './ParentDayDecor';
import { RenderQuality,renderPixelRatio } from './RenderQuality';
import EnvelopeWish from './EnvelopeWish';
import { createMorningSky } from './MorningSky';
import { daylightBalance } from './Daylight';

import {Sprout} from 'lucide-react';
import {waitForSceneTextures} from './SceneAssets';

export type ViewSettings = {zoom:number;autoRotate:boolean;speed:number;reset:number};
type Props = { wishes: Wish[]; ready: boolean; arrival: Arrival | null; view:ViewSettings };

export default function Tree(props: Props) {
  const host = useRef<HTMLDivElement>(null); const state = useRef(props); state.current = props;
  const sync = useRef(() => {}); const launch = useRef(() => {}); const [failed,setFailed] = useState(false);
  const applyView = useRef(() => {});
  const [sceneReady,setSceneReady]=useState(false);
  const [selectedId,setSelectedId]=useState<string | null>(null);
  const reading=useRef(false); reading.current=selectedId!==null;
  useEffect(() => { sync.current(); },[props.wishes,props.ready]);
  useEffect(() => { launch.current(); },[props.arrival]);
  useEffect(() => { applyView.current(); },[props.view]);
  useEffect(() => {
    setSceneReady(false);
    const el = host.current!; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); }
    catch { setFailed(true); return; }
    renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Refresh shadows only after a meaningful change in the viewing/sun angle.
    renderer.shadowMap.autoUpdate=false; renderer.shadowMap.needsUpdate=true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .96;
    el.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-label','Cây tri ân 3D với tán lá nhỏ, dày. Mỗi lời chúc được treo lên cây bằng một bao thư thả dây xuống.');
    const scene = new THREE.Scene();
    scene.fog=new THREE.Fog('#b4dcf6',65,190);
    const camera = new THREE.PerspectiveCamera(38,1,.1,3000); camera.position.set(21,11,34); camera.lookAt(0,7,0);
    const controls = new OrbitControls(camera,renderer.domElement); controls.target.set(0,7,0); controls.enableDamping = true; controls.enablePan = false;
    controls.minDistance = 15; controls.maxDistance = 55; controls.minPolarAngle = .55; controls.maxPolarAngle = Math.PI * .49;
    let lastReset = state.current.view.reset;
    camera.zoom=state.current.view.zoom;
    applyView.current = () => {
      if (lastReset !== state.current.view.reset) {
        lastReset = state.current.view.reset;
        const mobile=el.clientWidth<700;
        camera.position.set(mobile ? 34 : 21,mobile ? 15 : 11,mobile ? 55 : 34);
        controls.target.set(0,mobile ? 7.8 : 7,0); controls.update();
      }
    }; applyView.current();
    const sunDirection=new THREE.Vector3(-.95,.28,-1).normalize();
    createClearSky(scene,sunDirection);
    scene.add(new THREE.HemisphereLight('#e4f0ff','#a6b58c',1.85));
    // Keep the sun fixed in the world; reflected light gently balances each viewing angle.
    const fill=new THREE.DirectionalLight('#fff5e5',.65); fill.target.position.set(0,7,0); scene.add(fill,fill.target);
    const sun = new THREE.DirectionalLight('#fff0d6',2); sun.target.position.set(0,5,0); sun.position.copy(sunDirection).multiplyScalar(55).add(sun.target.position); sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left = -25; sun.shadow.camera.right = 25; sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -20; sun.shadow.camera.far = 100; sun.shadow.normalBias = .045; sun.shadow.bias = -.0002; scene.add(sun,sun.target);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const meadow = createMeadow(scene,motion.matches);
    const flowers = createYellowFlowers(scene,motion.matches);
    const morning=createMorningSky(scene,sunDirection,motion.matches,flowers.lightTargets);
    const shadowSun=new THREE.Vector3();
    const viewingDirection=new THREE.Vector3();
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
    const quality=new RenderQuality();
    let pendingSize:{width:number;height:number}|undefined;
    let mobile:boolean|undefined;
    const resize = new ResizeObserver(() => {
      const {width,height} = el.getBoundingClientRect(); if (!width || !height) return;
      // ResizeObserver only queues work: changing canvas dimensions clears its pixels.
      pendingSize={width,height};
    }); resize.observe(el);
    let disposed=false,prepared=false,warmupFrames=0;
    let compileTimer:ReturnType<typeof setTimeout>|undefined;
    const assets=waitForSceneTextures(scene);
    void assets.ready.then(async()=>{
      if(disposed)return;
      try {
        await Promise.race([renderer.compileAsync(scene,camera),new Promise<void>(resolve=>{compileTimer=setTimeout(resolve,3500);})]);
      } catch { /* The hidden warm-up frames also compile on renderers without async support. */ }
      clearTimeout(compileTimer);
      if(!disposed)prepared=true;
    });
    const clock = new THREE.Clock(); let frame = 0,sampleTime=0,sampleFrames=0;
    function render() {
      frame = requestAnimationFrame(render); const elapsed=clock.getDelta();
      if (document.hidden || !prepared) { sampleTime=0; sampleFrames=0; return; }
      // Resize and redraw in the same frame, never leave a cleared canvas on screen.
      if (pendingSize) {
        const {width,height}=pendingSize; pendingSize=undefined;
        const nextMobile=width<700;
        if (mobile!==nextMobile) {
          camera.position.set(nextMobile ? 34 : 21,nextMobile ? 15 : 11,nextMobile ? 55 : 34);
          controls.target.set(0,nextMobile ? 7.8 : 7,0); controls.update();
        }
        const initial=mobile===undefined; mobile=nextMobile;
        camera.aspect=width/height;
        camera.setViewOffset(width,height,nextMobile ? 0 : width*.11,nextMobile ? -height*.08 : 0,width,height);
        resolutionCeiling=renderPixelRatio(width,height,devicePixelRatio);
        resolution=initial ? resolutionCeiling : Math.min(resolution,resolutionCeiling);
        quality.reset(); sampleTime=0; sampleFrames=0;
        renderer.setPixelRatio(resolution); renderer.setSize(width,height);
      } else if (Math.abs(renderer.getPixelRatio()-resolution)>.01) renderer.setPixelRatio(resolution);
      const dt=Math.min(elapsed,.05); now += dt;
      const zoom=THREE.MathUtils.damp(camera.zoom,state.current.view.zoom,9,dt);
      if (Math.abs(camera.zoom-state.current.view.zoom)>.0001) { camera.zoom=zoom; camera.updateProjectionMatrix(); }
      controls.autoRotate = state.current.view.autoRotate && !motion.matches && !reading.current; controls.autoRotateSpeed = state.current.view.speed * .8; controls.update(dt);
      morning.update(now,camera); meadow.update(now); flowers.update(now); decor.update(now); oak.update(motion.matches ? 0 : now);
      sun.position.copy(sunDirection).multiplyScalar(55).add(sun.target.position);
      fill.position.copy(camera.position); fill.position.y=Math.max(camera.position.y,12);
      viewingDirection.copy(camera.position).sub(controls.target);
      const balance=daylightBalance(viewingDirection,sunDirection);
      fill.intensity=THREE.MathUtils.damp(fill.intensity,balance.fill,3,dt);
      renderer.toneMappingExposure=THREE.MathUtils.damp(renderer.toneMappingExposure,balance.exposure,3,dt);
      if(shadowSun.dot(sunDirection)<.9996) { shadowSun.copy(sunDirection); renderer.shadowMap.needsUpdate=true; }
      renderer.render(scene,camera);
      if(++warmupFrames===3)setSceneReady(true);
      if (elapsed > 0 && elapsed < .5) { sampleTime+=elapsed; sampleFrames++; }
      if (sampleTime >= 2) {
        const fps=sampleFrames / sampleTime;
        if (now > 5) {
          resolution=quality.sample(resolution,resolutionCeiling,fps,sampleTime);
        }
        Object.assign(renderer.domElement.dataset,{activeDrops:String(decor.activeDrops),activeGlows:String(decor.activeGlows),fps:fps.toFixed(1),pixelRatio:resolution.toFixed(2),drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles)});
        sampleTime=0; sampleFrames=0;
      }
    } render();
    return () => {
      disposed=true;assets.cancel();clearTimeout(compileTimer);
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
  return <><div className="event-world" data-scene-ready={sceneReady}><div ref={host} className="scene-canvas"/>{failed ? <div className="screen-loading"><span>🌳</span><p>Không khởi tạo được WebGL. Hãy mở màn hình chiếu bằng trình duyệt hỗ trợ tăng tốc đồ họa.</p></div> : <div className="scene-loading-veil" aria-hidden={sceneReady}><div className="scene-loading-caption" role="status"><span className="scene-loading-mark"><Sprout size={32}/></span><p>Loading.......</p></div></div>}</div>{selectedId && <EnvelopeWish key={selectedId} wish={selectedWish} onClose={() => setSelectedId(null)}/>}</>;
}


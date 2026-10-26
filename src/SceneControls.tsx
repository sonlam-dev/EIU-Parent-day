import {useEffect,useRef,useState,type Dispatch,type SetStateAction} from 'react';
import {Minus,Plus,Pause,Play,RotateCcw} from 'lucide-react';
import type {ViewSettings} from './Tree';

export default function SceneControls({view,setView}:{view:ViewSettings;setView:Dispatch<SetStateAction<ViewSettings>>}) {
  const [visible,setVisible]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function reveal() {
    setVisible(true);
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>setVisible(false),5000);
  }
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  return <div className="scene-controls-zone" tabIndex={0} aria-label="Hi?n ?i?u khi?n g?c nh?n" onPointerEnter={reveal} onPointerDown={reveal} onFocusCapture={reveal} onClickCapture={reveal} onChangeCapture={reveal}>
    <div className="scene-controls" data-visible={visible} inert={!visible} aria-label="Điều khiển góc nhìn"><div className="zoom-controls"><button aria-label="Thu nhỏ" title="Thu nhỏ" disabled={view.zoom <= .65} onClick={() => setView(v => ({...v,zoom:Math.max(.65,Math.round((v.zoom - .1) * 100) / 100)}))}><Minus size={17}/></button><span>{Math.round(view.zoom * 100)}%</span><button aria-label="Phóng to" title="Phóng to" disabled={view.zoom >= 1.8} onClick={() => setView(v => ({...v,zoom:Math.min(1.8,Math.round((v.zoom + .1) * 100) / 100)}))}><Plus size={17}/></button></div><span className="control-divider"/><button className={view.autoRotate ? 'rotation-toggle active' : 'rotation-toggle'} aria-pressed={view.autoRotate} onClick={() => setView(v => ({...v,autoRotate:!v.autoRotate}))}>{view.autoRotate ? <Pause size={15}/> : <Play size={15}/>}<span>{view.autoRotate ? 'Dừng xoay' : 'Tự xoay'}</span></button><label className="speed-control">Tốc độ<input aria-label="Tốc độ tự xoay" type="range" min="0.5" max="5" step="0.5" value={view.speed} onChange={e => setView(v => ({...v,speed:Number(e.target.value)}))}/><output>{view.speed}×</output></label><button title="Về góc nhìn ban đầu" aria-label="Đặt lại góc nhìn" onClick={() => setView(v => ({zoom:1.2,autoRotate:false,speed:1,reset:v.reset + 1}))}><RotateCcw size={16}/></button></div>
  </div>;
}

import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import type {Wish} from './types';
import BrandLogo from './BrandLogo';

export default function WishLeafDialog({wish,onClose}:{wish:Wish|undefined;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog ref={dialog} className="wish-leaf-dialog" aria-labelledby="wish-leaf-heading" onClose={onClose} onClick={event=>{
    if(event.target!==event.currentTarget)return;
    const rect=event.currentTarget.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.current?.close();
  }}>
    <button type="button" className="wish-leaf-close" aria-label="Đóng chiếc lá" onClick={()=>dialog.current?.close()} autoFocus><X size={20}/></button>
    <BrandLogo/><h2 id="wish-leaf-heading">{wish ? `Chiếc lá gửi ${wish.recipient}` : 'Chiếc lá yêu thương'}</h2>
    {wish&&<><blockquote>{wish.message}</blockquote><p className="wish-leaf-sender">Thương con, <strong>{wish.name}</strong></p></>}
  </dialog>;
}

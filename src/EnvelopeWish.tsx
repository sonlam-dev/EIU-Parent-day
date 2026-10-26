import { useEffect, useRef } from 'react';
import { Mail, X } from 'lucide-react';
import {colors,type Wish} from './types';
import eiuLogo from './assets/eiu-logo.png';

export default function EnvelopeWish({wish,onClose}:{wish:Wish | undefined;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const color=colors.find(c=>c.id===wish?.color)?.hex || colors[0].hex;
  useEffect(() => { dialog.current?.showModal(); },[]);
  return <dialog ref={dialog} className="envelope-dialog" style={{borderColor:color,background:`linear-gradient(145deg,#fffbee,${color}33),#fffbee`}} aria-labelledby="envelope-heading" onClose={onClose} onClick={event => {
    if (event.target!==event.currentTarget) return;
    const bounds=event.currentTarget.getBoundingClientRect();
    if (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom) event.currentTarget.close();
  }}>
    <button className="envelope-close" aria-label="Đóng lời chúc" onClick={() => dialog.current?.close()} autoFocus><X size={20}/></button>
    <div className="envelope-brand-header"><span className="envelope-letter-icon" style={{color,background:`${color}26`}}><Mail size={24}/></span><div className="envelope-brand-identity"><img src={eiuLogo} alt="EIU Logo" className="envelope-brand-logo" width="90" height="26" /><span className="envelope-overline">PARENT DAY</span></div></div>
    <h2 id="envelope-heading">{wish ? `Gửi ${wish.recipient}` : 'Bao thư yêu thương'}</h2>
    <blockquote>{wish ? wish.message : 'Mỗi bao thư gửi gắm một lời tri ân. Hãy gửi lời chúc của bạn để cùng vun đắp cây yêu thương.'}</blockquote>
    {wish && <p className="envelope-sender">Thương mến, <strong>{wish.name}</strong></p>}
  </dialog>;
}

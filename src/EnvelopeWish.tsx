import { useEffect, useRef } from 'react';
import { Mail, X } from 'lucide-react';
import type { Wish } from './types';

export default function EnvelopeWish({wish,onClose}:{wish:Wish | undefined;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); },[]);
  return <dialog ref={dialog} className="envelope-dialog" aria-labelledby="envelope-heading" onClose={onClose} onClick={event => {
    if (event.target!==event.currentTarget) return;
    const bounds=event.currentTarget.getBoundingClientRect();
    if (event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom) event.currentTarget.close();
  }}>
    <button className="envelope-close" aria-label="Đóng lời chúc" onClick={() => dialog.current?.close()} autoFocus><X size={20}/></button>
    <span className="envelope-letter-icon"><Mail size={27}/></span>
    <p className="envelope-overline">EIU · PARENT DAY</p>
    <h2 id="envelope-heading">{wish ? `Gửi ${wish.recipient}` : 'Bao thư yêu thương'}</h2>
    <blockquote>{wish ? wish.message : 'Mỗi bao thư gửi gắm một lời tri ân. Hãy gửi lời chúc của bạn để cùng vun đắp cây yêu thương.'}</blockquote>
    {wish && <p className="envelope-sender">Thương mến, <strong>{wish.name}</strong></p>}
  </dialog>;
}

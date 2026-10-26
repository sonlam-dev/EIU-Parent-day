import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Check,Copy,QrCode,Settings,X} from 'lucide-react';
import QRCode from 'qrcode';

export default function AdminEntry({url}:{url:string}) {
  const [open,setOpen]=useState(false),[qr,setQr]=useState(''),[error,setError]=useState(''),[copied,setCopied]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    if(!open) return;
    dialog.current?.showModal();setError('');setCopied(false);setQr('');
    let active=true;
    void QRCode.toDataURL(url,{width:720,margin:4,errorCorrectionLevel:'M',color:{dark:'#176b4b',light:'#ffffff'}})
      .then(value=>{if(active)setQr(value);}).catch(()=>{if(active)setError('Không tạo được mã QR. Bạn vẫn có thể mở liên kết bên dưới.');});
    return ()=>{active=false;};
  },[open,url]);
  async function copy() {
    try {await navigator.clipboard.writeText(url);setCopied(true);setError('');}
    catch {setError('Vui lòng chọn và sao chép liên kết trong ô bên dưới.');}
  }
  return <>
    <button type="button" className="admin-quick-entry" aria-label="Quản trị" title="Quản trị" aria-haspopup="dialog" aria-expanded={open} aria-controls="admin-access-dialog" onClick={()=>setOpen(true)}><Settings size={17}/></button>
    {open && <dialog ref={dialog} id="admin-access-dialog" className="qr-dialog admin-access-dialog" aria-labelledby="admin-access-heading" onClose={()=>setOpen(false)} onClick={event=>{
      if(event.target!==event.currentTarget)return;
      const bounds=event.currentTarget.getBoundingClientRect();
      if(event.clientX<bounds.left || event.clientX>bounds.right || event.clientY<bounds.top || event.clientY>bounds.bottom)dialog.current?.close();
    }}>
      <button type="button" className="qr-close" aria-label="Đóng mã QR quản trị" onClick={()=>dialog.current?.close()}><X size={21}/></button>
      <QrCode size={28}/><h2 id="admin-access-heading">Trang quản trị</h2>
      <p>Quét mã QR hoặc mở liên kết để vào trang quản trị dành cho ban tổ chức.</p>
      {qr ? <img src={qr} width="260" height="260" alt="Mã QR mở trang quản trị EIU Parent Day"/> : !error && <p role="status">Đang tạo mã QR…</p>}
      <input readOnly value={url} aria-label="Liên kết trang quản trị" onFocus={event=>event.target.select()}/>
      <div className="qr-modal-actions"><button type="button" className="btn secondary" onClick={()=>void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Đã sao chép' : 'Sao chép link'}</button><a className="btn" href={url} target="_blank" rel="noreferrer">Mở trang quản trị <ArrowUpRight size={16}/></a></div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </dialog>}
  </>;
}

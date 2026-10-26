import {useEffect,useState} from 'react';
import {QrCode} from 'lucide-react';
import QRCode from 'qrcode';

export default function AdminEntry() {
  const [qr,setQr]=useState('');
  const url=new URL('/admin',import.meta.env.VITE_SITE_URL || location.origin).href;
  useEffect(()=>{
    let active=true;
    void QRCode.toDataURL(url,{width:320,margin:4,errorCorrectionLevel:'M',color:{dark:'#176b4b',light:'#ffffff'}})
      .then(value=>{if(active)setQr(value);}).catch(()=>{});
    return ()=>{active=false;};
  },[url]);
  return <a className="admin-quick-entry" href="/admin" title="Mở trang quản trị · QR dành cho ban tổ chức" aria-label="Mở trang quản trị">
    {qr ? <img src={qr} width="56" height="56" alt="QR mở trang quản trị"/> : <QrCode size={28}/>}
    <span>Quản trị</span>
  </a>;
}

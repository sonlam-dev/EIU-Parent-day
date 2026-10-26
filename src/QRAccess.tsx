import { useEffect,useRef,useState } from 'react';
import { ArrowRight,Download,QrCode,X } from 'lucide-react';
import QRCode from 'qrcode';
import { demo } from './data';

export default function QRAccess({url,sharedDemo}: {url:string;sharedDemo:boolean}) {
  const [open,setOpen] = useState(false),[image,setImage] = useState(''),[error,setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    void QRCode.toDataURL(url,{width:900,margin:3,errorCorrectionLevel:'M',color:{dark:'#294d36',light:'#ffffff'}}).then(setImage).catch(() => setError('Không tạo được QR. Hãy mở liên kết bên dưới.'));
  },[open,url]);
  const loopback = /localhost|127\.0\.0\.1/.test(url);
  return <><button className="qr-trigger" onClick={() => setOpen(true)}><QrCode size={18}/> Quét QR gửi lời chúc</button>{open && <dialog ref={dialog} className="qr-dialog" onCancel={() => setOpen(false)} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}><button className="qr-close" aria-label="Đóng QR" onClick={() => setOpen(false)}><X size={21}/></button><span className="join-overline">CÙNG GÓP MỘT CHIẾC LÁ</span><h2>Quét mã, gửi yêu thương.</h2><p>Mở camera điện thoại và quét mã bên dưới.</p>{image ? <img src={image} width="260" height="260" alt="QR mở form gửi lời chúc trên điện thoại"/> : <p>Đang tạo mã QR…</p>}<input readOnly value={url} aria-label="Liên kết gửi lời chúc" onFocus={e => e.target.select()}/>{demo && <p className="qr-test-note">{!sharedDemo && !loopback ? 'Đây là bản demo riêng trên từng trình duyệt. Kết nối Supabase để chia sẻ lời chúc giữa các thiết bị.' : loopback ? 'QR hiện dùng localhost, điện thoại khác chưa truy cập được. Bạn có thể mở trang gửi trên máy này để thử.' : 'Thử ngay: điện thoại và máy chiếu dùng cùng Wi-Fi. Lời chúc sẽ cập nhật trên cây sau khoảng 1 giây. Dữ liệu demo được xóa khi khởi động lại server.'}</p>}<div className="qr-modal-actions"><a className="btn secondary" href={url} target="_blank" rel="noreferrer">Mở trang gửi <ArrowRight size={16}/></a>{image && <a className="btn" href={image} download="parent-day-qr.png"><Download size={16}/> Tải QR</a>}</div>{error && <p className="form-error">{error}</p>}</dialog>}</>;
}


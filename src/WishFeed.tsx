import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Mail,QrCode,Wifi,WifiOff} from 'lucide-react';
import QRCode from 'qrcode';
import type {Wish} from './types';
import {colors} from './types';
import EnvelopeWish from './EnvelopeWish';
import eiuLogo from './assets/eiu-logo.png';

type Props={wishes:Wish[];loading:boolean;connection:'connecting'|'live'|'retrying'|'demo';error:string;total:number;shareUrl:string};
export default function WishFeed({wishes,loading,connection,error,total,shareUrl}:Props) {
  const [track,setTrack]=useState({rows:wishes,scrolling:false});
  const previous=useRef(wishes);
  const [selected,setSelected]=useState<Wish|null>(null);
  const [qr,setQr]=useState(''),[qrError,setQrError]=useState(false);
  const viewport=useRef<HTMLDivElement>(null);
  const hasWishes=wishes.length>0;
  useEffect(()=>{
    let active=true;setQrError(false);
    void QRCode.toDataURL(shareUrl,{width:1000,margin:4,errorCorrectionLevel:'M',color:{dark:'#176b4b',light:'#ffffff'}})
      .then(value=>{if(active)setQr(value);}).catch(()=>{if(active)setQrError(true);});
    return ()=>{active=false;};
  },[shareUrl]);
  useLayoutEffect(()=>{
    const node=viewport.current;if(!node)return;
    const resize=new ResizeObserver(()=>node.style.setProperty('--wish-row-height',`${node.clientHeight/5}px`));
    resize.observe(node);return ()=>resize.disconnect();
  },[]);
  const signature=JSON.stringify(wishes);
  useLayoutEffect(()=>{
    const old=previous.current; previous.current=wishes;
    const scroll=old.length===5 && wishes.length===5 && old.slice(1).every((w,i)=>w.id===wishes[i].id) && old[4].id!==wishes[4].id;
    if(!scroll) { setTrack({rows:wishes,scrolling:false}); return; }
    setTrack({rows:[...old,wishes[4]],scrolling:true});
    const timer=setTimeout(()=>setTrack({rows:wishes,scrolling:false}),650);
    return ()=>clearTimeout(timer);
  },[signature]);
  const labels={connecting:'Đang kết nối',live:'Đang nhận lời chúc',retrying:'Đang kết nối lại',demo:''};
  return <>
    <section className="wish-feed" data-has-wishes={hasWishes} aria-label="Lời chúc và mã QR tham gia">
      <header className="wish-feed-header"><div className="wish-feed-head-content"><div className="wish-feed-brand-row"><img src={eiuLogo} alt="EIU Logo" className="wish-feed-brand-logo" width="85" height="25" /><span className="wish-feed-brand-tag">PARENT DAY</span></div><h1>Những lời yêu thương</h1></div><span className="wish-feed-total">{total.toLocaleString('vi')}<small>lá thư</small></span></header>
      <div className="wish-feed-content">
        <div className="wish-invitation" aria-hidden={hasWishes}>
          <span className="wish-invitation-kicker"><QrCode size={18}/> QUÉT MÃ QR ĐỂ THAM GIA</span>
          <h2>Mời phụ huynh<br/>gửi lời chúc!</h2>
          <div className="wish-qr-large">{qr ? <img src={qr} width="1000" height="1000" alt="Mã QR xanh để gửi lời chúc"/> : <span role="status">{qrError ? 'Chưa tải được mã QR. Vui lòng tải lại trang.' : 'Đang chuẩn bị mã QR…'}</span>}</div>
          <p>Mở camera điện thoại, quét mã<br/>và gửi lời chúc đến con.</p>
          <small>{loading ? 'Đang đón những lời yêu thương…' : 'Lời chúc sẽ xuất hiện sau khi được duyệt.'}</small>
        </div>
      <div ref={viewport} className="wish-feed-viewport" aria-hidden={!hasWishes}>
        <div className={`wish-feed-track ${track.scrolling ? 'wish-feed-scrolling' : ''}`}>
          {track.rows.map(wish=><article className="wish-feed-row" key={wish.id}>
            <button className="wish-feed-card" onClick={()=>setSelected(wish)} aria-label={`Đọc lời chúc của ${wish.name} gửi ${wish.recipient}`}>
              <span className="wish-feed-recipient"><i style={{background:colors.find(c=>c.id===wish.color)?.hex}}/>Gửi {wish.recipient}</span>
              <p>{wish.message}</p><span className="wish-feed-author">— {wish.name}</span>
            </button>
          </article>)}
        </div>
      </div>
      </div>
      <div className="wish-qr-footer" aria-hidden={!hasWishes}>
        {qr && <img src={qr} width="1000" height="1000" alt="Quét mã QR để gửi thêm lời chúc"/>}
        <div><strong>Mời phụ huynh gửi lời chúc!</strong></div>
      </div>
      {(error || connection!=='demo') && <footer className="wish-feed-status" data-connection={error ? 'retrying' : connection} role="status">{error || connection==='retrying' ? <WifiOff size={13}/> : <Wifi size={13}/>}<span>{error ? 'Đang kết nối lại · giữ các lời chúc đã nhận' : labels[connection]}</span></footer>}
    </section>
    {selected && <EnvelopeWish key={selected.id} wish={selected} onClose={()=>setSelected(null)}/>}
  </>;
}

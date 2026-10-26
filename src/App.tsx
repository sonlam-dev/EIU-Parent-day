import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, Download, Leaf, QrCode, Sprout, Minus, Plus, Pause, Play, RotateCcw } from 'lucide-react';
import QRCode from 'qrcode';
import { demo, fetchWishes, supabase } from './data';
import { type Wish } from './types';
import WishForm from './WishForm';
import { WishPresentation,WISH_INTERVAL_MS } from './WishPresentation';
import WishFeed from './WishFeed';
import AdminEntry from './AdminEntry';
const Tree = lazy(() => import('./Tree'));
const Admin = lazy(() => import('./Admin'));
export type Arrival = { id: string; token: number };

export default function App() {
  const [view,setView] = useState({zoom:1.2,autoRotate:false,speed:1,reset:0});
  const path = location.pathname;
  const joining = path === '/join' || new URLSearchParams(location.search).has('write');
  const setup = path === '/setup';
  const [wishes,setWishes] = useState<Wish[]>([]); const [loading,setLoading] = useState(true); const [error,setError] = useState('');
  const [presented,setPresented]=useState<{treeWishes:Wish[];feed:Wish[];ready:boolean}>({treeWishes:[],feed:[],ready:false});
  const [arrival,setArrival] = useState<Arrival | null>(null);
  const [connection,setConnection]=useState<'connecting'|'live'|'retrying'|'demo'>(demo ? 'demo' : 'connecting');
  const [receipt,setReceipt] = useState(false); const [formKey,setFormKey] = useState(0);
  const [qr,setQr] = useState(''); const [copied,setCopied] = useState(false);
  const [lanOrigin,setLanOrigin] = useState(''); const [sharedDemo,setSharedDemo] = useState(false);
  const presentation = useRef(new WishPresentation()); const playing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); const token = useRef(0);
  const shareUrl = new URL('/join',import.meta.env.VITE_SITE_URL || lanOrigin || location.origin).href;
  useEffect(() => {
    if (demo && import.meta.env.DEV) void fetch('/api/demo/info').then(r => r.json()).then(info => { setLanOrigin(info.origin || ''); setSharedDemo(!!info.shared); }).catch(() => {});
  },[]);
  const refreshing=useRef({running:false,again:false});
  const refresh = useCallback(async () => {
    const work=refreshing.current;
    if (work.running) { work.again=true; return; }
    work.running=true;
    try {
      do {
        work.again=false;
        try { setWishes(await fetchWishes()); setError(''); }
        catch { setError('Chưa kết nối được cây lời chúc. Đang thử lại…'); }
        finally { setLoading(false); }
      } while (work.again);
    } finally { work.running=false; }
  },[]);
  useEffect(() => {
    if (path.startsWith('/admin')) return;
    void refresh();
    if (demo) {
      const sync = (e: StorageEvent) => { if (e.key === 'parent-day-wishes') void refresh(); };
      addEventListener('storage',sync);
      const poll = import.meta.env.DEV ? setInterval(() => void refresh(),1200) : undefined;
      return () => { removeEventListener('storage',sync); clearInterval(poll); };
    }
    let active=true;
    const channel = supabase!.channel('parent-day-display').on('postgres_changes',{event:'*',schema:'public',table:'wishes'},() => void refresh()).subscribe(status=>{
      if(!active) return;
      if(status==='SUBSCRIBED') { setConnection('live'); void refresh(); }
      else if(status==='CHANNEL_ERROR' || status==='TIMED_OUT' || status==='CLOSED') setConnection('retrying');
    });
    const resume=()=>{if(!document.hidden) void refresh();}; document.addEventListener('visibilitychange',resume);
    const interval = setInterval(() => void refresh(),15000);
    return () => { active=false; clearInterval(interval); document.removeEventListener('visibilitychange',resume); void supabase!.removeChannel(channel); };
  },[refresh,path]);
  useEffect(() => {
    if (loading || error || joining || setup || path.startsWith('/admin')) return;
    setPresented({...presentation.current.ingest(wishes),ready:true});
    function advance() {
      const next = presentation.current.next();
      if (!next) { playing.current = false; return; }
      playing.current = true; setPresented({treeWishes:next.treeWishes,feed:next.feed,ready:true}); setArrival({id:next.wish.id,token:++token.current});
      timer.current = setTimeout(advance,WISH_INTERVAL_MS);
    }
    if (!playing.current) advance();
  },[wishes,loading,error,joining,setup,path]);
  useEffect(() => () => { clearTimeout(timer.current); playing.current = false; },[]);
  useEffect(() => { if (setup) void QRCode.toDataURL(shareUrl,{width:900,margin:3,errorCorrectionLevel:'M',color:{dark:'#254e36',light:'#ffffff'}}).then(setQr).catch(() => setError('Không tạo được QR.')); },[shareUrl,setup]);
  function submitted(_wish?: Wish) { void refresh(); setReceipt(true); setFormKey(k => k + 1); window.scrollTo({top:0,behavior:'smooth'}); }
  async function copy() { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); } catch { setError('Vui lòng chọn và sao chép liên kết trong ô.'); } }
  if (path.startsWith('/admin')) return <Suspense fallback={<div className="loading">Đang mở quản trị…</div>}><Admin/></Suspense>;
  if (joining) return <main className="join-page"><header className="join-header"><a href="/join" className="join-brand"><Sprout size={25}/> Cây yêu thương<span>EIU · PARENT DAY</span></a></header><section className="join-content">{receipt ? <div className="join-success" role="status"><div className="join-success-icon"><Check size={36}/></div><span className="join-overline">CẢM ƠN BẠN ĐÃ GỬI MỘT BAO THƯ</span><h1>Yêu thương<br/><em>đã được gửi đi.</em></h1><p>{demo ? 'Lời chúc đã được lưu trong bản trải nghiệm. Theo dõi màn hình chiếu để xem bao thư của bạn được thả dây xuống cây.' : 'Lời chúc đang chờ ban tổ chức duyệt. Sau khi được duyệt, bao thư của bạn sẽ được treo lên cây trên màn hình sự kiện.'}</p><button className="btn full" onClick={() => setReceipt(false)}>Gửi thêm một lời chúc <ArrowRight size={18}/></button><a href="/" className="join-back"><Leaf size={16}/> Ngắm cây yêu thương</a></div> : <><span className="join-overline">MỖI LỜI TRI ÂN · MỘT BAO THƯ</span><h1>Có lời yêu thương,<br/><em>hãy nói hôm nay.</em></h1><p className="join-description">Gửi lời chúc đến ba mẹ và những người thân yêu. Mỗi lời nhắn sẽ được đặt vào một bao thư và treo lên cây chung.</p><div className="join-form-card"><WishForm key={formKey} onSuccess={submitted} sharedDemo={sharedDemo}/></div><p className="join-community"><Leaf size={15}/>{loading ? 'Đang đón những lời yêu thương…' : `${wishes.length.toLocaleString('vi')} bao thư yêu thương đã được treo lên cây`}</p></>}{demo && <p className="join-demo">{sharedDemo ? 'Demo Wi-Fi · Lời chúc dùng chung trong phiên local này' : 'Bản trải nghiệm · Dữ liệu chỉ lưu trên trình duyệt này'}</p>}{error && <p role="alert" className="form-error">{error}</p>}</section><footer className="join-footer">Eastern International University · Parent Day</footer></main>;
  if (setup) return <main className="setup-page"><a href="/" className="text-btn"><ArrowLeft size={17}/> Về màn hình chiếu</a><Sprout size={35}/><h1>Chuẩn bị cho Parent Day</h1><p>Trang chiếu chỉ có cây, đồng cỏ và lời chúc. Sử dụng các liên kết ở đây để vận hành.</p><div className="setup-links"><a href="/" className="btn" target="_blank" rel="noreferrer">Mở màn hình chiếu <ArrowRight size={16}/></a><a href="/join" className="btn secondary" target="_blank" rel="noreferrer">Mở trang gửi lời chúc</a><a href="/admin" className="btn secondary">Duyệt lời chúc</a></div><div className="setup-qr"><QrCode size={24}/><h2>QR dành cho khách</h2>{qr && <img src={qr} alt="QR mở trang gửi lời chúc" width="260" height="260"/>}<input aria-label="Liên kết khách tham gia" value={shareUrl} readOnly onFocus={e => e.target.select()}/><div><button className="btn secondary" onClick={() => void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Đã chép' : 'Chép link'}</button>{qr && <a className="btn" href={qr} download="parent-day-qr.png"><Download size={16}/> Tải QR PNG</a>}</div></div><p className="setup-note">{demo ? 'Bản demo Wi-Fi đang dùng chung dữ liệu tạm trên máy. Quét QR bằng điện thoại cùng Wi-Fi và gửi lời chúc để thử trên màn hình chiếu. Dữ liệu được xóa khi server khởi động lại.' : 'Kết nối Supabase đã được cấu hình. Duyệt lời chúc tại /admin để đưa lên màn hình.'}</p><p className="setup-note">Nếu QR chứa localhost, điện thoại khác chưa truy cập được. Sau khi kết nối Vercel, đặt VITE_SITE_URL bằng tên miền chính thức và tạo lại QR. Trên máy chiếu, dùng F11 để toàn màn hình.</p>{error && <p className="form-error">{error}</p>}</main>;
  return <main className="event-screen"><AdminEntry/><div className="scene-controls" aria-label="Điều khiển góc nhìn"><div className="zoom-controls"><button aria-label="Thu nhỏ" title="Thu nhỏ" disabled={view.zoom <= .65} onClick={() => setView(v => ({...v,zoom:Math.max(.65,Math.round((v.zoom - .1) * 100) / 100)}))}><Minus size={17}/></button><span>{Math.round(view.zoom * 100)}%</span><button aria-label="Phóng to" title="Phóng to" disabled={view.zoom >= 1.8} onClick={() => setView(v => ({...v,zoom:Math.min(1.8,Math.round((v.zoom + .1) * 100) / 100)}))}><Plus size={17}/></button></div><span className="control-divider"/><button className={view.autoRotate ? 'rotation-toggle active' : 'rotation-toggle'} aria-pressed={view.autoRotate} onClick={() => setView(v => ({...v,autoRotate:!v.autoRotate}))}>{view.autoRotate ? <Pause size={15}/> : <Play size={15}/>}<span>{view.autoRotate ? 'Dừng xoay' : 'Tự xoay'}</span></button><label className="speed-control">Tốc độ<input aria-label="Tốc độ tự xoay" type="range" min="0.5" max="5" step="0.5" value={view.speed} onChange={e => setView(v => ({...v,speed:Number(e.target.value)}))}/><output>{view.speed}×</output></label><button title="Về góc nhìn ban đầu" aria-label="Đặt lại góc nhìn" onClick={() => setView(v => ({zoom:1.2,autoRotate:false,speed:1,reset:v.reset + 1}))}><RotateCcw size={16}/></button></div><Suspense fallback={<div className="scene-loading-fallback"><div className="scene-loading-caption" role="status"><span className="scene-loading-mark"><Sprout size={32}/></span><p>Đang mở khu vườn yêu thương…</p></div></div>}><Tree wishes={presented.treeWishes} ready={presented.ready} arrival={arrival} view={view}/></Suspense><WishFeed shareUrl={shareUrl} wishes={presented.feed} loading={loading} connection={connection} error={error} total={presented.treeWishes.length}/></main>;
}





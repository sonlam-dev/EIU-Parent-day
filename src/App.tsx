import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, Download, Leaf, QrCode, Sprout } from 'lucide-react';
import QRCode from 'qrcode';
import { demo, fetchWishes, supabase } from './data';
import { type Wish } from './types';
import JoinPage from './JoinPage';
import { WishPresentation,nextWishInterval } from './WishPresentation';
import WishFeed from './WishFeed';
import AdminEntry from './AdminEntry';
import BrandLogo from './BrandLogo';
import LeafKeepsake from './LeafKeepsake';
import {readSavedLeaves,saveLeaf} from './SavedLeaves';
import SceneControls from './SceneControls';
import eiuLogo from './assets/eiu-logo.png';
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
  const [savedLeaves,setSavedLeaves]=useState(readSavedLeaves);
  const [selectedLeafId,setSelectedLeafId]=useState('');
  const [remembered,setRemembered]=useState(true);
  const myLeaf=savedLeaves.find(wish=>wish.id===selectedLeafId)||savedLeaves[0];
  const [receipt,setReceipt] = useState(()=>readSavedLeaves().length>0); const [formKey,setFormKey] = useState(0);
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
      timer.current = setTimeout(advance,nextWishInterval());
    }
    if (!playing.current) advance();
  },[wishes,loading,error,joining,setup,path]);
  useEffect(() => () => { clearTimeout(timer.current); playing.current = false; },[]);
  useEffect(() => { if (setup) void QRCode.toDataURL(shareUrl,{width:900,margin:3,errorCorrectionLevel:'M',color:{dark:'#254e36',light:'#ffffff'}}).then(setQr).catch(() => setError('Không tạo được QR.')); },[shareUrl,setup]);
  function submitted(wish: Wish) {setRemembered(saveLeaf(wish));setSavedLeaves(old=>[wish,...old.filter(row=>row.id!==wish.id)].slice(0,20));setSelectedLeafId(wish.id);void refresh(); setReceipt(true); setFormKey(k => k + 1); window.scrollTo({top:0,behavior:'smooth'}); }
  async function copy() { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); } catch { setError('Vui lòng chọn và sao chép liên kết trong ô.'); } }
  if (path.startsWith('/admin')) return <Suspense fallback={<div className="loading">Đang mở quản trị…</div>}><Admin/></Suspense>;
  if (joining) return <JoinPage receipt={receipt} myLeaf={myLeaf} savedLeaves={savedLeaves} remembered={remembered} formKey={formKey} sharedDemo={sharedDemo} loading={loading} wishes={wishes} error={error} onSuccess={submitted} onNewWish={()=>setReceipt(false)} onSelect={setSelectedLeafId} onReturn={()=>setReceipt(true)}/>;
  if (setup) return <main className="setup-page"><a href="/" className="text-btn"><ArrowLeft size={17}/> Về màn hình chiếu</a><Sprout size={35}/><h1>Chuẩn bị cho Parent Day</h1><p>Trang chiếu chỉ có cây, đồng cỏ và lời chúc. Sử dụng các liên kết ở đây để vận hành.</p><div className="setup-links"><a href="/" className="btn" target="_blank" rel="noreferrer">Mở màn hình chiếu <ArrowRight size={16}/></a><a href="/join" className="btn secondary" target="_blank" rel="noreferrer">Mở trang gửi lời chúc</a><a href="/admin" className="btn secondary">Duyệt lời chúc</a></div><div className="setup-qr"><QrCode size={24}/><h2>QR dành cho khách</h2>{qr && <img src={qr} alt="QR mở trang gửi lời chúc" width="260" height="260"/>}<input aria-label="Liên kết khách tham gia" value={shareUrl} readOnly onFocus={e => e.target.select()}/><div><button className="btn secondary" onClick={() => void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Đã chép' : 'Chép link'}</button>{qr && <a className="btn" href={qr} download="parent-day-qr.png"><Download size={16}/> Tải QR PNG</a>}</div></div><p className="setup-note">{demo ? 'Bản demo Wi-Fi đang dùng chung dữ liệu tạm trên máy. Quét QR bằng điện thoại cùng Wi-Fi và gửi lời chúc để thử trên màn hình chiếu. Dữ liệu được xóa khi server khởi động lại.' : 'Kết nối Supabase đã được cấu hình. Duyệt lời chúc tại /admin để đưa lên màn hình.'}</p><p className="setup-note">Nếu QR chứa localhost, điện thoại khác chưa truy cập được. Sau khi kết nối Vercel, đặt VITE_SITE_URL bằng tên miền chính thức và tạo lại QR. Trên máy chiếu, dùng F11 để toàn màn hình.</p>{error && <p className="form-error">{error}</p>}</main>;
  return <main className="event-screen"><AdminEntry url={new URL('/admin',shareUrl).href}/><SceneControls view={view} setView={setView}/><Suspense fallback={<div className="scene-loading-fallback"><div className="scene-loading-caption" role="status"><span className="scene-loading-mark"><Sprout size={32}/></span><p>Loading.......</p></div></div>}><Tree wishes={presented.treeWishes} ready={presented.ready} arrival={arrival} view={view}/></Suspense><WishFeed shareUrl={shareUrl} wishes={presented.feed} loading={loading} connection={connection} error={error} total={presented.treeWishes.length}/></main>;
}





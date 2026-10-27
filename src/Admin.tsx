import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Download, LogOut, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { supabase } from './data';
import type { Wish } from './types';
import AdminOperations from './AdminOperations';
import BrandLogo from './BrandLogo';

export default function Admin() {
  const [authReady,setAuthReady]=useState(false),[accessChecked,setAccessChecked]=useState(false),[accountId,setAccountId]=useState('');
  const [signedIn, setSignedIn] = useState(false); const [rows, setRows] = useState<Wish[]>([]); const [status, setStatus] = useState('pending'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [isAdmin, setIsAdmin] = useState(false);
  const load = useCallback(async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      const { data: allowed, error: permissionError } = await supabase.rpc('is_admin');
      if (permissionError || !allowed) { setIsAdmin(false); throw new Error('Tài khoản này chưa được cấp quyền quản trị trong bảng admins.'); }
      setIsAdmin(true);
      const collected: Wish[] = [];
      for (let from = 0; ; from += 500) {
        const { data, error: err } = await supabase.from('wishes').select('*').order('created_at', { ascending: false }).order('id').range(from, from + 499);
        if (err) throw err; collected.push(...data); if (data.length < 500) break;
      }
      setRows(collected); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được dữ liệu quản trị.'); } finally { setBusy(false); setAccessChecked(true); }
  }, []);
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {setSignedIn(!!data.session);setAccountId(data.session?.user.id || '');setAuthReady(true);});
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setSignedIn(!!session);setAccountId(session?.user.id || '');setAuthReady(true); if (!session) { setRows([]); setIsAdmin(false);setAccessChecked(false); } });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (signedIn) void load(); }, [signedIn, load]);
  useEffect(()=>{
    if(!supabase || !signedIn || !isAdmin) return;
    let refreshTimer:ReturnType<typeof setTimeout>;
    const channel=supabase.channel('parent-day-moderation').on('postgres_changes',{event:'*',schema:'public',table:'wishes'},()=>{
      clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>void load(),250);
    }).subscribe();
    const interval=setInterval(()=>void load(),15000);
    return ()=>{clearInterval(interval);clearTimeout(refreshTimer);void supabase!.removeChannel(channel);};
  },[signedIn,isAdmin,load]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase) return; const form = new FormData(e.currentTarget); setBusy(true); setError('');
    setAccessChecked(false);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
      if (err) setError('Đăng nhập thất bại. Kiểm tra email, mật khẩu và trạng thái xác nhận email.');
    } catch {setError('Chưa kết nối được Supabase. Vui lòng thử lại.');} finally {setBusy(false);}
  }
  async function moderate(id: string, next: 'approved' | 'rejected') {
    if (!supabase || busy) return; setBusy(true);
    const { data, error: err } = await supabase.from('wishes').update({ status: next }).eq('id', id).select('id');
    if (err || !data?.length) setError('Chưa cập nhật được lời chúc. Kiểm tra quyền và thử lại.');
    else { setRows(old => old.map(w => w.id === id ? { ...w, status: next } : w)); setError(''); } setBusy(false);
  }
  function exportCSV() {
    const cell = (s: string) => `"${(/^[\s]*[=+@\-]/.test(s) ? "'" : '') + s.replaceAll('"', '""')}"`;
    const text = '\uFEFF' + [['Tên', 'Gửi đến', 'Lời chúc', 'Màu', 'Trạng thái', 'Thời gian'], ...rows.map(w => [w.name, w.recipient, w.message, w.color, w.status, w.created_at])].map(r => r.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = 'parent-day-loi-chuc.csv'; link.click(); URL.revokeObjectURL(url);
  }
  return <main className="admin"><a className="text-btn" href="/"><ArrowLeft size={17}/> Về cây lời chúc</a><div className="admin-heading"><div><div className="eyebrow"><ShieldCheck size={16}/> BAN TỔ CHỨC</div><h1>Chăm sóc cây yêu thương</h1></div>{signedIn && <button className="btn secondary" onClick={() => void supabase!.auth.signOut()}><LogOut size={17}/> Đăng xuất</button>}</div>
    {!supabase ? <div className="admin-panel"><h2>Chưa kết nối Supabase</h2><p>Giao diện khách đang ở chế độ demo. Xem DEPLOY.md để tạo database, tài khoản quản trị và kết nối Vercel.</p></div> : !authReady ? <p role="status">Đang kiểm tra phiên đăng nhập…</p> : !signedIn ? <form className="admin-login admin-panel" onSubmit={login}><BrandLogo/><h2>Đăng nhập quản trị</h2><p>Dành cho ban tổ chức EIU Parent Day. Duyệt lời chúc để đưa chiếc lá lên cây.</p><label>Email<input type="email" name="email" required autoComplete="username"/></label><label>Mật khẩu<input type="password" name="password" required autoComplete="current-password"/></label><button className="btn" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button></form> : isAdmin ? <><div className="admin-stats">{['pending', 'approved', 'rejected'].map(s => <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}><strong>{rows.filter(w => w.status === s).length}</strong>{s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã hiển thị' : 'Đã ẩn'}</button>)}</div><div className="admin-toolbar"><button className="btn secondary" disabled={busy} onClick={() => void load()}><RefreshCw size={16}/> Tải lại</button><button className="btn secondary" onClick={exportCSV}><Download size={16}/> Xuất CSV tất cả</button><a className="btn secondary" href="/?screen=1" target="_blank" rel="noreferrer">Mở trình chiếu</a></div><AdminOperations total={rows.length} onChanged={load}/><div className="admin-list">{rows.filter(w => w.status === status).map(w => <article className="admin-panel" key={w.id}><span className="eyebrow">{w.name} → {w.recipient}</span>{w.source==='emergency' && <span className="admin-sample-badge">Lời mẫu Emergency</span>}<p>{w.message}</p><small>{new Date(w.created_at).toLocaleString('vi-VN')}</small><div>{w.status !== 'approved' && <button className="btn small" disabled={busy} onClick={() => void moderate(w.id, 'approved')}><Check size={16}/> Duyệt</button>}{w.status !== 'rejected' && <button className="btn secondary small" disabled={busy} onClick={() => void moderate(w.id, 'rejected')}><X size={16}/> Ẩn</button>}</div></article>)}{!rows.some(w => w.status === status) && <p className="empty">Không có lời chúc trong mục này.</p>}</div></> : !accessChecked ? <p role="status">Đang kiểm tra quyền truy cập…</p> : <div className="admin-panel"><h2>Tài khoản chưa có quyền quản trị</h2><p>Nhờ người quản lý dự án cấp quyền cho tài khoản này, sau đó bấm Kiểm tra lại.</p><p>Mã tài khoản của bạn:</p><code>{accountId}</code><button className="btn secondary" disabled={busy} onClick={() => void load()}>Kiểm tra lại</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </main>;
}

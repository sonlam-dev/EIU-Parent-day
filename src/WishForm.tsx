import { useRef, useState } from 'react';
import { Check, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { demo,submitDemoWish } from './data';
import { newId } from './newId';
import { colors, type Wish } from './types';
export default function WishForm({ onSuccess,sharedDemo = false }: { onSuccess: (wish: Wish) => void; sharedDemo?: boolean }) {
  const [color, setColor] = useState('green'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const requestId = useRef(newId());
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const form = new FormData(e.currentTarget);
    let deviceId = sessionStorage.getItem('parent-day-device');
    if (!deviceId) { deviceId = newId(); sessionStorage.setItem('parent-day-device', deviceId); }
    const payload = { name: String(form.get('name')).trim(), recipient: String(form.get('recipient')).trim(), message: message.trim(), color, website: String(form.get('website') || ''), requestId: requestId.current, deviceId };
    if (!payload.name || !payload.recipient || payload.message.length < 10) { setError('Vui lòng điền tên, người nhận và lời chúc ít nhất 10 ký tự.'); return; }
    setBusy(true); setError('');
    try {
      if (demo) {
        const wish: Wish = {...payload,id:payload.requestId,status:'approved',created_at:new Date().toISOString()};
        await submitDemoWish(wish,deviceId); onSuccess(wish);
      }
      else {
        const response = await fetch('/api/wishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
        const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Chưa gửi được lời chúc. Vui lòng thử lại.');
        onSuccess({id:result.id||payload.requestId,name:payload.name,recipient:payload.recipient,message:payload.message,color:payload.color,status:result.status==='approved' ? 'approved' : 'pending',created_at:new Date().toISOString()});
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Không gửi được lời chúc. Hãy thử lại.'); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="wish-form"><p>Mỗi lời chúc sẽ hiện trên một chiếc lá yêu thương của cây.</p><div className="form-row"><label>Tên phụ huynh<input name="name" placeholder="Ví dụ: Mẹ Lan, Ba Hùng…" maxLength={60} required autoComplete="name"/></label><label>Gửi đến con<input name="recipient" placeholder="Ví dụ: Hoàng Mỹ, Kỳ Duyên…" maxLength={60} required/></label></div><label>Lời nhắn từ trái tim<textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Gửi lời chúc, lời dặn dò yêu thương đến con…" minLength={10} maxLength={500} required rows={5}/><small className="char-count">{message.length}/500</small></label><fieldset><legend>Chọn sắc lá của bạn</legend><div className="color-picker">{colors.map(c => <button type="button" key={c.id} className={color === c.id ? 'chosen' : ''} aria-pressed={color === c.id} onClick={() => setColor(c.id)}><span style={{ background: c.hex }}>{color === c.id && <Check size={14}/>}</span>{c.label}</button>)}</div></fieldset><label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><label className="consent"><input type="checkbox" required/> <span>Tôi đồng ý để tên và lời chúc hiển thị công khai tại sự kiện. Tôi không chia sẻ thông tin riêng tư trong lời chúc.</span></label><div className="form-notice"><ShieldCheck size={17}/><span>{demo ? (sharedDemo ? 'Demo Wi-Fi: lời chúc hiển thị ngay trên cây chung.' : 'Chế độ demo: lời chúc chỉ lưu trên trình duyệt này.') : 'Lời chúc được ban tổ chức duyệt trước khi xuất hiện.'}</span></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn full" disabled={busy}><Send size={17}/>{busy ? 'Đang gửi yêu thương…' : 'Gửi lời chúc · Thêm một chiếc lá'}</button><span className="form-foot"><Sparkles size={13}/> Một lời chân thành cũng đủ làm ngày hôm nay đẹp hơn.</span></form>;
}



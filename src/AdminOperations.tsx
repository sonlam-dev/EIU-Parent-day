import {useRef,useState} from 'react';
import {Siren,Trash2,X} from 'lucide-react';
import {supabase} from './data';
import {newId} from './newId';
import './AdminOperations.css';
import {adminOperationError} from './AdminOperationError';

type Action='emergency'|'delete_all';
export default function AdminOperations({total,onChanged}:{total:number;onChanged:()=>Promise<void>}) {
  const [running,setRunning]=useState<Action|null>(null),[confirming,setConfirming]=useState(false);
  const [notice,setNotice]=useState(''),[error,setError]=useState('');
  const locked=useRef(false),requests=useRef<Partial<Record<Action,string>>>({});
  async function execute(action:Action) {
    if(!supabase || locked.current) return;
    locked.current=true;setRunning(action);setError('');setNotice('');
    // A failed request keeps its ID: retries cannot create duplicate batches or delete twice.
    const id=requests.current[action] ||= newId();
    try {
      const result=action==='emergency'
        ? await supabase.rpc('admin_emergency_wishes',{p_request_id:id}).abortSignal(AbortSignal.timeout(20000))
        : await supabase.rpc('admin_delete_all_wishes',{p_request_id:id,p_confirmation:'DELETE_ALL_WISHES'}).abortSignal(AbortSignal.timeout(20000));
      if(result.error) {
        throw new Error(adminOperationError(result.error));
      }
      delete requests.current[action];
      setNotice(action==='emergency' ? `Đã thêm ${result.data} lời chúc mẫu và lá thư tương ứng vào hàng đợi màn hình.` : `Đã xóa ${result.data} lời chúc. Màn hình và cây sẽ cập nhật theo Realtime.`);
      setConfirming(false);
      await onChanged();
    } catch(e) {setError(e instanceof Error ? e.message : 'Không kết nối được. Vui lòng thử lại.');}
    finally {locked.current=false;setRunning(null);}
  }
  return <section className="admin-operations" aria-label="Công cụ vận hành sự kiện">
    <div className="admin-operation-card"><span className="admin-operation-icon"><Siren size={22}/></span><div><h2>Emergency · Bổ sung lời chúc</h2><p>Mỗi lần thêm 10 lời ngắn của ba hoặc mẹ gửi cho con sinh viên, đủ 4 màu lá. Bộ 120 mẫu được duyệt ngay và quay vòng khi dùng hết. Mỗi lời xuất hiện cách nhau ngẫu nhiên 1–3 giây.</p><button className="btn" disabled={!!running} onClick={()=>void execute('emergency')}><Siren size={16}/>{running==='emergency' ? 'Đang thêm lời chúc…' : 'Thêm 10 lời mẫu'}</button></div></div>
    <div className="admin-operation-card admin-operation-danger"><span className="admin-operation-icon"><Trash2 size={22}/></span><div><h2>Xóa toàn bộ lời chúc</h2><p>Xóa vĩnh viễn mọi lời chúc chờ duyệt, đã duyệt, đã ẩn và lời mẫu. Các lá thư tương ứng cũng được gỡ khỏi cây.</p><button className="btn secondary" disabled={!!running || !total} onClick={()=>{setConfirming(true);setError('');}}><Trash2 size={16}/>Xóa tất cả</button></div></div>
    {confirming && <div className="admin-modal-backdrop" onClick={e=>{if(e.target===e.currentTarget && !running)setConfirming(false);}}>
      <div className="admin-delete-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delete-heading">
        <div className="admin-modal-icon"><Trash2 size={26}/></div>
        <h3 id="admin-delete-heading">Xác nhận xóa toàn bộ?</h3>
        <p>Thao tác này sẽ xóa vĩnh viễn toàn bộ <strong>{total.toLocaleString('vi')}</strong> lời chúc trên hệ thống và gỡ các chiếc lá tương ứng khỏi cây. Thao tác không thể hoàn tác.</p>
        <div className="admin-modal-actions">
          <button type="button" className="btn admin-delete-button" disabled={!!running} onClick={()=>void execute('delete_all')}>
            <Trash2 size={16}/>{running==='delete_all' ? 'Đang xóa…' : 'Xác nhận xóa'}
          </button>
          <button type="button" className="btn secondary" disabled={!!running} onClick={()=>setConfirming(false)}>
            <X size={16}/>Hủy bỏ
          </button>
        </div>
      </div>
    </div>}
    {notice && <p className="admin-operation-notice" role="status">{notice}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}

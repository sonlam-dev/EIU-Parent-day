import {ArrowRight,Leaf,Sprout} from 'lucide-react';
import BrandLogo from './BrandLogo';
import WishForm from './WishForm';
import LeafKeepsake from './LeafKeepsake';
import {demo} from './data';
import type {Wish} from './types';

type Props={receipt:boolean;myLeaf:Wish|undefined;savedLeaves:Wish[];remembered:boolean;formKey:number;sharedDemo:boolean;loading:boolean;wishes:Wish[];error:string;onSuccess:(wish:Wish)=>void;onNewWish:()=>void;onSelect:(id:string)=>void;onReturn:()=>void};
export default function JoinPage(props:Props) {
  const {receipt,myLeaf,savedLeaves,remembered,formKey,sharedDemo,loading,wishes,error,onSuccess,onNewWish,onSelect,onReturn}=props;
  const approved=myLeaf&&(myLeaf.status==='approved'||wishes.some(wish=>wish.id===myLeaf.id));
  return <main className="join-page">
    <header className="join-header"><a href="/join" className="join-brand"><BrandLogo/><span className="join-brand-title"><Sprout size={20}/> Cây yêu thương</span><span className="join-brand-tag">PARENT DAY</span></a></header>
    <section className="join-content">
      {receipt&&myLeaf ? <div className="join-success">
        <span className="join-overline">CHIẾC LÁ YÊU THƯƠNG CỦA BẠN</span>
        <h1>Lời chúc cho con,<br/><em>lưu trên một chiếc lá.</em></h1>
        <p role="status">{approved ? 'Lời chúc của bạn đã có trên chiếc lá của cây yêu thương.' : 'Đã nhận lời chúc. Chiếc lá sẽ xuất hiện trên cây chung sau khi ban tổ chức duyệt.'}</p>
        {savedLeaves.length>1&&<label className="saved-leaf-picker">Xem lại những chiếc lá đã gửi<select value={myLeaf.id} onChange={event=>onSelect(event.target.value)}>{savedLeaves.map(wish=><option key={wish.id} value={wish.id}>{wish.name} → {wish.recipient} · {new Date(wish.created_at).toLocaleDateString('vi-VN')}</option>)}</select></label>}
        <LeafKeepsake wish={myLeaf}/>
        {!remembered&&<p className="form-error" role="alert">Trình duyệt không cho lưu chiếc lá để mở lại bằng QR. Hãy mở bằng trình duyệt thông thường và cho phép lưu dữ liệu trang.</p>}
        <p className="leaf-storage-note">Chiếc lá được lưu trên trình duyệt này. Khi quét lại QR, hãy mở bằng cùng trình duyệt và không xóa dữ liệu trang.</p>
        <button className="btn secondary full" onClick={onNewWish}>Gửi thêm một lời chúc <ArrowRight size={18}/></button>
        <a href="/" className="join-back"><Leaf size={16}/> Ngắm cây yêu thương</a>
      </div> : <>
        <span className="join-overline">MỖI LỜI YÊU THƯƠNG · MỘT CHIẾC LÁ</span>
        <h1>Có lời yêu thương,<br/><em>hãy nói hôm nay.</em></h1>
        <p className="join-description">Gửi lời chúc đến con và các bạn sinh viên EIU. Một chiếc lá có sẵn trên cây sẽ đổi sang màu bạn chọn. Khi quét lại QR trên cùng thiết bị và trình duyệt, hình chiếc lá có lời chúc của bạn sẽ tự hiện ra.</p>
        {savedLeaves.length>0&&<button className="btn secondary full saved-leaf-return" onClick={onReturn}><Leaf size={17}/> Xem chiếc lá đã gửi</button>}
        <div className="join-form-card"><div className="join-form-brand"><BrandLogo/><span>PARENT DAY</span></div><WishForm key={formKey} onSuccess={onSuccess} sharedDemo={sharedDemo}/></div>
        <p className="join-community"><Leaf size={15}/>{loading ? 'Đang đón những lời yêu thương…' : `${wishes.length.toLocaleString('vi')} chiếc lá yêu thương đã có trên cây`}</p>
      </>}
      {demo&&<p className="join-demo">{sharedDemo ? 'Demo Wi-Fi · Lời chúc dùng chung trong phiên local này' : 'Bản trải nghiệm · Dữ liệu chỉ lưu trên trình duyệt này'}</p>}
      {error&&<p role="alert" className="form-error">{error}</p>}
    </section>
    <footer className="join-footer">Eastern International University · Parent Day</footer>
  </main>;
}

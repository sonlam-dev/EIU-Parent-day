import {useLayoutEffect,useRef,useState} from 'react';
import {Mail,Wifi,WifiOff} from 'lucide-react';
import type {Wish} from './types';
import {colors} from './types';
import EnvelopeWish from './EnvelopeWish';

type Props={wishes:Wish[];loading:boolean;connection:'connecting'|'live'|'retrying'|'demo';error:string;total:number};
export default function WishFeed({wishes,loading,connection,error,total}:Props) {
  const [track,setTrack]=useState({rows:wishes,scrolling:false});
  const previous=useRef(wishes);
  const [selected,setSelected]=useState<Wish|null>(null);
  const signature=JSON.stringify(wishes);
  useLayoutEffect(()=>{
    const old=previous.current; previous.current=wishes;
    const scroll=old.length===5 && wishes.length===5 && old.slice(1).every((w,i)=>w.id===wishes[i].id) && old[4].id!==wishes[4].id;
    if(!scroll) { setTrack({rows:wishes,scrolling:false}); return; }
    setTrack({rows:[...old,wishes[4]],scrolling:true});
    const timer=setTimeout(()=>setTrack({rows:wishes,scrolling:false}),650);
    return ()=>clearTimeout(timer);
  },[signature]);
  const labels={connecting:'Đang kết nối',live:'Đang nhận lời chúc',retrying:'Đang kết nối lại',demo:'Bản trải nghiệm'};
  return <>
    <section className="wish-feed" aria-label="Năm lời chúc mới nhất">
      <header className="wish-feed-header"><span className="wish-feed-icon"><Mail size={20}/></span><div><span>EIU PARENT DAY</span><h1>Những lời yêu thương</h1></div><span className="wish-feed-total">{total.toLocaleString('vi')}<small>lá thư</small></span></header>
      <div className="wish-feed-viewport">
        <div className={`wish-feed-track ${track.scrolling ? 'wish-feed-scrolling' : ''}`}>
          {track.rows.map(wish=><article className="wish-feed-row" key={wish.id}>
            <button className="wish-feed-card" onClick={()=>setSelected(wish)} aria-label={`Đọc lời chúc của ${wish.name} gửi ${wish.recipient}`}>
              <span className="wish-feed-recipient"><i style={{background:colors.find(c=>c.id===wish.color)?.hex}}/>Gửi {wish.recipient}</span>
              <p>{wish.message}</p><span className="wish-feed-author">— {wish.name}</span>
            </button>
          </article>)}
        </div>
        {!wishes.length && <p className="wish-feed-empty">{loading ? 'Đang đón những lời yêu thương…' : 'Gửi lời chúc đầu tiên để cùng vun đắp cây yêu thương.'}</p>}
      </div>
      <footer className="wish-feed-status" data-connection={error ? 'retrying' : connection} role="status">{error || connection==='retrying' ? <WifiOff size={13}/> : <Wifi size={13}/>}<span>{error ? 'Đang kết nối lại · giữ các lời chúc đã nhận' : labels[connection]}</span></footer>
    </section>
    {selected && <EnvelopeWish key={selected.id} wish={selected} onClose={()=>setSelected(null)}/>}
  </>;
}

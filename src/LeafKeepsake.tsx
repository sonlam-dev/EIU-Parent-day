import {useEffect,useState} from 'react';
import type {Wish} from './types';
import {leafPng} from './LeafArtwork';

export default function LeafKeepsake({wish}:{wish:Wish}) {
  const [image,setImage]=useState(''),[error,setError]=useState('');
  useEffect(()=>{
    let active=true,url='';setImage('');setError('');
    void leafPng(wish).then(blob=>{if(!active)return;url=URL.createObjectURL(blob);setImage(url);}).catch(()=>{if(active)setError('Chưa hiển thị được hình chiếc lá. Vui lòng tải lại trang.');});
    return()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[wish]);
  return <div className="leaf-keepsake" aria-busy={!image&&!error}>{image ? <img src={image} width="1600" height="1400" alt={`Chiếc lá của ${wish.name} gửi ${wish.recipient}: ${wish.message}`}/> : !error&&<p role="status">Đang mở chiếc lá của bạn…</p>}{error&&<p className="form-error" role="alert">{error}</p>}</div>;
}

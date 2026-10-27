import type {Wish} from './types.ts';

const palettes:Record<string,[string,string]>={green:['#edf5bb','#87b45d'],gold:['#fff0ae','#cfb850'],pink:['#ffe6df','#d39b9f'],sage:['#e0f1cf','#71aa99']};

/** Wrap whole words; only split a token when it cannot fit on a line by itself. */
export function wrapLeafText(ctx:Pick<CanvasRenderingContext2D,'measureText'>,text:string,width:number) {
  const lines:string[]=[];
  for(const paragraph of text.split(/\r?\n/)) {
    let line='';
    for(const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      if(ctx.measureText(line ? `${line} ${word}` : word).width<=width) {line=line ? `${line} ${word}` : word;continue;}
      if(line) {lines.push(line);line='';}
      for(const char of word) {
        if(line && ctx.measureText(line+char).width>width) {lines.push(line);line='';}
        line+=char;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Shared artwork for both the 3D leaf atlas and the parent's downloadable PNG. */
export function drawWishLeaf(ctx:CanvasRenderingContext2D,wish:Wish,width:number,height:number) {
  ctx.save();ctx.scale(width/1000,height/760);
  const [light,dark]=palettes[wish.color]||palettes.green;
  ctx.beginPath();ctx.moveTo(72,650);ctx.bezierCurveTo(10,270,295,25,920,83);
  ctx.bezierCurveTo(1010,430,780,765,72,650);ctx.closePath();
  const gradient=ctx.createLinearGradient(200,150,800,650);gradient.addColorStop(0,light);gradient.addColorStop(1,dark);
  ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=5;ctx.stroke();
  ctx.save();ctx.clip();ctx.globalAlpha=.16;ctx.strokeStyle='#41673d';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(65,665);ctx.quadraticCurveTo(440,400,930,80);ctx.stroke();
  for(let i=0;i<7;i++) {
    const x=180+i*95,y=610-i*65;
    for(const side of [-1,1]) {ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+side*45,y-120,x+side*170,y-160);ctx.stroke();}
  }
  ctx.restore();
  ctx.fillStyle='#244b37';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='500 26px "Be Vietnam Pro", sans-serif';
  const recipient=wrapLeafText(ctx,`Gửi ${wish.recipient}`,580);
  recipient.forEach((line,i)=>ctx.fillText(line,510,190+i*30));
  let font=40,lines:string[]=[];
  do {ctx.font=`500 ${font}px "Be Vietnam Pro", sans-serif`;lines=wrapLeafText(ctx,wish.message,600);if(lines.length*font*1.4<=245)break;font-=1;} while(font>12);
  const start=390-(lines.length-1)*font*1.4/2;
  lines.forEach((line,i)=>ctx.fillText(line,510,start+i*font*1.4));
  ctx.font='500 24px "Be Vietnam Pro", sans-serif';
  const sender=wrapLeafText(ctx,`Thương con, ${wish.name}`,550);
  sender.forEach((line,i)=>ctx.fillText(line,510,565+i*28));
  ctx.restore();
}

export async function leafPng(wish:Wish):Promise<Blob> {
  await document.fonts?.ready;
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1400;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#f5f8ed';ctx.fillRect(0,0,1600,1400);
  ctx.fillStyle='#245741';ctx.textAlign='center';ctx.font='600 32px "Be Vietnam Pro", sans-serif';
  ctx.fillText('EIU · PARENT DAY',800,135);
  ctx.font='500 50px Georgia, serif';ctx.fillText('Chiếc lá yêu thương',800,220);
  ctx.save();ctx.translate(60,300);drawWishLeaf(ctx,wish,1480,900);ctx.restore();
  ctx.fillStyle='#617e5d';ctx.font='24px "Be Vietnam Pro", sans-serif';
  ctx.fillText('Eastern International University · Lưu giữ lời yêu thương',800,1300);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob ? resolve(blob) : reject(new Error('Chưa tạo được hình chiếc lá.')),'image/png'));
}

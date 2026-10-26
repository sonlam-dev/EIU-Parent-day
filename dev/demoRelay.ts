import type { Plugin } from 'vite';
import { networkInterfaces } from 'node:os';
import { sampleWishes } from '../src/sampleWishes.ts';
import type { Wish } from '../src/types';
import { validateSubmission } from '../api/_lib/validation.ts';

/** Local Vite only. Shared in-memory demo allows a phone's QR submission to reach the projector. */
export function demoRelay(): Plugin {
  const wishes: Wish[] = [...sampleWishes];
  return {name:'parent-day-lan-demo',configureServer(server) {
    server.middlewares.use(async (req,res,next) => {
      const path = req.url?.split('?')[0];
      if (path !== '/api/demo/info' && path !== '/api/demo/wishes') return next();
      res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store');
      const json = (status: number,value: unknown) => { res.statusCode = status; res.end(JSON.stringify(value)); };
      if (req.headers['sec-fetch-site'] === 'cross-site') return json(403,{error:'Hãy mở trang sự kiện để gửi lời chúc.'});
      if (path === '/api/demo/info') {
        const addresses = Object.entries(networkInterfaces()).flatMap(([name,list]) => (list || []).filter(a => a.family === 'IPv4' && !a.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address)).map(a => ({name,address:a.address})));
        const preferred = addresses.find(a => /wi-?fi|wireless|wlan/i.test(a.name)) || addresses[0];
        return json(200,{shared:true,origin:preferred ? `http://${preferred.address}:${server.config.server.port || 3000}` : ''});
      }
      if (req.method === 'GET') return json(200,{wishes});
      if (req.method !== 'POST') return json(405,{error:'Phương thức không hợp lệ.'});
      try {
        let text = '';
        for await (const chunk of req) { text += chunk; if (text.length > 8192) return json(413,{error:'Nội dung quá dài.'}); }
        const input = validateSubmission(JSON.parse(text));
        const old = wishes.find(w => w.id === input.requestId);
        if (!old) {
          wishes.unshift({id:input.requestId,name:input.name,recipient:input.recipient,message:input.message,color:input.color,status:'approved',created_at:new Date().toISOString()});
        }
        return json(201,{id:input.requestId,status:'approved'});
      } catch (e) { return json(400,{error:e instanceof Error ? e.message : 'Dữ liệu không hợp lệ.'}); }
    });
  }};
}

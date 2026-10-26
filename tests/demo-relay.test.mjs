import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { demoRelay } from '../dev/demoRelay.ts';

test('QR demo shares submissions across clients and keeps retries to one leaf',async () => {
  let middleware;
  const config = {server:{port:3000}};
  demoRelay().configureServer({config,middlewares:{use(fn){middleware=fn;}}});
  const server = createServer((req,res) => { void middleware(req,res,() => {res.statusCode=404;res.end();}); });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  config.server.port = server.address().port;
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const info = await fetch(`${origin}/api/demo/info`).then(r => r.json()); assert.equal(info.shared,true);
    const before = await fetch(`${origin}/api/demo/wishes`).then(r => r.json());
    const input = {requestId:'267d0626-a204-488f-8eb3-05d5762e43ec',deviceId:'0ac90434-98ad-42a4-b45e-510063291f4e',name:'Điện thoại thử nghiệm',recipient:'Ba mẹ',message:'Chúc ba mẹ luôn mạnh khỏe và bình an.',color:'green'};
    const post = () => fetch(`${origin}/api/demo/wishes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    assert.equal((await post()).status,201); assert.equal((await post()).status,201);
    const after = await fetch(`${origin}/api/demo/wishes`).then(r => r.json());
    assert.equal(after.wishes.length,before.wishes.length + 1);
    assert.equal(after.wishes[0].id,input.requestId); assert.equal(after.wishes[0].status,'approved');
    assert.equal((await fetch(`${origin}/api/demo/wishes`,{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

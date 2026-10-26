import {loadEnv} from 'vite';
import {createClient} from '@supabase/supabase-js';

// Print diagnostics only. Never log API keys, wish contents, or raw network errors.
const env=loadEnv('development',process.cwd(),'');
const url=env.SUPABASE_URL || env.VITE_SUPABASE_URL;
if(!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) {
  console.log('SUPABASE_HOST_UNEXPECTED_OR_MISSING'); process.exit(1);
}
const options={auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(12000)})}};
const publicDb=createClient(url,env.VITE_SUPABASE_ANON_KEY,options);
const serverDb=createClient(url,env.SUPABASE_SERVICE_ROLE_KEY,options);
await Promise.all([
  (async()=>{
    for(const status of ['approved','pending','rejected']) {
      const result=await serverDb.from('wishes').select('id',{head:true,count:'exact'}).eq('status',status);
      console.log(JSON.stringify({check:'server_database',status,httpStatus:result.status,count:result.count,errorCode:result.error?.code,networkFailure:result.status===0}));
    }
    const admins=await serverDb.from('admins').select('user_id',{head:true,count:'exact'});
    console.log(JSON.stringify({check:'admin_memberships',httpStatus:admins.status,count:admins.count,errorCode:admins.error?.code}));
    try {
      const response=await fetch(`${url}/rest/v1/`,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(12000)});
      const schema=await response.json();
      console.log(JSON.stringify({check:'submit_function',httpStatus:response.status,exists:!!schema.paths?.['/rpc/submit_wish']}));
    } catch {console.log('SUBMIT_FUNCTION_CHECK_NETWORK_FAILED');}
  })(),
  (async()=>{
    const result=await publicDb.from('wishes').select('id',{head:true,count:'exact'}).eq('status','approved');
    console.log(JSON.stringify({check:'public_read_approved',httpStatus:result.status,count:result.count,errorCode:result.error?.code,networkFailure:result.status===0}));
    await new Promise(resolve=>{
      const timeout=setTimeout(()=>{console.log('REALTIME_CHECK_TIMEOUT');resolve();},12000);
      publicDb.channel('env-diagnostics').on('postgres_changes',{event:'*',schema:'public',table:'wishes'},()=>{}).subscribe(status=>{
        if(['SUBSCRIBED','CHANNEL_ERROR','TIMED_OUT'].includes(status)) { console.log(JSON.stringify({check:'realtime_subscription',status}));clearTimeout(timeout);resolve(); }
      });
    });
    await publicDb.removeAllChannels();
  })(),
  ...[env.VITE_SITE_URL,'http://localhost:3000'].filter(Boolean).map(async(origin)=>{
    for(const path of ['/api/wishes','/api/demo/info']) {
      try {
        const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(12000)});
        console.log(JSON.stringify({check:origin==='http://localhost:3000'?'local_route':'site_route',path,httpStatus:response.status,contentType:response.headers.get('content-type')}));
      } catch { console.log(JSON.stringify({check:origin==='http://localhost:3000'?'local_route':'site_route',path,networkFailure:true})); }
    }
  }),
]);

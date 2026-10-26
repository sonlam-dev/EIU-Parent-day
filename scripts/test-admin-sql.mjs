// Isolated PostgreSQL QA. Install once with:
// npm.cmd install --prefix artifacts/sql-qa --no-save --no-package-lock @electric-sql/pglite
import {PGlite} from '../artifacts/sql-qa/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const db=new PGlite();
const admin='00000000-0000-4000-8000-000000000001',outsider='00000000-0000-4000-8000-000000000002';
const value=async(sql,args=[]) => (await db.query(sql,args)).rows[0].value;
async function identity(role,id='') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec(`set role ${role}`);
}
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create publication supabase_realtime;
    create schema auth;
    create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as
    $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    insert into auth.users(id) values('${admin}'),('${outsider}');
  `);
  await db.exec(fs.readFileSync('supabase/migrations/001_wish_tree.sql','utf8'));
  const migration=fs.readFileSync('supabase/migrations/003_admin_operations.sql','utf8');
  await db.exec(migration);await db.exec(migration);
  await db.exec(fs.readFileSync('supabase/migrations/004_fix_admin_delete.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/005_parent_to_child_samples.sql','utf8'));
  const upgrade=fs.readFileSync('supabase/migrations/006_ten_colorful_parent_wishes.sql','utf8');
  await db.exec(upgrade);await db.exec(upgrade);
  const samples=(await db.query('select recipient,message from public.emergency_samples')).rows;
  assert.ok(samples.every(sample=>sample.recipient==='Con yêu' && /ba mẹ/i.test(sample.message)));
  const definition=await value("select pg_get_functiondef('public.admin_delete_all_wishes(uuid,text)'::regprocedure) as value");
  assert.match(definition,/delete from public\.wishes where id is not null/i);
  assert.equal(await value('select count(*)::int as value from public.emergency_samples'),120);
  await db.query('insert into public.admins(user_id) values($1)',[admin]);
  await identity('anon');
  await assert.rejects(()=>value('select public.admin_emergency_wishes($1) as value',[randomUUID()]),/permission denied/i);
  await identity('authenticated',outsider);
  await assert.rejects(()=>value('select public.admin_emergency_wishes($1) as value',[randomUUID()]),/ADMIN_REQUIRED/);
  await assert.rejects(()=>value("select public.admin_delete_all_wishes($1,'DELETE_ALL_WISHES') as value",[randomUUID()]),/ADMIN_REQUIRED/);
  console.log('PASS: anonymous and non-admin users cannot run admin operations.');
  await identity('authenticated',admin);
  await assert.rejects(()=>db.query('select * from public.emergency_samples'),/permission denied/i);
  await assert.rejects(()=>db.query('delete from public.wishes'),/permission denied/i);
  let total=0;
  for(let i=0;i<13;i++) {
    const id=randomUUID(),count=await value('select public.admin_emergency_wishes($1) as value',[id]);
    assert.equal(count,10);total+=count;
    assert.equal(await value('select public.admin_emergency_wishes($1) as value',[id]),count);
    assert.equal(await value('select count(*)::int as value from public.wishes'),total);
    const batch=(await db.query('select color from public.wishes order by created_at desc limit 10')).rows;
    assert.equal(new Set(batch.map(w=>w.color)).size,4);
  }
  const rows=(await db.query('select * from public.wishes order by created_at,id')).rows;
  assert.equal(new Set(rows.slice(0,120).map(w=>w.message)).size,120);
  assert.equal(rows[120].message,rows[0].message);
  for(const color of ['green','gold','pink','sage']) assert.equal(rows.slice(0,120).filter(w=>w.color===color).length,30);
  assert.equal(new Set(rows.map(w=>w.id)).size,total);
  assert.ok(rows.every(w=>w.status==='approved' && w.source==='emergency'));
  console.log('PASS: each press creates exactly 10 letters with four colors, 120 samples cycle, retries do not duplicate.');
  await identity('postgres');
  await db.exec(`insert into public.wishes(id,name,recipient,message,color,status)
    select gen_random_uuid(),'Guest','Family','A meaningful test wish','green',s
    from unnest(array['pending','approved','rejected']) as s;`);
  total+=3;
  await identity('authenticated',admin);
  await assert.rejects(()=>value("select public.admin_delete_all_wishes($1,'wrong') as value",[randomUUID()]),/CONFIRMATION_REQUIRED/);
  assert.equal(await value('select count(*)::int as value from public.wishes'),total);
  const deletion=randomUUID();
  assert.equal(await value("select public.admin_delete_all_wishes($1,'DELETE_ALL_WISHES') as value",[deletion]),total);
  assert.equal(await value('select count(*)::int as value from public.wishes'),0);
  assert.equal(await value('select public.is_admin()::int as value'),1);
  const newBatch=await value('select public.admin_emergency_wishes($1) as value',[randomUUID()]);
  assert.equal(await value("select public.admin_delete_all_wishes($1,'DELETE_ALL_WISHES') as value",[deletion]),total);
  assert.equal(await value('select count(*)::int as value from public.wishes'),newBatch);
  console.log('PASS: deletion requires confirmation, clears all wishes, and a retried delete preserves later batches.');
  await identity('anon');
  assert.equal(await value('select count(*)::int as value from public.wishes'),newBatch);
  console.log('PASS: public clients can read the approved emergency wishes through existing RLS.');
} catch(error) {
  console.error(JSON.stringify({message:error.message,code:error.code,detail:error.detail,where:error.where}));
  process.exitCode=1;
} finally {await db.close();}

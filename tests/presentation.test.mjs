import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WishPresentation,nextWishInterval} from '../src/WishPresentation.ts';
const wish=(i,status='approved')=>({id:`wish-${i}`,name:`Guest ${i}`,recipient:'Gia đình',message:`Lời yêu thương số ${i}`,color:'green',status,created_at:new Date(1700000000000+i*1000).toISOString()});
const ids=rows=>rows.map(w=>w.id);

test('Each arrival gets a fresh random interval between one and three seconds',()=>{
  let calls=0;
  const random=()=>[0,.5,1][calls++];
  assert.deepEqual([nextWishInterval(random),nextWishInterval(random),nextWishInterval(random)],[1000,2000,3000]);
  assert.equal(calls,3);
});

test('History restores all letters and the latest five cards without replay',()=>{
  const display=new WishPresentation(),snapshot=Array.from({length:9},(_,i)=>wish(i));
  const state=display.ingest(snapshot.reverse());
  assert.equal(state.treeWishes.length,9);
  assert.deepEqual(ids(state.feed),['wish-4','wish-5','wish-6','wish-7','wish-8']);
  assert.equal(display.next(),undefined);
});
test('Sixth wish rolls the five-card window while every card gets exactly one retained letter',()=>{
  const display=new WishPresentation(); display.ingest([]);
  const snapshot=Array.from({length:12},(_,i)=>wish(i)).reverse();
  display.ingest(snapshot); display.ingest(snapshot);
  for(let i=0;i<12;i++) {
    const state=display.next();
    assert.equal(state.wish.id,`wish-${i}`);
    assert.equal(state.treeWishes.length,i+1);
    assert.equal(new Set(ids(state.treeWishes)).size,i+1);
    assert.deepEqual(ids(state.feed),Array.from({length:Math.min(5,i+1)},(_,j)=>`wish-${Math.max(0,i-4)+j}`));
    display.ingest(snapshot);
  }
  assert.equal(display.next(),undefined);
});
test('Moderation removes cards, letters, and pending arrivals; edited queued content stays current',()=>{
  const display=new WishPresentation(); display.ingest([wish(0),wish(1)]);
  display.ingest([wish(1),wish(2),wish(3)]);
  const state=display.ingest([wish(1),{...wish(3),message:'Nội dung đã sửa'},wish(4,'pending')]);
  assert.deepEqual(ids(state.treeWishes),['wish-1']);
  assert.deepEqual(ids(state.feed),['wish-1']);
  const next=display.next(); assert.equal(next.wish.id,'wish-3'); assert.equal(next.wish.message,'Nội dung đã sửa');
  assert.equal(display.next(),undefined);
});
test('Reapproval presents an old letter once at the end of the feed',()=>{
  const display=new WishPresentation(),snapshot=Array.from({length:7},(_,i)=>wish(i));
  display.ingest(snapshot); display.ingest(snapshot.slice(1)); display.ingest(snapshot);
  assert.equal(display.next().feed.at(-1).id,'wish-0');
  assert.equal(display.ingest(snapshot).feed.at(-1).id,'wish-0');
  assert.equal(display.next(),undefined);
});

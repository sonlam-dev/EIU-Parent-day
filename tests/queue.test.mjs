import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WishQueue } from '../src/WishQueue.ts';
const wish = (id,minute,status = 'approved') => ({id,name:id,recipient:'Ba mẹ',message:'Chúc ba mẹ luôn mạnh khỏe',color:'green',status,created_at:`2026-10-26T09:${String(minute).padStart(2,'0')}:00Z`});
test('Initial database snapshot shows latest without replaying historical animations', () => { const q = new WishQueue(); assert.equal(q.ingest([wish('b',2),wish('a',1)]).latest.id,'b'); assert.equal(q.next(),undefined); });
test('A realtime batch queues every new wish oldest first and ignores repeated snapshots', () => { const q = new WishQueue(); q.ingest([wish('a',1)]); const data = [wish('d',4),wish('c',3),wish('b',2),wish('a',1)]; q.ingest(data); q.ingest(data); assert.deepEqual([q.next().id,q.next().id,q.next().id],['b','c','d']); assert.equal(q.next(),undefined); });
test('New arrivals during a flight join the queue without replacing it', () => { const q = new WishQueue(); q.ingest([]); q.ingest([wish('b',2),wish('a',1)]); assert.equal(q.next().id,'a'); q.ingest([wish('c',3),wish('b',2),wish('a',1)]); assert.deepEqual([q.next().id,q.next().id],['b','c']); });
test('Moderated removals are dropped from pending; only approved wishes enter', () => { const q = new WishQueue(); q.ingest([]); q.ingest([wish('a',1),wish('b',2),wish('pending',3,'pending')]); q.ingest([wish('b',2)]); assert.equal(q.next().id,'b'); assert.equal(q.next(),undefined); });
test('Duplicate rows queue once, and reapproved wishes can be featured again', () => { const q=new WishQueue(); q.ingest([]); q.ingest([wish('a',1),wish('a',1)]); assert.equal(q.next().id,'a'); assert.equal(q.next(),undefined); q.ingest([]); q.ingest([wish('a',1)]); assert.equal(q.next().id,'a'); });

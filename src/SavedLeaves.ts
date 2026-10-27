import type {Wish} from './types.ts';
const key='parent-day-my-leaves-v1';
type StorageAccess=Pick<Storage,'getItem'|'setItem'>;
export function readSavedLeaves(storage?:StorageAccess):Wish[] {
  try {
    const rows:unknown=JSON.parse((storage??globalThis.localStorage).getItem(key)||'[]');
    return Array.isArray(rows) ? rows.filter((row):row is Wish=>!!row && typeof row.id==='string' && typeof row.name==='string' && typeof row.recipient==='string' && typeof row.message==='string' && typeof row.color==='string' && ['pending','approved','rejected'].includes(row.status) && typeof row.created_at==='string').slice(0,20) : [];
  } catch {return [];}
}
export function saveLeaf(wish:Wish,storage?:StorageAccess) {
  try {const target=storage??globalThis.localStorage;target.setItem(key,JSON.stringify([wish,...readSavedLeaves(target).filter(row=>row.id!==wish.id)].slice(0,20)));return true;} catch {return false;}
}

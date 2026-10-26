import { sampleWishes } from './sampleWishes';
import { createClient } from '@supabase/supabase-js';
import type { Wish } from './types';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key && !url.includes('YOUR_PROJECT') ? createClient(url, key) : null;
export const demo = !supabase;
export { sampleWishes } from './sampleWishes';
export function getDemoWishes(): Wish[] {
  try { return JSON.parse(localStorage.getItem('parent-day-wishes') || 'null') || sampleWishes; } catch { return sampleWishes; }
}
export function saveDemoWish(wish: Wish) {
  const wishes = [wish, ...getDemoWishes()];
  localStorage.setItem('parent-day-wishes', JSON.stringify(wishes));
  return wishes;
}
export async function fetchWishes(): Promise<Wish[]> {
  if (!supabase) {
    if (import.meta.env.DEV) {
      const response = await fetch('/api/demo/wishes',{signal:AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error('Chưa kết nối được bản demo Wi-Fi.');
      const result = await response.json(); return result.wishes;
    }
    return getDemoWishes();
  }
  // Pagination prevents the default PostgREST 1,000-row limit hiding older leaves.
  const result: Wish[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase.from('wishes').select('*').eq('status', 'approved').order('created_at', { ascending: false }).order('id').range(from, from + 499);
    if (error) throw error;
    result.push(...data);
    if (data.length < 500) break;
  }
  return result;
}
export async function submitDemoWish(wish: Wish,deviceId: string) {
  if (!import.meta.env.DEV) { saveDemoWish(wish); return; }
  const response = await fetch('/api/demo/wishes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...wish,requestId:wish.id,deviceId}),signal:AbortSignal.timeout(10000)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Chưa gửi được lời chúc.');
}


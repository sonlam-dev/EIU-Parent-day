import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';
import { validateSubmission } from './_lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Chỉ hỗ trợ gửi lời chúc.' }); }
  if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'Vui lòng gửi từ trang sự kiện.' });
  if (!req.headers['content-type']?.includes('application/json')) return res.status(415).json({ error: 'Định dạng không hợp lệ.' });
  if (Number(req.headers['content-length']) > 8192 || JSON.stringify(req.body ?? '').length > 8192) return res.status(413).json({ error: 'Nội dung quá dài.' });
  let payload;
  try { payload = validateSubmission(req.body); } catch (e) { return res.status(400).json({ error: e instanceof Error ? e.message : 'Dữ liệu không hợp lệ.' }); }
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RATE_LIMIT_SALT } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RATE_LIMIT_SALT) return res.status(503).json({ error: 'Hệ thống chưa sẵn sàng nhận lời chúc. Vui lòng liên hệ ban tổ chức.' });
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  // Vercel sets x-forwarded-for. Never store the raw IP in the database.
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const hash = (s: string) => createHmac('sha256', RATE_LIMIT_SALT).update(s).digest('hex');
  try {
    const { data, error } = await db.rpc('submit_wish', { p_id: payload.requestId, p_name: payload.name, p_recipient: payload.recipient, p_message: payload.message, p_color: payload.color, p_ip_hash: hash(`ip:${ip}`), p_device_hash: hash(`device:${payload.deviceId}`) });
    if (error) {
      if (error.message.includes('RATE_LIMIT')) { res.setHeader('Retry-After', '600'); return res.status(429).json({ error: 'Bạn đã gửi nhiều lời chúc liên tiếp. Hãy thử lại sau 10 phút nhé.' }); }
      console.error('Wish submission failed', { code: error.code });
      return res.status(500).json({ error: 'Chưa lưu được lời chúc. Hãy thử lại sau ít phút.' });
    }
    return res.status(201).json({ id: data.id, status: data.status });
  } catch { return res.status(503).json({ error: 'Kết nối đang gián đoạn. Vui lòng thử lại.' }); }
}

export type Submission = { name: string; recipient: string; message: string; color: string; requestId: string; deviceId: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateSubmission(body: unknown): Submission {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dữ liệu không hợp lệ.');
  const v = body as Record<string, unknown>;
  if (v.website) throw new Error('Không thể gửi yêu cầu này.');
  const field = (key: string, min: number, max: number) => {
    if (typeof v[key] !== 'string') throw new Error('Vui lòng điền đủ thông tin.');
    const text = (v[key] as string).trim();
    if (text.length < min || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw new Error(`Thông tin ${key === 'message' ? 'lời chúc' : key === 'name' ? 'tên' : 'người nhận'} không hợp lệ.`);
    return text;
  };
  if (typeof v.color !== 'string' || !['green', 'gold', 'pink', 'sage'].includes(v.color)) throw new Error('Màu lá không hợp lệ.');
  if (typeof v.requestId !== 'string' || !uuid.test(v.requestId) || typeof v.deviceId !== 'string' || !uuid.test(v.deviceId)) throw new Error('Mã gửi không hợp lệ. Vui lòng tải lại trang.');
  return { name: field('name', 1, 60), recipient: field('recipient', 1, 60), message: field('message', 10, 500), color: v.color, requestId: v.requestId, deviceId: v.deviceId };
}

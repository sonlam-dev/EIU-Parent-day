import type { Wish } from './types';
export const sampleWishes: Wish[] = [
  ['EIU Parent Day', 'Con yêu', 'Ba mẹ tự hào về những cố gắng mỗi ngày của con.', 'green'],
  ['EIU Parent Day', 'Con yêu', 'Con cứ theo đuổi ước mơ, ba mẹ luôn ở bên.', 'pink'],
  ['EIU Parent Day', 'Con yêu', 'Ba mẹ chúc con học vui và có những người bạn tốt.', 'gold'],
  ['EIU Parent Day', 'Con yêu', 'Nhớ ăn đủ bữa và ngủ ngon nhé, ba mẹ thương con.', 'sage'],
  ['EIU Parent Day', 'Con yêu', 'Ba mẹ tin con sẽ tìm được con đường của mình.', 'green'],
  ['EIU Parent Day', 'Con yêu', 'Dù kết quả thế nào, ba mẹ vẫn luôn yêu con.', 'pink'],
  ['EIU Parent Day', 'Con yêu', 'Mệt thì nghỉ một chút, ba mẹ luôn đợi con về.', 'sage'],
  ['EIU Parent Day', 'Con yêu', 'Ba mẹ chúc con tự tin và vui với mỗi điều mới.', 'gold'],
].map(([name, recipient, message, color], i) => ({ id: `demo-${i}`, name, recipient, message, color, status: 'approved', created_at: new Date(Date.now() - i * 120000).toISOString() }));


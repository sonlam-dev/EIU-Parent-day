import type { Wish } from './types';
export const sampleWishes: Wish[] = [
  ['Ba Hùng', 'Con yêu', 'Ba luôn tự hào và đồng hành cùng ước mơ của con.', 'green'],
  ['Mẹ Lan', 'Con yêu', 'Mẹ chúc con học tốt và có nhiều niềm vui tại EIU.', 'pink'],
  ['Ba Tuấn', 'Con yêu', 'Ba tin con luôn vững vàng trên con đường đại học đã chọn.', 'gold'],
  ['Mẹ Mai', 'Con yêu', 'Mẹ mong con luôn khỏe mạnh, tự tin và ăn ngủ đúng giờ.', 'sage'],
  ['Ba Dũng', 'Con yêu', 'Ba chúc con có những năm tháng sinh viên thật rực rỡ.', 'green'],
  ['Mẹ Thảo', 'Con yêu', 'Mẹ luôn là điểm tựa bình yên và ấm áp nhất của con.', 'pink'],
  ['Ba Nam', 'Con yêu', 'Ba tin con sẽ làm chủ tri thức và tương lai của mình.', 'sage'],
  ['Mẹ Hoa', 'Con yêu', 'Mẹ tự hào khi thấy con trưởng thành và tự lập mỗi ngày.', 'gold'],
].map(([name, recipient, message, color], i) => ({ id: `demo-${i}`, name, recipient, message, color, status: 'approved', created_at: new Date(Date.now() - i * 120000).toISOString() }));

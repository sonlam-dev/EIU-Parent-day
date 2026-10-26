import type { Wish } from './types';
export const sampleWishes: Wish[] = [
  ['Minh Anh', 'Ba mẹ', 'Cảm ơn ba mẹ vì luôn là nơi bình yên để con trở về. Con yêu ba mẹ nhiều hơn những gì con có thể nói.', 'green'],
  ['Hoàng Nam', 'Mẹ', 'Mong mẹ luôn mạnh khỏe, luôn cười thật tươi. Hôm nay và mỗi ngày, con đều biết ơn vì được làm con của mẹ.', 'pink'],
  ['Gia đình Bảo An', 'Các con', 'Cứ tự tin bước về phía ước mơ nhé. Gia đình sẽ luôn ở đây, dõi theo và ủng hộ con.', 'gold'],
  ['Thu Hà', 'Ba', 'Cảm ơn những chuyến xe sớm, những lời dặn dò và cả tình yêu lặng thầm của ba.', 'sage'],
  ['Đức Minh', 'Ba mẹ', 'Chiếc lá nhỏ này thay con nói một lời cảm ơn thật lớn. Chúc gia đình mình luôn bên nhau!', 'green'],
  ['Khánh Linh', 'Gia đình', 'Điều may mắn nhất của con là có một gia đình luôn yêu thương. Chúc cả nhà một ngày thật nhiều niềm vui.', 'pink'],
  ['Phương Thảo', 'Mẹ', 'Con đang lớn lên từng ngày, nhưng vòng tay mẹ vẫn luôn là điều dịu dàng nhất.', 'sage'],
  ['Nhật Quang', 'Ba mẹ', 'Chúc ba mẹ bình an, khỏe mạnh và có thật nhiều khoảnh khắc hạnh phúc. Con thương ba mẹ.', 'gold'],
].map(([name, recipient, message, color], i) => ({ id: `demo-${i}`, name, recipient, message, color, status: 'approved', created_at: new Date(Date.now() - i * 120000).toISOString() }));


# Cây yêu thương · EIU Parent Day

Khách quét QR để gửi lời tri ân trên điện thoại. Màn hình sự kiện hiển thị cây sồi 3D và khung trong suốt với tối đa 5 lời chúc. Mỗi lời chúc được duyệt thêm đúng một lá thư trên cây. Lời thứ 6 đẩy thẻ đầu cuộn lên; các thư cũ vẫn trên cây. Logo EIU hiện như watermark ở lớp trời phía sau cây.

## Các địa chỉ

- `/` (hoặc `/screen`): màn hình chiếu có một cây cổ thụ tán xòe ngang theo ảnh tham chiếu, đồng cỏ với hoa vàng, khung lời chúc, QR và thanh điều khiển góc nhìn. Dùng F11 để toàn màn hình.
- `/join`: form dành cho điện thoại, nhập tên, người nhận, lời chúc và chọn sắc bao thư. Không tải Three.js, mô hình hay texture cây.
- `/setup`: mở các trang vận hành, tạo và tải QR PNG dẫn tới `/join`.
- `/admin`: Supabase Auth, duyệt/ẩn/khôi phục lời chúc và xuất CSV.
- URL cũ `/?write=1` vẫn mở giao diện gửi, `/?screen=1` vẫn mở cảnh chiếu.

## Chạy local tại cổng 3000

```powershell
npm.cmd install
npm.cmd run dev -- --port 3000 --strictPort
```

Mở http://localhost:3000, bấm nút Quét QR gửi lời chúc. Điện thoại và máy tính dùng cùng Wi-Fi; QR tự dùng địa chỉ LAN của máy. Để review animation:

1. Mở http://localhost:3000 ở tab thứ nhất.
2. Quét QR bằng điện thoại cùng Wi-Fi hoặc mở http://localhost:3000/join ở tab khác.
3. Gửi một lời chúc và theo dõi tab chiếu. Trong Vite dev, middleware `/api/demo/wishes` lưu chung vào RAM trên máy tính; màn hình cập nhật mỗi 1,2 giây. Dữ liệu demo bị xóa khi server khởi động lại. Trên production phải kết nối Supabase để chia sẻ giữa các thiết bị.

Server dev lắng nghe trên mạng LAN để điện thoại cùng Wi-Fi thử QR. QR localhost vẫn không mở được từ điện thoại khác; nếu mạng Wi-Fi cô lập thiết bị hoặc firewall chặn, cần dùng mạng phù hợp hay Vercel Preview. Khi có Vercel, đặt `VITE_SITE_URL` bằng tên miền production và tạo lại QR ở `/setup`.

## Cảnh 3D và animation

Cây dùng **@dgreenheck/ez-tree 1.1.0** từ https://github.com/dgreenheck/ez-tree, preset Oak Large được chỉnh thành cổ thụ: tán lá gom lên cao và dày hơn, cành lớn vươn ngang từ phần thân trên, thân cong nhẹ với các chỗ phình và rãnh không đều, 7 rễ nổi bố trí lệch tự nhiên. Chỉ có một cây; đã bỏ cây ở đường chân trời. Vỏ cây dùng texture của thư viện. Tán dùng 57.600 lá nhỏ dựng bằng InstancedMesh, gồm các cụm lá tại đầu nhánh và 6.000 lá bổ sung lấp khoảng trống giữa các chạc cây. Texture gân lá được vẽ bằng code, phối các sắc xanh tự nhiên. Xem THIRD_PARTY_NOTICES.md và public/licenses/ez-tree.txt.

Đồng cỏ là renderer riêng bằng Three.js: 171.500 ngọn cỏ chia thành 81 vùng, hai mức chi tiết, gió trên GPU, màu thay đổi từ gốc tới ngọn, bề mặt địa hình liên tục rộng 360 đơn vị, 1.800 cây hoa cúc vàng 3D có cánh, nhụy, thân và lá; đường chân trời có sương. Không có vùng cỏ giới hạn thành vòng tròn quanh cây.

Mỗi lời chúc được duyệt có đúng một bao thư; không có thư trang trí không gắn với dữ liệu. Lúc mở trang, khôi phục toàn bộ thư và 5 thẻ mới nhất. Lời mới được xếp hàng theo thời gian, mỗi lượt 3,6 giây: hiện một thẻ và thêm một thư tương ứng. Khi đủ 5 thẻ, thẻ đầu cuộn lên trong 0,6 giây, thẻ mới vào dưới cùng. Bấm thẻ hoặc thư trên cây để đọc đầy đủ.

Bao thư và dây dùng hai InstancedMesh chung geometry/texture, tự tăng dung lượng khi cần, không giới hạn 1.200 lời chúc. Bao thư thu nhỏ dần khi cây đông; các điểm treo được gom theo vùng để đặt nhiều lời chúc không cần quét toàn bộ tán lá. Chỉ cập nhật ma trận của bao thư đang chuyển động; gió nhẹ chạy trên GPU. Yêu cầu tải dữ liệu trùng thời điểm được gộp và chạy lần lượt để tránh trả kết quả ngược thứ tự. Dữ liệu tải lại không tạo bản trùng và không khởi động lại hiệu ứng; lời chúc bị ẩn được gỡ khỏi cây. Không phát lại lịch sử khi mở trang.

Với thiết bị chọn giảm chuyển động, bao thư xuất hiện trực tiếp và gió/CSS animation được tắt.

## Kết nối Supabase / Vercel

Xem DEPLOY.md và .env.example. Khi chưa có biến Supabase, ứng dụng chạy demo có nhãn rõ trong khung và trang gửi. Khi chạy Vite dev, dữ liệu demo dùng chung trong RAM trên máy tính để thử QR qua Wi-Fi. Khi build production chưa có Supabase, demo chỉ lưu bằng localStorage trên từng trình duyệt.

Bản live: khách gửi qua Vercel API → lưu trạng thái pending → ban tổ chức duyệt → Supabase Realtime cập nhật trang chiếu. Có tải lại định kỳ 15 giây dự phòng. Chưa xác nhận end-to-end với dịch vụ thật khi chưa có cấu hình.

Vite chỉ chạy frontend. Sau khi kết nối Supabase, để chạy cả `/api/wishes` ở local dùng:

```powershell
npx vercel dev --listen 3000
```

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run build
node scripts/inspect-tree.mjs
```

Test gồm mô phỏng 10.000 bao thư đến cùng lúc trên bộ đệm Three.js (không phải benchmark GPU hay tải Supabase), kiểm tra phân bố đều, cập nhật đợt chồng nhau, chế độ giảm chuyển động; đồng thời kiểm tra API demo qua các kết nối HTTP riêng, chống gửi lặp, dữ liệu gửi và hàng đợi: nhiều lời cùng lúc, lời tới giữa animation, không phát lặp, loại bỏ lời đã ẩn. Script geometry kiểm tra vị trí vertex hợp lệ và báo tỉ lệ cây trong khung hình 1920×1080; không thay thế kiểm tra hình ảnh trên GPU.

Frontend: React/TypeScript/Vite/Three.js. Backend: Supabase Postgres/Auth/Realtime và Vercel Node Functions. Khóa service role chỉ nằm trên server; RLS chặn khách đọc pending hoặc sửa dữ liệu; API có validation, idempotency và giới hạn gửi cơ bản.


## Điều khiển cảnh

Thanh điều khiển cho phép zoom 65–180%, bật/tắt tự xoay, chỉnh tốc độ 0,5–5 lần và đặt lại góc nhìn. Có thể kéo để xoay thủ công và cuộn chuột để tiến/lùi trong cảnh. Thảm hoa vàng đung đưa nhẹ theo gió; chế độ giảm chuyển động tắt chuyển động tự động.



Lá nhỏ được dựng trong `src/BangFoliage.ts`, có gân và vân bề mặt. Đây là geometry và texture thủ tục.

## Trang trí Parent Day

Bao thư giấy màu kem có nếp gấp, viền và dấu niêm phong trái tim. Màu giấy pha nhẹ theo lựa chọn của khách. Mười bao thư đầu được trải đều ở mặt trước, các lời chúc tiếp theo được phân bố quanh cây, dưới tán. Chi tiết và hiệu ứng treo nằm trong `src/ParentDayDecor.ts`; phân bố và thời gian bắt đầu ở `src/EnvelopeLayout.ts`.

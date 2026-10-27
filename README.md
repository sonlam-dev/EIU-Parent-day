# Cây yêu thương · EIU Parent Day

Khách quét QR để gửi lời tri ân trên điện thoại. Màn hình sự kiện hiển thị cây sồi 3D và khung trong suốt với tối đa 5 lời chúc. Mỗi lời chúc được duyệt thêm đúng một lá thư trên cây. Lời thứ 6 đẩy thẻ đầu cuộn lên; các thư cũ vẫn trên cây. Logo EIU hiện như watermark ở lớp trời phía sau cây.

## Các địa chỉ

- `/` (hoặc `/screen`): màn hình chiếu có một cây cổ thụ tán xòe ngang theo ảnh tham chiếu, đồng cỏ với hoa vàng, khung lời chúc, QR và thanh điều khiển góc nhìn. Dùng F11 để toàn màn hình.
- `/join`: form dành cho điện thoại, nhập tên, người nhận, lời chúc và chọn sắc lá. Không tải Three.js, mô hình hay texture cây.
- `/setup`: mở các trang vận hành, tạo và tải QR PNG dẫn tới `/join`.
- `/admin`: Supabase Auth, duyệt/ẩn/khôi phục lời chúc và xuất CSV.
- URL cũ `/?write=1` vẫn mở giao diện gửi, `/?screen=1` vẫn mở cảnh chiếu.

## Chạy local tại cổng 3000

```powershell
npm.cmd install
npm.cmd run dev -- --port 3000 --strictPort
```

Mở http://localhost:3000, quét QR màu xanh trong khung lời chúc. Khi chưa có lời được duyệt, khung hiện QR lớn và hướng dẫn gửi; khi có lời đầu tiên, danh sách hiện dần và QR thu xuống chân khung. Điện thoại và máy tính dùng cùng Wi-Fi; QR tự dùng địa chỉ LAN của máy nếu chưa đặt URL chính thức. Để review animation:

1. Mở http://localhost:3000 ở tab thứ nhất.
2. Quét QR bằng điện thoại cùng Wi-Fi hoặc mở http://localhost:3000/join ở tab khác.
3. Gửi một lời chúc và theo dõi tab chiếu. Trong Vite dev, middleware `/api/demo/wishes` lưu chung vào RAM trên máy tính; màn hình cập nhật mỗi 1,2 giây. Dữ liệu demo bị xóa khi server khởi động lại. Trên production phải kết nối Supabase để chia sẻ giữa các thiết bị.

Server dev lắng nghe trên mạng LAN để điện thoại cùng Wi-Fi thử QR. QR localhost vẫn không mở được từ điện thoại khác; nếu mạng Wi-Fi cô lập thiết bị hoặc firewall chặn, cần dùng mạng phù hợp hay Vercel Preview. Khi có Vercel, đặt `VITE_SITE_URL` bằng tên miền production và tạo lại QR ở `/setup`.

## Cảnh 3D và animation

Cây 3D dựng bằng Three.js trong `src/ancientTree.ts`: thân gỗ lớn, gốc bè, rễ nổi và tán khoảng 1.650 lá có gân. Vân gỗ dùng texture thủ tục và bump map. Cành và rễ gộp geometry, tán lá dùng một InstancedMesh.

Đồng cỏ là renderer riêng bằng Three.js: 171.500 ngọn cỏ chia thành 81 vùng, hai mức chi tiết, gió trên GPU, màu thay đổi từ gốc tới ngọn, bề mặt địa hình liên tục rộng 360 đơn vị, 1.800 cây hoa cúc vàng 3D có cánh, nhụy, thân và lá; đường chân trời có sương. Không có vùng cỏ giới hạn thành vòng tròn quanh cây.

Mỗi lời chúc được duyệt đổi màu một lá có sẵn trên cây theo sắc khách chọn. Không tạo lá rời hay bao thư. Bấm lá đã đổi màu hoặc thẻ lời chúc để đọc nội dung. Hàng đợi tiếp tục hiện mỗi lời cách nhau 1–3 giây, không phát lại lịch sử.

`src/WishLeaves.ts` liên kết lời chúc với instance lá trong tán, chỉ cập nhật màu khi dữ liệu thay đổi. Khi ẩn lời chúc, lá được trả về màu gốc. Khi số lời vượt số lá vật lý, một lá chứa nhiều lời và các lần bấm lần lượt mở từng lời, không tăng số mesh.

Lá giữ nguyên vị trí và kích thước khi nhận lời chúc. Chế độ giảm chuyển động tắt gió và chuyển động tự động.

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

Test kiểm tra đổi màu lá có sẵn, khôi phục màu khi ẩn lời chúc, không phát sinh mesh/biến đổi lá, xử lý 10.000 lời, nhấn lá đọc nội dung, lưu chiếc lá để quét lại QR, xuống dòng và tạo hình PNG. Các kiểm tra dữ liệu/API/hàng đợi và giới hạn geometry vẫn chạy bằng `npm.cmd test`.

Frontend: React/TypeScript/Vite/Three.js. Backend: Supabase Postgres/Auth/Realtime và Vercel Node Functions. Khóa service role chỉ nằm trên server; RLS chặn khách đọc pending hoặc sửa dữ liệu; API có validation, idempotency và giới hạn gửi cơ bản.


## Điều khiển cảnh

Thanh điều khiển cho phép zoom 65–180%, bật/tắt tự xoay, chỉnh tốc độ 0,5–5 lần và đặt lại góc nhìn. Có thể kéo để xoay thủ công và cuộn chuột để tiến/lùi trong cảnh. Thảm hoa vàng đung đưa nhẹ theo gió; chế độ giảm chuyển động tắt chuyển động tự động.



Lá nhỏ được dựng trong `src/BangFoliage.ts`, có gân và vân bề mặt. Đây là geometry và texture thủ tục.

## Trang trí Parent Day

Phụ huynh gửi thành công sẽ thấy hình chiếc lá có lời chúc. Trang `/join` lưu tối đa 20 chiếc lá trong localStorage; quét lại cùng QR trên cùng thiết bị và trình duyệt tự mở lại hình. Không có nút tải ảnh trên giao diện. Đổi thiết bị/trình duyệt, dùng chế độ riêng tư hoặc xóa dữ liệu trang sẽ không khôi phục được chiếc lá cá nhân. Chiếc lá trên cây chung vẫn qua quy trình duyệt.

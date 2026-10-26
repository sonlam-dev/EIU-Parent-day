# EIU Parent Day — Supabase và Vercel

## Luồng hoạt động

`Điện thoại /join → POST /api/wishes trên Vercel → Supabase (pending) → /admin duyệt (approved) → Realtime → khung 5 lời chúc + cây 3D`.

- Mỗi lời chúc được duyệt có đúng một lá thư trên cây. Không có lá thư trang trí giả.
- Lúc mở trang: khôi phục toàn bộ thư đã duyệt; khung hiện 5 lời mới nhất theo thứ tự cũ → mới từ trên xuống. Nếu chưa đủ 5, chỉ hiện số có thật.
- Khi nhận lời mới: hiện thẻ và thêm thư cùng một lượt. Nếu khung đủ 5, thẻ cũ nhất cuộn lên, thẻ mới vào dưới cùng. Thư cũ vẫn trên cây.
- Nhiều lời đến cùng lúc được xếp hàng theo thời gian, mỗi lượt cách nhau 3,6 giây; không bỏ lời chúc. Cuộn kéo dài 0,6 giây. Bấm thẻ hoặc lá thư để đọc đầy đủ.
- Sửa/ẩn lời chúc cập nhật nội dung hoặc gỡ khỏi khung và cây. Realtime có tải lại dự phòng mỗi 15 giây và khi quay lại tab.
- Demo không đồng bộ qua Internet. Muốn nhiều điện thoại cùng dùng trên Vercel phải cấu hình Supabase.

## 1. Tạo database Supabase và chạy SQL

1. Tạo project Supabase, chọn khu vực gần nơi tổ chức và đợi database sẵn sàng.
2. Mở **SQL Editor → New query**, dán toàn bộ nội dung `supabase/migrations/001_wish_tree.sql`, bấm **Run**. Chỉ chạy file này **một lần trên project mới**. Không chạy lại trên database đã có các bảng.
3. Migration tạo `wishes`, `admins`, `rate_windows`, chính sách RLS, hàm `submit_wish` và bật publication `supabase_realtime` cho `wishes`.
4. Nếu project đã chạy migration 001: giữ dữ liệu hiện có. Có thể chạy `supabase/migrations/002_ensure_realtime.sql` để bảo đảm bảng `wishes` được bật Realtime; file 002 có thể chạy lại.
5. Chạy `supabase/check-connection.sql`. Kết quả đầu phải có `public / wishes`; ba bảng phải có `rowsecurity = true`.

Không tạo policy cho phép khách insert trực tiếp: khách gửi qua API Vercel; API gọi hàm SQL bằng khóa chỉ dành cho server. Khách chỉ đọc được lời đã duyệt.

## 2. Tạo tài khoản duyệt lời chúc

Trong **Authentication → Users**, tạo user bằng email/mật khẩu của ban tổ chức. Xác nhận email nếu cần, sao chép UUID, rồi chạy SQL sau với UUID thật:

```sql
insert into public.admins(user_id)
values ('THAY_BANG_UUID_CUA_USER')
on conflict (user_id) do nothing;
```

Đây là UUID user Auth, không phải Project ID. Chỉ user có trong `admins` mới được duyệt. Nếu chỉ ban tổ chức đăng nhập, tắt cho phép người ngoài tự đăng ký trong cấu hình Auth. Khách gửi lời chúc không cần tài khoản.

Luồng mặc định có kiểm duyệt: lời mới chưa hiện cho đến khi bấm **Duyệt** ở `/admin`. Muốn hiển thị ngay không duyệt cần thay đổi quy tắc nhận lời chúc; không tắt RLS để đạt việc đó.

## 3. Đưa mã lên GitHub

Nếu đã có repository, commit và push các thay đổi hiện tại. Nếu chưa có, tại thư mục chứa `package.json`:

```powershell
git init -b main
git add .
git commit -m "Add EIU realtime wish wall"
git remote add origin https://github.com/TAI_KHOAN/TEN_REPO.git
git push -u origin main
```

Tạo repository trống trên GitHub trước. `.env*`, `node_modules`, `dist` và `.vercel` đã được bỏ qua; chỉ `.env.example` được lưu. Không đưa khóa server lên GitHub.

## 4. Import Vercel và điền biến môi trường

Trong Vercel: **Add New → Project → Import Git Repository**. Chọn framework **Vite**. Root Directory là thư mục chứa `package.json`; nếu repo chứa trực tiếp dự án, giữ root mặc định. Build Command: `npm run build`; Output Directory: `dist`. File `vercel.json` đã có cấu hình route cho `/join`, `/admin`, `/setup`, `/screen`; `/api/wishes` được xử lý bởi Vercel Function.

Lấy URL và API keys trong phần **Connect / API Keys** của Supabase project, rồi thêm các biến sau vào Vercel **Settings → Environment Variables** cho Production (và Preview nếu muốn kiểm tra):

| Biến | Điền giá trị | Nơi dùng |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `https://PROJECT_REF.supabase.co` | Trình duyệt |
| `VITE_SUPABASE_ANON_KEY` | Publishable key hoặc legacy `anon` | Trình duyệt |
| `SUPABASE_URL` | Cùng URL Supabase ở trên | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key hoặc legacy `service_role` | Chỉ server |
| `RATE_LIMIT_SALT` | Chuỗi ngẫu nhiên riêng cho dự án | Chỉ server |
| `VITE_SITE_URL` | URL production, ví dụ `https://ten-du-an.vercel.app` | Tạo QR |

Tên biến giữ đúng như bảng, kể cả khi dùng loại khóa mới. Không đặt secret/service-role key vào bất kỳ biến bắt đầu bằng `VITE_`. Các biến `VITE_` được đưa vào mã tải xuống trình duyệt.

Tạo salt trên máy rồi nhập trực tiếp vào Vercel:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Bấm **Deploy**. Nếu chưa biết URL lần đầu, để trống `VITE_SITE_URL`; sau khi có URL, điền URL ổn định rồi **Redeploy**. Mọi thay đổi biến môi trường cần deployment mới để có hiệu lực. Nếu Preview có bảo vệ đăng nhập, dùng URL production công khai cho khách và QR.

## 5. Kiểm tra luồng thật

1. Mở `/` trên máy chiếu: hết nhãn “Bản trải nghiệm”, trạng thái chuyển “Đang nhận lời chúc”.
2. Mở `/join` trên điện thoại dùng mạng di động, gửi một lời chúc. Trong Supabase Table Editor kiểm tra có một dòng `pending`.
3. Mở `/admin`, đăng nhập user được cấp quyền và duyệt dòng vừa gửi.
4. Màn hình chiếu nhận lời mới: một thẻ và một lá thư xuất hiện tương ứng. Không cần F5.
5. Duyệt thêm ít nhất 5 lời để kiểm tra khung luôn giữ 5 thẻ, lời thứ 6 đẩy thẻ đầu lên. Các lá thư cũ vẫn ở trên cây.
6. Thử Ẩn một lời chúc trong `/admin`: thư tương ứng được gỡ, khung cập nhật; nếu sự kiện Realtime không đến, tải lại dự phòng trong khoảng 15 giây.
7. Reload trang chiếu: toàn bộ thư được khôi phục, chỉ 5 lời mới nhất trong khung, không phát lại hàng loạt lịch sử.
8. Mở `/setup`, tải QR PNG, quét thử trước khi in. Máy chiếu mở `/` hoặc `/screen`, dùng F11.

Thử nhanh hàng đợi trực tiếp trong SQL Editor (tạo 6 lời chúc thử **được duyệt ngay**, không qua API):

```sql
insert into public.wishes(id,name,recipient,message,color,status,created_at)
select gen_random_uuid(), 'Kiểm tra realtime ' || n, 'Gia đình',
       'Lời chúc thử nghiệm realtime số ' || n || '. Chúc gia đình luôn bình an!',
       'green', 'approved', now() + n * interval '1 millisecond'
from generate_series(1,6) as n
returning id,name,status;
```

Mở trang chiếu **trước** khi chạy để thấy hiệu ứng. Đây là dữ liệu thử có thật: sau khi kiểm tra, vào `/admin` → Đã duyệt → Ẩn các lời tên “Kiểm tra realtime”. SQL này chỉ xác nhận đoạn database → màn hình; vẫn cần gửi từ điện thoại để kiểm tra cả API.

## 6. Chạy local với Supabase thật

Sao chép `.env.example` thành `.env.local`, điền đủ biến trên máy, không commit file này. Dừng server Vite ở cổng 3000, chạy:

```powershell
npx vercel dev --listen 3000
```

Chỉ chạy `npm.cmd run dev` không cung cấp Function production `/api/wishes`; lệnh này phù hợp với demo khi chưa cấu hình Supabase. Vercel CLI có thể yêu cầu đăng nhập và link project.

## Xử lý lỗi

| Hiện tượng | Kiểm tra |
| --- | --- |
| Vẫn hiện bản trải nghiệm | Hai biến `VITE_SUPABASE_*` đã có lúc build chưa? Redeploy sau khi thêm biến. |
| Gửi báo 503 | Kiểm tra ba biến server, Function Logs của `/api/wishes`, và migration 001 đã chạy. |
| Có dòng pending nhưng cây chưa đổi | Vào `/admin` bấm Duyệt. Đây là luồng mặc định. |
| Đã duyệt nhưng chỉ đổi sau 15 giây | Chạy file 002 và file check; kiểm tra mạng/WebSocket và policy đọc approved. |
| Admin không thấy hoặc không duyệt được | UUID có trong `public.admins` chưa? User đã xác nhận email chưa? |
| API trả HTML thay vì JSON | Root Directory phải chứa cả `api/`, `src/`, `vercel.json` và `package.json`. |
| API trả 429 | Giới hạn: 5 lần/10 phút mỗi phiên thiết bị, 300 lần/10 phút mỗi IP. |
| QR mở localhost hoặc yêu cầu đăng nhập Vercel | Chốt URL production công khai trong `VITE_SITE_URL`, redeploy và tải QR mới. |

Chưa kiểm tra end-to-end trên Supabase/Vercel thật khi chưa có project và biến môi trường. Thực hiện đủ bước 5 trước khi dùng tại sự kiện.

Tài liệu chính thức: [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Environment Variables](https://vercel.com/docs/environment-variables).

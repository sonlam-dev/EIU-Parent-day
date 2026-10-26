# Kết nối GitHub → Supabase → Vercel

## 1. GitHub

Thư mục project là `parent-day-tree`. Đăng nhập GitHub CLI nếu phiên cũ hết hạn:

```powershell
gh auth login
```

Nếu thư mục chưa là Git repository:

```powershell
git init -b main
git add .
git commit -m "Build Parent Day 3D wish tree"
```

Tạo repository riêng và push (đổi tên nếu đã tồn tại):

```powershell
gh repo create parent-day-wish-tree --private --source . --remote origin --push
```

`.env*`, `.vercel`, node_modules và cache đã được bỏ qua; `.env.example` được lưu trong repo. Không đưa service-role key lên GitHub hoặc gửi qua chat.

## 2. Supabase

1. Tạo project trong tài khoản của bạn, nên chọn khu vực gần địa điểm tổ chức.
2. Trong **SQL Editor**, chạy `supabase/migrations/001_wish_tree.sql` **một lần trên project mới**. Migration tạo bảng, quyền, hàm nhận lời chúc và bật Realtime.
3. Vào **Authentication → Users → Add user** để tạo tài khoản người duyệt. Sao chép UUID của user.
4. Cấp quyền bằng SQL, thay UUID mẫu bằng UUID thực:

```sql
insert into public.admins(user_id)
values ('00000000-0000-0000-0000-000000000000');
```

5. Trong phần API của project, lấy Project URL, khóa public `anon` và `service_role`. `service_role` chỉ dành cho server. Với loại khóa mới, dùng publishable ở frontend và secret tương ứng ở server; không đưa secret vào biến bắt đầu bằng `VITE_`.
6. Nếu chỉ ban tổ chức đăng nhập, tắt cho phép tự đăng ký trong cấu hình Auth. Trang khách không yêu cầu đăng nhập.

## 3. Vercel

1. Chọn **Add New → Project**, import repository GitHub vừa tạo, framework **Vite**. Nếu push cả thư mục cha, đặt Root Directory là `parent-day-tree`; nếu repo chứa trực tiếp package.json, để root mặc định.
2. Thêm biến môi trường cho **Production** và **Preview** trước khi deploy:

| Biến | Giá trị | Phạm vi |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | URL project Supabase | Public frontend |
| `VITE_SUPABASE_ANON_KEY` | Public anon/publishable key | Public frontend |
| `SUPABASE_URL` | Cùng URL Supabase | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role/secret key | **Chỉ server** |
| `RATE_LIMIT_SALT` | Chuỗi ngẫu nhiên dài, riêng cho project | **Chỉ server** |
| `VITE_SITE_URL` | Ví dụ `https://parent-day.example.com` | URL chính thức cho QR |

Có thể tạo salt bằng lệnh này trên máy của bạn và nhập trực tiếp vào Vercel:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

3. Deploy. Nếu chưa biết URL, bỏ trống `VITE_SITE_URL` lần đầu, sau đó đặt URL production ổn định và **redeploy**. Tránh in QR chứa URL của một bản Preview tạm thời.
4. Khi frontend có Supabase URL/key, nhãn demo sẽ biến mất; dữ liệu mẫu không được tự chuyển sang database.
5. Vào `/admin` trên URL Vercel, đăng nhập bằng tài khoản đã cấp quyền.

## 4. Chạy cả API ở local (sau khi kết nối)

Sao chép `.env.example` thành `.env.local`, điền giá trị ngay trên máy. Không commit tệp này. Dừng Vite ở cổng 3000 trước khi dùng Vercel dev:

```powershell
npx vercel dev --listen 3000
```

Vercel CLI có thể yêu cầu bạn đăng nhập/link project. Bản local hiện tại chưa cần Supabase, vì vậy `npm run dev -- --port 3000 --strictPort` là đủ để review demo.

## 5. Kiểm tra trước khi in QR

1. Trang chủ không hiện banner demo. Gửi lời chúc từ điện thoại bằng mạng di động; nhận thông báo chờ duyệt.
2. Dùng cửa sổ khách khác: không thấy lời chúc chưa duyệt. Trong `/admin`, duyệt lời chúc; trang khách xuất hiện lá và thẻ lời chúc mới.
3. Ẩn lời chúc đã duyệt: trang khách phải biến mất sau tối đa một vòng tải lại 15 giây. Thử tải lại trang để xác nhận database.
4. Tài khoản Auth không có trong `admins` không được phép duyệt. Người chưa đăng nhập chỉ đọc được bản đã duyệt, không insert/update trực tiếp.
5. Thử gửi quá 5 lần trong 10 phút trên cùng tab để xác nhận báo giới hạn; thử request ID lặp để xác nhận không tạo hai lá.
6. Mở /setup, tải QR mới dẫn tới /join và quét bằng camera điện thoại; xác nhận URL production, không yêu cầu tài khoản Vercel. Nếu deployment có bảo vệ đăng nhập, cấu hình quyền truy cập phù hợp cho trang sự kiện công khai.
7. Tải QR PNG mới sau khi chốt tên miền. In thử và quét ở khoảng cách thực tế.
8. Mở `/` hoặc `/screen` trên máy chiếu, dùng F11; kiểm tra khung chuyển lời chúc và chiếc lá bay từ khung vào cây. Trang chiếu không có nút chức năng. Trang `/join` dùng riêng trên điện thoại.

## Vận hành

- Duyệt: `/admin` → Chờ duyệt → Duyệt. Ẩn được khôi phục bằng nút Duyệt ở mục Đã ẩn.
- Xuất dữ liệu: nút CSV xuất tất cả trạng thái, chỉ người quản trị mới dùng được.
- Giới hạn hiện tại là biện pháp cơ bản: thiết bị dựa trên sessionStorage có thể thay đổi, IP dùng chung có giới hạn 300/10 phút. Chưa tích hợp CAPTCHA; cần kiểm tra tải với quy mô sự kiện thực tế trước khi công bố rộng rãi.
- Tán cây giới hạn 1.200 lá lời chúc mới nhất; dữ liệu cũ vẫn xem được trong quản trị. Database hiện đọc theo trang 500 dòng; cần tối ưu tải dữ liệu phía server nếu sự kiện thu thập rất nhiều lời chúc.
- Rate counters không lưu IP thô và tự dọn các cửa sổ cũ sau 1 ngày khi có lượt gửi thành công. Lời chúc được lưu đến khi ban tổ chức xử lý theo chính sách sự kiện.
- Không có xóa vĩnh viễn trên giao diện để tránh thao tác nhầm; xử lý yêu cầu gỡ tên/lời chúc bằng Ẩn, và người quản lý database thực hiện xóa nếu cần.
- Nội dung Supabase/API và quyền RLS chưa được kiểm tra end-to-end khi chưa có project và khóa thật.

Tài liệu chính thức: [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite), [biến môi trường Vercel](https://vercel.com/docs/environment-variables), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).


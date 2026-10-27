# Hướng dẫn deploy từ source gốc: Supabase → SQL → API keys → Vercel

Tài liệu dành cho người cài mới EIU Parent Day từ repository này. Kết quả cuối cùng là một website công khai: phụ huynh gửi ở `/join`, ban tổ chức duyệt ở `/admin`, máy chiếu mở `/` hoặc `/screen`. Không cần chạy máy tính cá nhân làm server sau khi deploy.

Source gồm React/Vite ở `src/`, Vercel Function ở `api/wishes.ts`, cấu hình Vercel ở `vercel.json` và SQL ở `supabase/migrations/`. Cần deploy cả repository, không chỉ tải thư mục `dist` lên hosting.

## 1. Chuẩn bị source và tài khoản

1. Có tài khoản [GitHub](https://github.com), [Supabase](https://supabase.com/dashboard) và [Vercel](https://vercel.com).
2. Nếu tự triển khai độc lập, fork repository `sonlam-dev/EIU-Parent-day` sang tài khoản GitHub của bạn. Nếu được cấp quyền repository hiện tại, có thể import trực tiếp repository đó ở Vercel.
3. Để kiểm tra trên máy, cài Git và Node.js LTS tương thích Vite 6, mở PowerShell tại thư mục muốn lưu source rồi chạy:

```powershell
git clone https://github.com/sonlam-dev/EIU-Parent-day.git
Set-Location EIU-Parent-day
npm.cmd ci
npm.cmd test
npm.cmd run build
```

Nếu dùng fork, thay URL clone bằng URL fork của bạn. Thư mục đúng là nơi chứa `package.json`, `vercel.json`, `src`, `api`, `supabase`. Có thể dùng Download ZIP rồi giải nén để đọc source; Vercel vẫn cần import repository GitHub để tự deploy khi push.

Không cần nhập API vào source TypeScript. Khi triển khai, nhập chúng trong phần Environment Variables của Vercel ở bước 5.

## 2. Tạo một project Supabase mới

1. Đăng nhập Supabase Dashboard, chọn hoặc tạo organization.
2. Chọn **New project**, đặt tên, ví dụ `eiu-parent-day`.
3. Đặt mật khẩu database mạnh và lưu ở nơi riêng. Mật khẩu này không phải mật khẩu admin website và không phải API key.
4. Chọn khu vực gần nơi tổ chức nếu có, ví dụ Singapore, rồi tạo project.
5. Đợi project/database khởi tạo xong. Tất cả SQL và API keys bên dưới phải lấy từ cùng project này.

Tên menu có thể khác đôi chút giữa các phiên bản Dashboard. Cần tìm ba mục: SQL Editor, Authentication/Users và Settings/API Keys.

## 3. Chạy SQL theo đúng thứ tự

### 3.1. Cách chạy từng file

1. Trên máy hoặc GitHub, mở file SQL trong source. Nếu mở GitHub, dùng **Raw** để sao chép nội dung thuần.
2. Trong Supabase project vừa tạo, mở **SQL Editor → New query**.
3. Dán **toàn bộ nội dung file**, gồm cả `begin;` và `commit;` nếu có. Không dán dấu ba backtick của Markdown, không dán tên đường dẫn thay cho nội dung.
4. Bấm **Run**, chờ kết quả thành công rồi mới chạy file kế tiếp. Dòng “Success. No rows returned” là bình thường với file tạo bảng/hàm.
5. Nếu báo lỗi, dừng ở file đó và xử lý; không bỏ qua rồi chạy tiếp. Ghi lại các file đã chạy thành công để lần nâng cấp sau không chạy nhầm.

### 3.2. Danh sách cho project mới hoàn toàn

| Thứ tự | File cần mở và chạy | Mục đích |
| --- | --- | --- |
| 1 | [001_wish_tree.sql](supabase/migrations/001_wish_tree.sql) | Tạo bảng lời chúc, admin, giới hạn gửi, RLS, hàm nhận lời và Realtime. Chỉ chạy một lần trên database mới. |
| 2 | [002_ensure_realtime.sql](supabase/migrations/002_ensure_realtime.sql) | Bảo đảm bảng lời chúc có trong publication Realtime. |
| 3 | [003_admin_operations.sql](supabase/migrations/003_admin_operations.sql) | Cài công cụ Emergency và hàm xóa dành cho admin. |
| 4 | [004_fix_admin_delete.sql](supabase/migrations/004_fix_admin_delete.sql) | Cập nhật hàm xóa tương thích safeupdate. |
| 5 | [005_parent_to_child_samples.sql](supabase/migrations/005_parent_to_child_samples.sql) | Cập nhật bộ nội dung lời mẫu. |
| 6 | [006_ten_colorful_parent_wishes.sql](supabase/migrations/006_ten_colorful_parent_wishes.sql) | Cập nhật Emergency: 10 lời mỗi lượt, đủ 4 màu, tên người gửi theo bản hiện tại. |
| 7 | [check-connection.sql](supabase/check-connection.sql) | Đọc kết quả kiểm tra database sau khi cài. |

Các migration 003–006 cài/cập nhật công cụ, không tự bấm Emergency hay tự xóa lời chúc. Chạy đủ thứ tự để có chức năng đúng với frontend hiện tại. Không cần chạy script `build-admin-migration.mjs` khi chỉ deploy source nguyên bản.

Kết quả file kiểm tra cần có:

- Publication có dòng `public | wishes`.
- Ba bảng `wishes`, `admins`, `rate_windows` đều có `rowsecurity = true`.
- Thống kê lời chúc có thể trống khi chưa ai gửi; đây là bình thường.
- Danh sách admin có thể trống trước bước 4.

SQL Editor có thể hiển thị từng kết quả riêng: chọn từng bảng kết quả để xem. Không tắt RLS hoặc mở quyền insert công khai để xử lý lỗi; source dùng Function Vercel để nhận lời.

### 3.3. Nếu project đã có dữ liệu

Không chạy lại file 001. Kiểm tra lịch sử cài đặt rồi chỉ áp dụng các migration còn thiếu theo thứ tự. Nếu không biết đã cài tới đâu, kiểm tra bảng/hàm hiện có và bản source đã dùng trước đó; không xóa database để ép cài lại. Lỗi `relation already exists` khi chạy 001 thường là dấu hiệu database đã được khởi tạo.

## 4. Tạo tài khoản quản trị website

1. Trong Supabase, mở **Authentication → Users**.
2. Chọn **Add user → Create new user** hoặc chức năng tương đương.
3. Nhập email thật của người quản trị và mật khẩu mạnh. Chọn tự xác nhận email nếu Dashboard cung cấp tùy chọn đó, hoặc hoàn tất xác nhận email trước khi đăng nhập.
4. Mở chi tiết user vừa tạo, sao chép **User UID/UUID**. Đây là ID người dùng Auth, không phải Project ID.
5. Mở SQL Editor, thay chuỗi ví dụ dưới đây bằng UUID vừa sao chép rồi Run:

```sql
insert into public.admins (user_id)
values ('THAY_BANG_UUID_USER_VUA_TAO')
on conflict (user_id) do nothing;
```

6. Chạy kiểm tra:

```sql
select a.user_id, u.email
from public.admins a
join auth.users u on u.id = a.user_id;
```

Phải có email tài khoản vừa tạo. Tạo Auth user và cấp quyền trong `admins` là hai thao tác riêng; chỉ có tài khoản Auth thì chưa duyệt được lời chúc. Lặp lại các bước cho quản trị viên khác nếu cần.

Cách khác: dùng [create-admin.sql](supabase/create-admin.sql), thay email có sẵn ở biến `admin_email` bằng email user của bạn trước khi Run. Script không tạo user hay đặt mật khẩu.

Sau khi deploy sẽ đăng nhập tại `https://TEN-MIEN-CUA-BAN/admin` bằng email/mật khẩu ở trên. Không nhập tài khoản quản trị vào biến môi trường. Phụ huynh gửi lời không cần đăng nhập. Nếu chỉ ban tổ chức cần tài khoản, có thể tắt tự đăng ký trong cấu hình Authentication sau khi tạo đủ user.

## 5. Lấy URL và API keys từ Supabase

Mở **Connect** để lấy **Project URL**, hoặc tìm trong phần API của Project Settings. URL có dạng `https://PROJECT_REF.supabase.co`. Không lấy URL Dashboard, URL database dạng `postgresql://`, hay nối thêm `/rest/v1`.

Mở **Settings → API Keys**:

- **Publishable key** dạng `sb_publishable_...`: dùng cho frontend.
- **Secret key** dạng `sb_secret_...`: dùng riêng cho Vercel Function. Tạo key nếu project chưa có và lưu kín.
- Nếu project dùng khóa legacy, dùng `anon` cho frontend và `service_role` cho server tương ứng.

Source giữ tên biến cũ nhưng cho phép điền loại key tương ứng như bảng sau. Không dùng JWT signing secret thay cho API key. Tham khảo [tài liệu API keys của Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

| Tên biến trên Vercel (chép chính xác) | Giá trị lấy ở đâu | Bắt buộc |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Project URL | Có |
| `VITE_SUPABASE_ANON_KEY` | Publishable key hoặc legacy `anon` | Có |
| `SUPABASE_URL` | Cùng Project URL phía trên | Có |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key hoặc legacy `service_role` | Có |
| `RATE_LIMIT_SALT` | Tự tạo chuỗi ngẫu nhiên bằng lệnh dưới | Có |
| `VITE_SITE_URL` | Tên miền production của website Vercel, có `https://`, không thêm `/join` | Chốt sau lần deploy đầu |

Tạo giá trị `RATE_LIMIT_SALT` bằng PowerShell có Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Sao chép toàn bộ chuỗi 64 ký tự sinh ra vào giá trị biến đó. Giữ nguyên trong các lần deploy sau. Biến này dùng để băm dữ liệu phục vụ giới hạn gửi, không lấy từ Supabase.

Biến bắt đầu bằng `VITE_` được đưa vào JavaScript gửi xuống trình duyệt. Chỉ điền public/publishable key ở `VITE_SUPABASE_ANON_KEY`; secret/service-role key chỉ điền ở `SUPABASE_SERVICE_ROLE_KEY`. Không commit key server vào GitHub hoặc chia sẻ ảnh chứa key. Nếu lộ key server, thu hồi/đổi key trong Supabase rồi cập nhật và redeploy Vercel.

## 6. Import source vào Vercel và deploy

1. Đăng nhập Vercel bằng GitHub, chọn **Add New → Project**.
2. Trong **Import Git Repository**, chọn repository chứa source này và bấm **Import**. Nếu chưa thấy repo, cấp quyền truy cập đúng repository cho ứng dụng GitHub của Vercel.
3. Đặt tên project theo ý muốn, ví dụ `eiu-parent-day`.
4. Kiểm tra cấu hình:

| Mục | Giá trị |
| --- | --- |
| Framework Preset | `Vite` |
| Root Directory | Thư mục chứa `package.json`, `vercel.json`, `api/`, `src/`; repo hiện tại để root mặc định |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | Mặc định; nếu tự nhập với lockfile hiện tại có thể dùng `npm ci` |

5. Mở **Environment Variables**, thêm từng tên và giá trị ở bước 5. Mỗi dòng là một cặp tên/giá trị; không dán cả `TEN_BIEN=gia_tri` vào ô Value. Không bọc giá trị bằng dấu nháy, không để khoảng trắng hoặc xuống dòng ở đầu/cuối.
6. Áp dụng cho **Production**. Chỉ thêm **Preview** nếu muốn các bản preview cũng dùng database này; lưu ý thao tác trên preview sẽ tác động vào cùng dữ liệu. Có thể dùng Supabase project riêng cho môi trường thử.
7. Lần đầu chưa biết tên miền, có thể để trống `VITE_SITE_URL`. Điền đủ năm biến bắt buộc còn lại rồi bấm **Deploy**.
8. Đợi build và deployment có trạng thái **Ready**. Nếu lỗi, xem Build Logs, xử lý rồi deploy lại.
9. Mở project **Settings → Domains**, lấy tên miền production ổn định, ví dụ `https://eiu-parent-day.vercel.app`. Dùng tên miền thực tế Vercel cấp cho bạn.
10. Vào **Settings → Environment Variables**, thêm/sửa `VITE_SITE_URL` thành URL đó, không thêm `/join` và không có dấu `/` ở cuối.
11. Vào **Deployments**, chọn deployment từ nhánh production → menu **… → Redeploy**, chọn môi trường Production nếu được hỏi. Đợi deployment mới Ready rồi mở lại website.

Thay đổi biến môi trường chỉ có hiệu lực với deployment mới; các biến `VITE_` được đọc lúc build. Xem [hướng dẫn biến môi trường Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables) và [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite).

Giữ file `vercel.json` của source: file này cấu hình các đường dẫn frontend, đồng thời để `/api/wishes` chạy bằng Vercel Function. Không cần tạo Supabase Edge Function cho ứng dụng này. Vite build chỉ tạo frontend; Vercel triển khai thư mục `api/` thành backend.

Nếu bật bảo vệ deployment, cần cấu hình để khách truy cập được domain production công khai. Xác nhận bằng cửa sổ ẩn danh và điện thoại dùng 4G/5G; không dùng đường dẫn Preview yêu cầu đăng nhập làm QR cho sự kiện.

## 7. Kiểm tra toàn bộ sau deploy

1. Mở `https://TEN-MIEN-CUA-BAN/` trên máy chiếu. Không còn nhãn demo/bản trải nghiệm.
2. Mở `/join` trên điện thoại dùng mạng di động, điền và gửi một lời chúc thử.
3. Trong Supabase **Table Editor → wishes**, kiểm tra có bản ghi mới với `status = pending`. Đây là dấu hiệu Function đã ghi được vào database; chỉ thấy hình chiếc lá trên điện thoại chưa đủ để xác nhận chế độ live.
4. Mở `/admin`, đăng nhập tài khoản ở bước 4, vào **Chờ duyệt**, bấm **Duyệt** lời vừa gửi.
5. Màn hình chiếu phải hiển thị lời đó và một lá đổi màu, không cần F5. Nếu Realtime gián đoạn, cơ chế tải lại dự phòng chạy khoảng 15 giây.
6. Trong quản trị, **Ẩn** lời thử và kiểm tra cây/danh sách cập nhật. Tải lại trang chiếu: lời đã ẩn không xuất hiện lại.
7. Mở `/setup`, tạo/tải QR PNG và quét thử bằng điện thoại. QR phải mở đúng domain production với đường dẫn `/join`.
8. Kiểm tra đăng nhập admin từ cửa sổ ẩn danh, và tải trực tiếp `/admin`, `/join`, `/setup`, `/screen` để xác nhận route hoạt động.
9. Thử gửi từ một thiết bị khác để xác nhận dùng chung database. Mở màn hình chiếu toàn màn hình bằng F11.

Emergency là công cụ tùy chọn trong `/admin`; mỗi lần bấm thêm 10 lời được duyệt ngay vào database thật. Nút **Xóa tất cả** xóa vĩnh viễn lời chúc ở mọi trạng thái: chỉ dùng khi chủ động muốn dọn dữ liệu. Có thể xuất CSV trước khi dọn; CSV không thay thế bản sao lưu database đầy đủ.

## 8. Cập nhật source hoặc đổi domain về sau

- Khi sửa code, commit/push lên nhánh production đã cấu hình ở Vercel (thường là `main`); kiểm tra deployment mới Ready và commit khớp với lần push. Vercel không tự chạy các file SQL trong repository.
- Nếu bản cập nhật có migration mới, đọc yêu cầu của bản đó và chạy migration đúng thứ tự trên Supabase. Không chạy lại 001 sau mỗi lần push.
- Nếu chỉ sửa API key/URL trên Vercel, lưu biến rồi Redeploy. Không cần sửa source để nhập key.
- Nếu đổi domain, gắn domain trong Vercel, cập nhật `VITE_SITE_URL`, Redeploy rồi tạo và quét lại QR trước khi in. QR đã in vẫn chứa URL cũ.
- Nếu cấu hình Auth Site URL, đặt bằng domain production. Giao diện hiện tại dùng đăng nhập email/mật khẩu trực tiếp; không cần tạo OAuth provider cho luồng này.

## 9. Chạy thử local với Supabase thật (tùy chọn)

```powershell
Copy-Item .env.example .env.local
```

Mở `.env.local`, điền đúng các biến như bảng bước 5. Để trống `VITE_SITE_URL` khi muốn QR dùng địa chỉ local/LAN. Không commit file này. Khi cần chạy cả backend Vercel:

```powershell
npx vercel dev --listen 3000
```

CLI có thể yêu cầu đăng nhập/link Vercel project. Dừng server đang chiếm cổng 3000 trước khi chạy. Chỉ chạy `npm.cmd run dev` thì không cung cấp Function `/api/wishes` của production; dùng cách đó cho demo khi chưa cấu hình Supabase. Dùng Supabase riêng để thử nếu không muốn dữ liệu thử vào database sự kiện.

## 10. Tra lỗi thường gặp

| Hiện tượng | Cách kiểm tra/xử lý |
| --- | --- |
| Vẫn hiện bản trải nghiệm | Kiểm tra hai biến `VITE_SUPABASE_*` ở đúng môi trường, Redeploy rồi mở đúng domain production. |
| Gửi báo 503 | Kiểm tra `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_SALT`; kiểm tra project Supabase đang hoạt động. |
| Gửi báo 500 | Xem Vercel Function Logs cho `/api/wishes`, đối chiếu mã lỗi; kiểm tra migration 001 và key server cùng project. |
| API/key báo 401 | Sao chép lại đúng loại key, URL cùng project; kiểm tra key có bị thu hồi không, lưu biến rồi Redeploy. |
| Gửi báo 429 | Đã chạm giới hạn: 5 lần/10 phút theo phiên thiết bị, 300 lần/10 phút theo IP. Đợi hết cửa sổ giới hạn. |
| Admin đăng nhập được nhưng chưa có quyền | Thêm UUID Auth của đúng user vào `public.admins`; dùng nút Kiểm tra lại. |
| Invalid login credentials/email chưa xác nhận | Kiểm tra email/mật khẩu trong Authentication và trạng thái xác nhận; mật khẩu database không dùng để đăng nhập website. |
| Chưa có hàm hoặc lỗi PGRST202/42883 | Kiểm tra đã chạy đủ các file 001–006 trên đúng project, đặc biệt 003 cho công cụ admin. |
| Đã gửi nhưng chưa lên cây | Kiểm tra bản ghi đang `pending`; admin phải Duyệt để chuyển thành `approved`. |
| Đã duyệt nhưng chậm cập nhật | Chạy 002 và check-connection.sql; kiểm tra WebSocket/mạng, đợi tải lại dự phòng khoảng 15 giây. |
| Trang con 404 hoặc API trả HTML | Kiểm tra Root Directory và file `vercel.json`, bảo đảm `api/` nằm trong source được import. |
| QR sai domain hoặc mở localhost | Sửa `VITE_SITE_URL`, Redeploy rồi tải lại QR từ `/setup`. |
| Người quét bị yêu cầu đăng nhập Vercel | Dùng domain production công khai và kiểm tra cấu hình bảo vệ deployment. |

Tìm lỗi server tại Vercel project → Logs/Function Logs, lọc request `/api/wishes`; lỗi build xem trong deployment → Build Logs. Khi gửi thông tin nhờ hỗ trợ, chỉ chia sẻ mã lỗi và thông tin đã che key.

Tài liệu mô tả quy trình theo source hiện tại; việc build/test thành công chưa xác nhận kết nối với project Supabase/Vercel của bạn. Hoàn tất bước 7 trước khi sử dụng tại sự kiện. Xem thêm [DEPLOY.md](DEPLOY.md) để đọc luồng vận hành và các thao tác kiểm tra nâng cao.

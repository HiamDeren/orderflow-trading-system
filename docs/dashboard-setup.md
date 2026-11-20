# ZenDojo (trước là Deren Desk) · cấu hình đăng nhập Discord và biến môi trường

Dashboard (Next.js trong `apps/web`) nằm ở các đường dẫn `/dashboard`, `/calendar`, `/news`, `/earnings`, `/trade-plan`, `/journal` (+ `/journal/pnl`), `/knowledge`, `/profile`. `/studio` và `/pnl` cũ tự chuyển sang đường dẫn mới. `/` là cửa vào: đã đăng nhập → `/dashboard`, chưa → `/login`. Trang học cũ không cần đăng nhập: trang chủ học chuyển sang `/learn` (`/index.html` tự về đây), `/plan`, `/levels`, `/tools`, `/quiz` giữ nguyên.

Chỉ **một** tài khoản Discord (ID trong `OWNER_DISCORD_ID`) vào được. Tài khoản khác đăng nhập sẽ bị đăng xuất và xoá khỏi Supabase Auth ngay.

## Đổi tên sang ZenDojo trên các app (2026-11-20, D50)
Làm theo thứ tự. Code trong repo đã dùng tên mới; các bước dưới là việc trên dashboard của từng app.

1. **GitHub:** repo → Settings → General → Repository name: `zendojo` → Rename. GitHub tự chuyển hướng link và lệnh git cũ. Máy local: `git remote set-url origin https://github.com/HiamDeren/zendojo.git`.
2. **Vercel – tên project:** Project → Settings → General → Project Name: `zendojo` → Save. Kiểm tra Settings → Git vẫn nối với `HiamDeren/zendojo` (nếu mất kết nối thì Connect lại repo, Production Branch `production`). Link preview của nhánh (`zendojo-git-development-derenluus-projects.vercel.app`) chỉ có từ lần deploy **sau** khi đổi tên: push một commit hoặc Redeploy bản mới nhất của `development`.
3. **Vercel – domain:** Settings → Domains → Add `zendojo-deren.vercel.app`, gắn cho Production. Sửa domain cũ `orderflow-trading-system.vercel.app` → Redirect to `zendojo-deren.vercel.app` (308), giữ để link cũ không chết.
4. **Supabase – tên project:** Project Settings → General → Project name: `ZenDojo` → Save. Ref, URL và key không đổi, không phải sửa biến môi trường.
5. **Supabase – Auth URL:** Authentication → URL Configuration:
   - Site URL: `https://zendojo-deren.vercel.app`
   - Redirect URLs thêm: `https://zendojo-deren.vercel.app/auth/callback`, `https://zendojo-git-development-derenluus-projects.vercel.app/auth/callback`. Giữ URL cũ tới khi đăng nhập trên domain mới chạy ổn rồi mới xoá.
6. **Discord Developer Portal:** Redirect của OAuth app vẫn là `https://<ref>.supabase.co/auth/v1/callback`, không đổi. Đổi tên app thành "ZenDojo" (nếu chưa).
7. **ATAS Plan Sender:** đổi `ApiUrl` thành `https://zendojo-deren.vercel.app/api/plan` (không dựa vào chuyển hướng cho lệnh POST).
8. **Kiểm tra:** đăng nhập Discord trên domain mới và trên preview `development`; gửi thử plan (JSON mẫu) lên domain mới.

## 1. Tạo ứng dụng OAuth trên Discord

1. Mở https://discord.com/developers/applications → **New Application** (tên `ZenDojo`, icon lấy `apps/web/public/assets/img/zendojo/icon-512.png`).
2. Tab **OAuth2**:
   - Copy **Client ID**, bấm **Reset Secret** rồi copy **Client Secret** (chỉ dán vào Supabase, không gửi qua chat, không commit).
   - **Redirects** → thêm đúng: `https://gpbypxuglcfmvarmferr.supabase.co/auth/v1/callback`
3. Lấy Discord ID của chính mình: Discord → User Settings → Advanced → bật **Developer Mode**; bấm chuột phải vào tên mình → **Copy User ID**.

## 2. Bật provider Discord trên Supabase

1. Supabase → project **ZenDojo** (trước là Personal Trading Dashboard) → **Authentication → Sign In / Providers → Discord**: bật, dán Client ID + Client Secret, lưu.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://zendojo-deren.vercel.app`
   - **Redirect URLs** thêm (Supabase so khớp cả chuỗi, app gọi đúng `<origin>/auth/callback` không kèm query):
     - `https://zendojo-deren.vercel.app/auth/callback`
     - `https://zendojo-git-development-derenluus-projects.vercel.app/auth/callback` (link cố định của nhánh `development`; không dùng `*` cho chặt hơn, nên test preview qua link này)
     - `http://localhost:3000/auth/callback` (chỉ khi chạy local)
3. **Project Settings → API Keys**: copy **Publishable key** (`sb_publishable_...`). Key này an toàn cho trình duyệt.

## 3. Biến môi trường trên Vercel

| Biến | Giá trị | Môi trường |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gpbypxuglcfmvarmferr.supabase.co` | Production (+ Preview nếu muốn đăng nhập ở preview) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | như trên |
| `OWNER_DISCORD_ID` | Discord User ID của Deren | như trên |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PLAN_TOKEN`, `DISCORD_WEBHOOK_TRADE_PLAN` | đã có | giữ nguyên |
| `ECON_CALENDAR_URL` | (tuỳ chọn) nguồn lịch khác | mặc định feed tuần hiện tại của ForexFactory |
| `FINNHUB_API_KEY` | key miễn phí ở https://finnhub.io/register (loại **Secret**) | Production + Preview · cần cho News, Earnings, Stocks, Markets |
| `COINGECKO_API_KEY` | key Demo miễn phí ở https://www.coingecko.com/en/developers/dashboard | Production + Preview · cần cho tab Crypto ở Markets |

Biến `NEXT_PUBLIC_*` được nhúng lúc build: đổi xong phải **Redeploy**.

## 3b. Cho bạn vào test (khách, D48)
Không cần biến môi trường. Bạn của Deren mở `/login`, bấm **Tiếp tục với Discord** → bị từ chối nhưng vào hàng chờ. Deren vào **Profile → Khách truy cập** bấm **Duyệt**, người đó đăng nhập lại là vào được. Cũng có thể thêm thẳng bằng Discord User ID (Discord → Settings → Advanced → Developer Mode → chuột phải tên → Copy User ID). **Gỡ quyền** có hiệu lực ngay và xoá user Supabase của khách. Khách chỉ xem Dashboard (không plan / journal), Calendar, News, Earnings, Markets, Stock, Knowledge. Cần bảng `access.members` (migration `20261119071248_access_members`) và thêm schema `access` vào **Exposed schemas** (Dashboard → Integrations → Data API → Settings), giống lúc thêm `trading`.

## 4. Database

Migration mới: `supabase/migrations/20261118075449_journal_days_trades.sql` (bảng `trading.journal_days`, `trading.journal_trades`, RLS bật, chỉ `service_role`). Đã áp lên Supabase production ngày 2026-11-18.

## 5. Kiểm tra sau khi deploy

1. Mở `/dashboard` → chuyển sang `/login` → **Tiếp tục với Discord** → về `/dashboard`.
2. `/profile` hiện avatar, tên, ID Discord; phần Kết nối đều chấm xanh.
3. Thử tài khoản Discord khác (nếu có): phải về `/login?e=denied`.
4. ATAS vẫn gửi `POST /api/plan` bằng `PLAN_TOKEN` như cũ; Plan Studio gửi bằng phiên đăng nhập, không cần token.

## Cách kiểm quyền (tóm tắt)

- `/auth/callback` đọc Discord ID từ `auth.identities` (Discord trả về, người dùng không sửa được), so với `OWNER_DISCORD_ID`.
- Đúng: server đặt `app_metadata.desk_owner = true` bằng secret key (chỉ server ghi được) rồi làm mới phiên.
- `proxy.ts` và mọi trang / API dashboard đọc JWT bằng `getClaims()` và chỉ cho qua khi `app_metadata.desk_owner = true`. Không dùng `user_metadata` để phân quyền.
- Đọc ghi bảng `trading.*` đi qua secret key ở server sau khi đã kiểm chủ sở hữu; bảng vẫn khoá RLS với `anon` / `authenticated`.

# Deren Desk · cấu hình đăng nhập Discord và biến môi trường

Dashboard (Next.js trong `apps/web`) nằm ở các đường dẫn `/dashboard`, `/calendar`, `/studio`, `/journal`, `/pnl`, `/knowledge`, `/profile`. `/` là cửa vào: đã đăng nhập → `/dashboard`, chưa → `/login`. Trang học cũ không cần đăng nhập: trang chủ học chuyển sang `/learn` (`/index.html` tự về đây), `/plan`, `/levels`, `/tools`, `/quiz` giữ nguyên.

Chỉ **một** tài khoản Discord (ID trong `OWNER_DISCORD_ID`) vào được. Tài khoản khác đăng nhập sẽ bị đăng xuất và xoá khỏi Supabase Auth ngay.

## 1. Tạo ứng dụng OAuth trên Discord

1. Mở https://discord.com/developers/applications → **New Application** (tên ví dụ `Deren Desk`).
2. Tab **OAuth2**:
   - Copy **Client ID**, bấm **Reset Secret** rồi copy **Client Secret** (chỉ dán vào Supabase, không gửi qua chat, không commit).
   - **Redirects** → thêm đúng: `https://gpbypxuglcfmvarmferr.supabase.co/auth/v1/callback`
3. Lấy Discord ID của chính mình: Discord → User Settings → Advanced → bật **Developer Mode**; bấm chuột phải vào tên mình → **Copy User ID**.

## 2. Bật provider Discord trên Supabase

1. Supabase → project **Personal Trading Dashboard** → **Authentication → Sign In / Providers → Discord**: bật, dán Client ID + Client Secret, lưu.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://orderflow-trading-system.vercel.app`
   - **Redirect URLs** thêm (Supabase so khớp cả chuỗi, app gọi đúng `<origin>/auth/callback` không kèm query):
     - `https://orderflow-trading-system.vercel.app/auth/callback`
     - `https://orderflow-trading-system-git-development-derenluus-projects.vercel.app/auth/callback` (link cố định của nhánh `development`; không dùng `*` cho chặt hơn, nên test preview qua link này)
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

Biến `NEXT_PUBLIC_*` được nhúng lúc build: đổi xong phải **Redeploy**.

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

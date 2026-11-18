# 09 · Nhật ký thay đổi

Ghi theo ngày, mới nhất ở trên. Chi tiết từng commit: `git log`.

## 2026-11-18 · Code dashboard Deren Desk
- Next.js: `app/(desk)/` (dashboard, calendar, studio, journal, pnl, knowledge, profile), `app/login`, `app/auth/*`, `proxy.ts` (Next 16), `app/desk.css`. Thư viện mới: `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.119.0.
- Đăng nhập Discord một người (D38). `/api/plan` nhận thêm phiên đăng nhập (ngoài `PLAN_TOKEN`) và `?month=`; token sai vẫn 401.
- Migration `20261118075449_journal_days_trades`, test trên Postgres 16 local (check constraint, cascade, anon bị chặn) rồi áp lên Supabase production; advisor chỉ còn INFO "RLS bật, không policy" (cố ý, chỉ server đọc ghi).
- Lịch kinh tế: feed tuần của ForexFactory, lọc USD, cache 15 phút (`lib/econ.ts`).
- `/` thành cửa vào dashboard (proxy: có phiên chủ sở hữu → `/dashboard`, chưa → `/login`); trang chủ học cũ chuyển sang `/learn`, `/index.html` → `/learn` (redirect tạm, không permanent).
- Test local với Supabase giả: chưa đăng nhập / tài khoản lạ bị chuyển về `/login`, các trang 200, lưu journal + PnL khớp (+$338.8), ATAS token vẫn dùng được.

## 2026-11-18 · Thiết kế dashboard mới (Deren Desk)
- Canvas thiết kế 7 màn hình: Login (chỉ Discord, hình nền riêng), Profile, Dashboard, Plan Studio (có lịch sử theo ngày), Journal (có các ô recap chữ), PnL Calendar, Knowledge (AMT → Context → Entry). Link và việc cần làm ghi ở [08-roadmap.md](08-roadmap.md) mục "Dashboard mới".
- Chỉnh tiếp: lịch tháng tách sang trang Calendar (Dashboard còn tin hôm nay + dải tuần), menu Knowledge gộp một mục có 3 tab, bảng lệnh journal thêm số hợp đồng / PnL $ / phí / net, thêm bảng mẫu trạng thái trống và lỗi.
- Economic calendar chỉ gọi API, không lưu database (D37).
- Chốt hướng: chỉ một tài khoản Discord của Deren được đăng nhập; lịch sử plan theo ngày cần thêm query danh sách ngày phía server (ghi vào roadmap, làm sau).

## 2026-11-18 · Nút gửi plan + log API
- Test production thành công: database + Storage (WebP 118 KB) + Discord. Hai lỗi gặp trên đường: secret key trên Vercel không hợp lệ (401 REST + 400 Storage thiếu authorization) → tạo key mới + redeploy; schema `trading` chưa expose (406 PGRST106) → thêm vào Data API (Dashboard: Integrations → Data API → Settings).
- Plan Builder có nút **Gửi plan lên web** (tuỳ chọn kèm Discord), hiện kết quả từng bước (database / ảnh / Discord) và lý do lỗi (401 token theo domain, 500 thiếu biến môi trường ở preview, 502 Supabase).
- `/api/plan` ghi log từng bước vào Vercel Runtime Logs (`[api/plan] ...`, không ghi token / key / webhook).

## 2026-11-18 · Storage theo ngày + API bền hơn
- Nén ảnh WebP (`lib/image.ts`, sharp): plan lossless 331 KB → 102 KB; journal q85 ≤ 2560 px. Discord nhận cùng file WebP.
- Bucket `trading` (migration `storage_trading_bucket`), đường dẫn `YYYY/MM/DD/plan|journal/...` (`apps/web/lib/storage.ts`); recap gộp vào journal.
- `/api/plan`: database lỗi vẫn vẽ ảnh + lưu Storage + gửi Discord, trả 502 kèm kết quả. Test mock 3 tình huống (bình thường / DB lỗi / Storage lỗi).

## 2026-11-18 · Timestamptz
- Deren đổi lại cột thời gian sang `timestamptz` trên dashboard (theo khuyến nghị Supabase); việc đổi kiểu lại làm mất default `NOT NULL` → migration `trade_plans_timestamptz_defaults` đặt lại default `now()`, trigger `now()`. Bảng đang trống (dòng 17/11 chép từ Sydney không còn); project Sydney đã xoá.
- Bài học: đổi schema trên dashboard dễ làm mất default; luôn đổi bằng file migration (D30).

## 2026-11-18 · Monorepo Next.js + nhánh production / development
- Chốt stack (D26–D30). Monorepo pnpm: `apps/web` (Next.js 16, TypeScript), `supabase/` (config + 3 migration khớp version trên production, kiểm bằng Postgres local).
- Site tĩnh chuyển vào `apps/web/public/`; `next.config.ts` giữ URL sạch, redirect `.html`, `/testing`, `/overlap`, header cache. `vercel.json` gốc bỏ, `apps/web/vercel.json` chỉ còn region `sin1`.
- `api/plan.js` → `apps/web/app/api/plan/route.ts`, giữ nguyên hợp đồng; test local với Supabase/Discord giả: 401/400/405, POST mẫu ra PNG 338.930 byte như cũ, header `Content-Profile`/`Accept-Profile: trading`.
- Script i18n, check-plan-core, build-artifact, hook Claude Code đổi sang đường dẫn mới; snapshot plan-core khớp, bản EN và artifact không đổi.
- Nhánh: `main` → `production`; `development` là nhánh mặc định (D31).
- Cutover: ruleset GitHub cho `production`; Vercel Root Directory `apps/web` + Next.js + Production Branch `production`; PR #1 merge → production chạy Next.js. `main` còn giữ tới khi gửi plan thật ổn.

## 2026-11-18 · Chuyển Supabase sang Singapore, tách schema
- Project mới **Personal Trading Dashboard** (`gpbypxuglcfmvarmferr`, `ap-southeast-1`); project Sydney giữ tạm.
- Bỏ `public`: bảng chuyển thành `trading.trade_plans`, hàm trigger thành `util.touch_updated_at()`; `id` đổi từ bigint identity sang `uuid`. Chép dòng plan 2026-11-17 sang (khớp md5).
- `api/plan.js` gửi `Accept-Profile` / `Content-Profile: trading`; `vercel.json` đặt function ở region `sin1` (Singapore) cho gần database.
- Vercel: cập nhật `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` sang project mới.
- Deren đổi `created_at` / `updated_at` sang `timestamp` (không tz). Đặt lại default `now() at time zone 'utc'` (đổi kiểu làm mất default trong khi cột NOT NULL), trigger ghi giờ UTC; trang plan thêm `Z` khi hiển thị `updated_at`.

## 2026-11-17 · Plan tự động và chuẩn bị chuyển web app
- Tạo lại bảng `trade_plans` (đang trống): bỏ cột `price`, thứ tự cột `id, created_at, updated_at, trade_date, symbol, summary, plan_text, image_path, payload`, comment từng cột, thu quyền anon/authenticated; `api/plan.js` không ghi / đọc `price` nữa.
- **Composite × pRTH × OVN thành system trade plan chính.** Gộp Plan Builder cổ điển và Testing plan thành trang **Trade Plan** (`plan.html`, chương 00–06); bỏ builder cổ điển (`plan-chart.js`, code builder trong `levels-page.js`); `testing.*` → `plan.*` (`plan-page.js`, `plan.css`, scope `.pg-plan`); `/testing`, `/overlap` redirect về `/plan`; sidebar nhóm "Trade plan"; trang chủ một thẻ Trade Plan; chương 08 khoá Level có callout trỏ sang Trade Plan.
- Artifact đổi tên "NQ Trade Plan · Composite × pRTH × OVN", engine lấy từ `plan-core.js` (bỏ bản engine riêng), nguồn đưa vào `artifact/` + `scripts/build-artifact.mjs`.
- Claude Code: `.claude/settings.json` + 5 hook Node, 7 subagent, 3 lệnh tắt; `scripts/check-plan-core.mjs` + snapshot; `claude/10-claude-code.md`, `claude/prompts/chuyen-doi-web-app.md`.
- Ghi bối cảnh dự án: `CLAUDE.md` + thư mục `claude/` (roadmap chuyển từ `docs/ROADMAP.md` sang `claude/08-roadmap.md`).
- Discord: biến `DISCORD_WEBHOOK_TRADE_PLAN` (vẫn nhận `DISCORD_WEBHOOK_URL`), avatar webhook. Test đầu-cuối web → Supabase → Storage → Discord thành công; xoá dòng test.
- Server tự vẽ ảnh plan tiếng Việt (resvg + font gói kèm), lưu Supabase Storage, gửi Discord; `GET /api/plan` trả link ảnh ký tạm; nút "Lấy plan mới nhất từ web" (`94cd84e`).
- Tách `plan-core.js` dùng chung trình duyệt và server.
- Đổi tên bảng `plans` → `trade_plans`; API nhận thêm tên biến key do tích hợp Supabase tạo.
- Ảnh plan: profile TPO pRTH và OVN đặt sát nhau, plan chữ bên phải, nút copy ảnh (bỏ tải SVG); nhãn "Prev RTH".
- Bỏ chương "Ví dụ 16/11"; Plan Builder nhập JSON từ indicator ATAS; `api/plan.js` lưu plan lên Supabase (`d6aebb4`).
- Thêm chương VWAP RTH; bỏ chương Màu ATAS trên web.
- Thay trang RTH × OVN Overlap bằng **Composite × pRTH × OVN** (`testing.html`; `/overlap` chuyển hướng về `/testing`).
- Ngoài repo: Supabase project và bucket, biến môi trường Vercel, artifact "Composite × pRTH × OVN Playbook" làm lại theo hướng composite.

## 2026-11-12 · Testing plan đầu tiên (RTH × OVN overlap, đã thay)
- Thêm trang RTH × OVN Overlap, thêm lớp day type RTH hôm qua.
- Backtest 47 phiên: overlap chưa có edge; open type + EMA cho nhiều thông tin hơn (xem [05](05-nghiep-vu-trading.md#kết-luận-backtest-để-không-lặp-lại)).

## 2026-11-09 → 11-10 · Mở rộng nội dung
- Chương EMA 9/34 trong khoá TPO Level, viết lại không dùng ICT.
- Chương Tape: ba lần quét, ma trận kiểm soát, 7 pattern.

## 2026-11-05 · Khởi tạo site
- Gộp hai artifact Orderflow Tools Playbook và TPO Level Playbook thành website học tập (Vercel).
- Bản tiếng Anh tự sinh, đồng hồ phiên realtime theo giờ VN, chương Initial Balance.
- Plan Builder tách thành `plan.html`, vẽ bản đồ level, copy ảnh.
- Giao diện tối toàn site.

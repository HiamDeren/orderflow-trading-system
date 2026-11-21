# 08 · Roadmap

Danh sách việc còn lại. Khi Deren nhắn "liệt kê các việc còn lại", trả lời từ file này.
Hướng dài hạn: **web app cá nhân / dashboard** (xem [07-chuyen-doi-web-app.md](07-chuyen-doi-web-app.md)).

Cập nhật: 2026-11-21 (đối chiếu trạng thái thật, chốt đợt ship dashboard, phương án T12, chẩn đoán Plan Sender).

## Đã xong
- [x] Trade Plan · Composite × pRTH × OVN là system chính (2026-11-17): gộp Plan Builder cổ điển + Testing plan thành trang `plan.html`, Plan Builder vẽ ảnh TPO kèm plan chữ, copy ảnh.
- [x] Plan Builder nhập JSON từ ATAS (dán / clipboard / file) và **"Lấy plan mới nhất từ web"**.
- [x] Supabase: bảng `trading.trade_plans`, bucket private `trading` (theo ngày / loại), RLS bật, chỉ server đọc ghi.
- [x] Vercel: `apps/web/app/api/plan/route.ts` (token); biến `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PLAN_TOKEN`, `DISCORD_WEBHOOK_TRADE_PLAN` đã đặt.
- [x] Server tự vẽ ảnh plan tiếng Việt (PNG), lưu Storage, gửi Discord qua webhook. Test đầu-cuối bằng JSON mẫu thành công 2026-11-17.
- [x] `plan-core.js`: một nguồn code cho tính plan + vẽ ảnh, dùng chung web và server.
- [x] Avatar webhook Discord "Trade Plan".
- [x] Bối cảnh dự án ghi vào `CLAUDE.md` + thư mục `claude/`.
- [x] Claude Code: hook, 7 subagent, lệnh `/viec-con-lai` `/kiem-tra` `/ship`, snapshot plan-core, prompt chuyển đổi web app.

## Việc còn lại · plan tự động
1. [x] **Indicator Plan Sender build xong (2026-11-17):** offline khớp tuyệt đối 11/11 và 12/11 (`plans/VALIDATION.md` trên máy).
1b. [ ] **Kiểm số trên chart ATAS** (Price scale = 1, "Tính như ngày" 12/11 và 11/11), điền bảng mục 2 của `VALIDATION.md`.
1c. [ ] **Sửa indicator theo `docs/plan-sender/PROMPT_PlanSender_fix-2026-11-21.md`:** chặn gửi khi chart gộp giá, một lần gửi / ngày, không theo redirect, log khi tắt web; đưa source thật vào `indicators/plan-sender/` (repo đang giữ bản cũ). [CẦN XÁC NHẬN source nằm ở đâu trên máy]
2. [ ] **Đổi API URL trong indicator** sang `https://zendojo-deren.vercel.app/api/plan` (đang là domain cũ, 307 → sẽ `401`); nhập lại token cho nút "Lấy plan mới nhất" trên domain mới (localStorage theo domain).
3. [x] **Test đầu-cuối trên production (2026-11-18):** nút "Gửi plan lên web" với JSON ATAS 17/11 → database `trading.trade_plans`, ảnh WebP `trading/2026/11/17/plan/`, Discord nhận ảnh.
3b. [ ] **Test buổi sáng thật:** 19/11 9:29 ET indicator gửi `HTTP 200` → DB + ảnh WebP + Discord đều có, nhưng số sai (Price scale 4) và Discord 2 tin (bấm tay + tự gửi). Làm lại sau 1c + 2: 1 tin Discord, số đúng, nút "Lấy plan mới nhất" khớp.
3c. [ ] Merge API chống Discord trùng + đẩy cảnh báo indicator lên Discord (`development` 2026-11-21) sang `production`.
4. [x] Bucket cũ `trade-plans`: đã mất cùng project Sydney (xoá 2026-11-18); project ZenDojo chỉ có bucket `trading`.

## Việc còn lại · dọn dẹp và an toàn
- [x] Supabase: chuyển sang project Singapore, tách schema `trading` / `util`, `id` uuid (2026-11-18).
- [x] Supabase: xoá project Sydney (Deren xoá 2026-11-18).
- [x] Supabase: thu quyền `anon` / `authenticated` trên `trade_plans` (làm khi tạo lại bảng 2026-11-17).
- [x] `public.rls_auto_enable()` (event trigger Supabase tự tạo, owner `postgres`): chỉ `postgres` + `service_role` có EXECUTE, advisor không còn cảnh báo (kiểm 2026-11-21).
- [ ] Advisor còn WARN "Leaked password protection" (Auth): không ảnh hưởng vì chỉ đăng nhập Discord; bật nếu sau này có mật khẩu.
- [ ] Khi có nhiều API: đổi `PLAN_TOKEN` thành token chung (ví dụ `API_TOKEN`) hoặc chuyển sang đăng nhập.
- [x] Artifact đổi tên "NQ Trade Plan · Composite × pRTH × OVN", dùng chung `plan-core.js`, nguồn trong `artifact/`.
- [x] Gỡ `i18n/__pycache__/` khỏi git (đã thêm vào `.gitignore`).

## Ý tưởng tiếp theo cho Trade Plan
- [x] Log phiên lên Supabase (2026-11-21, D51): cột trong `journal_entries` + `journal_trades.setup`, form trong Journal, thống kê theo thời gian.
- [ ] Recap sau phiên: kết quả thực tế so với plan (bias đúng / sai, tới HVN kế tiếp hay không).
- [ ] Backtest khung Composite × pRTH × OVN khi có data M30 6–12 tháng (indicator xuất thêm nến M30).
- [ ] Discord bot (khác webhook): lệnh `/plan` xem lại plan, `/log` ghi kết quả phiên ngay trong Discord.

## Chuyển sang web app / personal dashboard
Chi tiết: [07-chuyen-doi-web-app.md](07-chuyen-doi-web-app.md).
- [x] Giai đoạn 0: Deren chốt stack 2026-11-18 (D26–D30).
- [x] Giai đoạn 1 (code, 2026-11-18): monorepo pnpm, `apps/web` Next.js, trang cũ trong `apps/web/public/`, `/api/plan` route handler, `supabase/` migration.
- [x] Giai đoạn 1 (cutover, 2026-11-18): GitHub nhánh mặc định `development`, ruleset bảo vệ `production` (PR bắt buộc, chặn force push / xoá); Vercel Root Directory `apps/web`, Next.js, Production Branch `production`; PR #1 merge, production chạy Next.js (trang + `/api/plan` 401 không token).
- [ ] Xoá nhánh `main` sau khi lần gửi plan thật 9:29 ET chạy ổn trên bản mới (Discord + dòng mới trong `trading.trade_plans`).
- [ ] Supabase project dev cho Preview (dùng chỗ trống sau khi xoá project Sydney) + biến môi trường Preview trên Vercel.
- [ ] GitHub Actions: `pnpm build` + `check` cho mọi PR; `supabase db push` khi merge vào `production`.
- [ ] Biome (lint / format), Vitest cho plan-core, Playwright vào repo.
- [ ] Giai đoạn 2: đăng nhập chủ site, `profiles` + `user_state`, nhập file sao lưu tiến độ cũ.
- [ ] Giai đoạn 3: shell component + trang dashboard (plan hôm nay, đồng hồ phiên, lịch tin).
- [ ] Giai đoạn 4: port dần Trade Plan, Quiz, hai khoá học.
- [ ] Giai đoạn 5: module mới: economic calendar, options (GEX / DEX / OI, gộp repo Gex-Dashboard), earnings, news, heatmap.
- [ ] Các module khác Deren tự quyết: journal, tài chính cá nhân, học tiếng Anh, tập luyện...

## Dashboard mới · ZenDojo (trước là Deren Desk; code 2026-11-18, nhánh `development`)
Bản thiết kế (canvas): https://claude.ai/artifact/Bpk6CF9e83hZtGRdZeKTnw. Màu graphite trầm + nhấn cát `#D4B483`, Long `#8CC2A4`, Short `#E0947C`; font Inter + JetBrains Mono. Code: `apps/web/app/(desk)/`, `apps/web/lib/`, `apps/web/proxy.ts`. Cấu hình: [docs/dashboard-setup.md](../docs/dashboard-setup.md).

**Việc Deren cần làm để chạy được:**
- [ ] Tạo Discord OAuth app, bật provider Discord trên Supabase, thêm Redirect URLs (docs/dashboard-setup.md bước 1–2).
- [ ] Vercel: thêm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `OWNER_DISCORD_ID` (Production + Preview), redeploy.
- [x] Áp migration `20261118075449_journal_days_trades` lên Supabase (2026-11-18, RLS bật, anon / authenticated không có quyền).
- [ ] Test trên preview `development`, rồi PR `development` → `production`.

**Đã code (2026-11-18):**
- [x] Đăng nhập chỉ Discord, một người (D38): `/login`, `/auth/login`, `/auth/callback`, `/auth/logout`; `proxy.ts` chặn trang dashboard; tài khoản lạ bị đăng xuất + xoá.
- [x] Profile: avatar / tên / ID Discord, thiết lập giao dịch (`lib/settings.ts`), trạng thái kết nối, đăng xuất mọi thiết bị.
- [x] Dashboard: đồng hồ ET / VN + đếm ngược, timeline phiên có chấm tin lấy từ lịch, card plan hôm nay (level từ plan-core, ảnh ký tạm), tin USD hôm nay + dải tuần, nhắc journal, ô Options; trạng thái chưa có plan trước / sau 09:29, cuối tuần, lỗi database.
- [x] Calendar: lịch tháng + danh sách tin ngày chọn, lọc tin cao; chỉ gọi API, cache 15 phút (D37); trạng thái lỗi nguồn.
- [x] Plan Studio: dán JSON → `/api/plan` bằng phiên đăng nhập (không cần token), kết quả 4 bước; lịch sử theo tháng (`GET /api/plan?month=`), xem plan + ảnh từng ngày.
- [x] Journal: bảng `journal_days` + `journal_trades`, form thuộc tính ngày + bảng lệnh (HĐ, R, PnL $, phí, theo plan, lỗi) + 9 ô recap; thống kê 20 ngày; `/api/journal`.
- [x] PnL Calendar: Thứ 2–6 + tổng tuần, đổi $ / R, bấm ngày mở journal.
- [x] Knowledge: 3 tab AMT / Context / Entry, link sang trang học cũ.

**Đợt 2 (2026-11-18, sau test preview):**
- [x] Scrollbar mảnh; sidebar ghim / thu gọn thành cột icon (rê chuột mở rộng); layout mobile (thanh trên + ngăn kéo).
- [x] VI / EN (mặc định VI) ở sidebar, thanh trên mobile, trang login, Profile; múi giờ hiển thị chọn ở Profile (Calendar nhóm ngày theo múi giờ này, khớp forexfactory.com).
- [x] Plan Studio đổi tên **Trade Plan** (`/trade-plan`); ảnh plan qua `/api/plan/image` cùng origin + nút **Copy ảnh** (PNG vào clipboard).
- [x] PnL Calendar thành tab con của Journal (`/journal/pnl`); bỏ thẻ Journal khỏi Dashboard.
- [x] **News** và **Earnings** tách 2 trang + thẻ trên Dashboard (Finnhub, D40). Lịch trên Dashboard thu gọn (tối đa 6 tin, một dòng / tin).
- [x] Áp migration `20261118090014_trade_days_hub` lên Supabase (2026-11-18): 6 bảng `trading.*` đều RLS bật, anon không có quyền, `save_journal` chỉ service_role chạy được.
- [x] News / Earnings bật lại (2026-11-18): Deren đã thêm `FINNHUB_API_KEY` (Production + Preview); 2 mục về lại menu Tổng quan, thẻ hiện trên Dashboard.

**Đợt 3 (2026-11-18):**
- [x] Calendar: nút **Ngày | Tuần**, chế độ tuần liệt kê tin từng ngày (Thứ 2 → 6, cuối tuần khi có tin), bấm tên ngày quay về xem ngày đó.
- [x] Sidebar thu gọn: rê chuột không còn đẩy nội dung (chữ mờ dần thay vì ẩn / hiện).
- [x] Earnings dạng lịch tháng (Thứ 2 → 6), ô ngày có số mã + chip mã lớn, bên phải chi tiết ngày chia Trước mở cửa / Trong phiên / Sau đóng cửa.
- [x] News: 20 bài / lần (nút tải thêm, tối đa 100) + đọc bài ngay trong app (`lib/reader.ts`, D42); trang nguồn chặn thì hiện tóm tắt + link gốc. Tin trên Dashboard mở thẳng vào trình đọc.
- [x] Journal: ảnh lệnh (tải lên, dán Ctrl+V, kéo thả, ghi chú, gắn Lệnh n, xem lớn) — bảng `trading.journal_images` + `/api/journal/image` (D43).
- [x] Lưới trang đều hơn: nội dung tối đa 1360 px giữa màn hình, Journal 3 cột cố định, Calendar / Earnings / News / Trade Plan chia 2 cột cùng kiểu.
- [x] Áp migration `journal_images` lên Supabase (2026-11-21, file đổi tên `20261121073856_journal_images.sql` khớp version).

**Đợt 4 (2026-11-19):**
- [x] Calendar / Earnings / News vừa khung màn hình (desktop ≥ 1101 px): không cuộn cả trang, từng khung tự cuộn; `scrollbar-gutter` 2 bên để các trang căn giữa như nhau.
- [x] Journal: nút **Lưu journal** lên thẻ đầu (cùng ngày + thuộc tính), Ctrl+S, nhắc khi rời trang lúc chưa lưu; 3 cột thẳng hàng đầu.
- [x] Trang **Stocks** (D44): tìm mã, earnings sắp tới NQ top; trang mã có giá, chart TradingView, chỉ số, EPS 4 quý / theo năm, biên LN ròng, khuyến nghị analyst, cùng ngành, tin theo mã. Bấm mã ở Earnings / Dashboard mở trang mã.
- [x] Timeline Dashboard: chấm đúng vị trí trên trục (mốc giờ đặt theo thời gian thật, không chia đều), bỏ tin ngoài 04:00–16:00 ET, rê chuột xem tên tin + giờ ET / giờ chọn, bấm mở Calendar; dòng mốc thêm giờ theo múi giờ chọn.
- [x] Bỏ chữ nguồn (Finnhub, ForexFactory) và các dòng ghi chú (chú thích chấm màu, PnL, settings, Markdown).
- [x] Sidebar thu gọn: logo không bị cắt; chọn múi giờ nhanh ở sidebar, thanh trên mobile, Calendar.
- [x] Knowledge: 4 khoá cũ (TPO Level, Trade Plan, Orderflow Tools, Trắc nghiệm) mở trong layout mới (D45), các bài trong 3 tab trỏ thẳng vào chương.

**Đợt 5 (2026-11-19, code theo canvas v2):**
- [x] Shell v2 (D47): thanh trên có đồng hồ NY, tin đỏ kế tiếp + đếm ngược, Ctrl/Cmd+K mở command palette; mobile có thanh tab dưới (Dashboard / Calendar / Markets / Journal / Thêm). Bỏ chia session NY AM / trước / sau phiên.
- [x] Dashboard: watchlist 8 mã, earnings tuần, news + journal 5 ngày gần nhất; plan dạng thang level theo tỉ lệ giá.
- [x] Trang **Markets** (D46): Tổng quan (chỉ số, heatmap sector, top tăng / giảm, heatmap NQ), Stocks theo sector, Crypto (CoinGecko).
- [x] Calendar tuần dạng cột theo ngày + khung chi tiết tin; News có cột lọc chủ đề / mã; Earnings bấm mã mở ngăn tóm tắt (`/api/stock/summary`); trang mã chia tab Tổng quan / Tài chính / Earnings / Tin; recap Journal chia tab.
- [ ] Deren thêm `COINGECKO_API_KEY` (Demo, Production + Preview) để bật tab Crypto.
- [ ] Dọn chữ NY AM còn trong các board v1 của canvas (tuỳ chọn).
- [x] Khách (D48): bảng `access.members` (schema riêng), người lạ đăng nhập vào hàng chờ, duyệt / gỡ / thêm bằng ID ở Profile; khách chỉ xem phần thị trường + Knowledge.
- [x] Áp migration `20261119071248_access_members` lên Supabase (2026-11-19): schema `access` chỉ service_role dùng, RLS bật, anon / authenticated không có quyền.
- [ ] Deren thêm `access` vào Exposed schemas (Dashboard → Integrations → Data API → Settings). Chưa thêm thì Profile báo chưa đọc được bảng, khách chưa vào được.

**Đợt 6 · ZenDojo (2026-11-19):**
- [x] Đổi tên Deren Desk → **ZenDojo** (D49): sidebar, login, tab trình duyệt, ảnh OG khi gửi link, favicon / apple icon.
- [x] Logo ensō mực bút lông khô + glitch (lát dịch ngang, scanline, pixel), chữ ツ bút lông màu cát; nền login núi ghép thanh TPO + mặt trời ensō; minh hoạ trạng thái trống (Dashboard chưa có plan / cuối tuần), trang 404.
- [ ] Deren đổi tên app trên Discord Developer Portal thành "ZenDojo" (màn hình đồng ý khi đăng nhập), đặt icon server / app bằng PNG logo.
- [x] Đổi tên dự án thành **ZenDojo** trong code và tài liệu (D50, 2026-11-20): `package.json`, `supabase/config.toml`, `CLAUDE.md`, `claude/`, subagent, hook, artifact.
- [x] GitHub repo đổi tên `HiamDeren/zendojo`; Vercel project đổi tên `zendojo` (2026-11-20).
- [x] Vercel domain `zendojo-deren.vercel.app` (Production); `orderflow-trading-system.vercel.app` chuyển hướng **307** (docs ghi 308; 307 vẫn giữ POST) — kiểm 2026-11-21.
- [ ] Còn lại theo `docs/dashboard-setup.md` → "Đổi tên sang ZenDojo": Supabase Auth Site URL + Redirect URLs domain mới, `ApiUrl` của indicator ATAS.
- [x] ~~Publish lại artifact~~ — artifact ngừng duy trì (D52, 2026-11-21).

**Còn lại:**
- [ ] Knowledge: Deren tổng hợp nội dung AMT / Context / Entry; port dần `levels.html`, `tools.html`, quiz vào Next.js.
- [x] `/` chuyển hướng vào dashboard (đã đăng nhập) hoặc `/login`; trang chủ học cũ ở `/learn` (2026-11-18).
- [ ] Test tự động (Vitest cho `lib/journal.ts`, `lib/econ.ts`; Playwright cho luồng đăng nhập bằng mock).
- [ ] Menu "Sắp có": Options (GEX / DEX / OI khi có API).

## Đợt đang làm · Ship dashboard lên production (chốt 2026-11-21)
Thực tế: `production` vẫn ở PR #3 (2026-11-18); toàn bộ dashboard đợt 1–6 chỉ chạy trên Preview `development`. Giai đoạn 2–3 và một phần 5 của `claude/07` đã code xong theo hướng khác (Discord OAuth thay email allowlist) → đợt này = **Nghiệm thu + PR `development` → `production`**.
- [x] Preview `48926cc` build READY; `check-plan-core` pass.
- [x] Áp migration `journal_images` (2026-11-21, version `20261121073856`, file đã đổi tên cho khớp).
- [ ] Xác nhận Supabase Auth Redirect URLs có `zendojo-deren` + preview `zendojo-git-development-…`; `access` trong Exposed schemas.
- [ ] POST/GET `/api/plan` trên Preview với JSON mẫu (`notify:false` vì `DISCORD_WEBHOOK_TRADE_PLAN` chỉ có ở Production), xoá dòng + ảnh test.
- [ ] Mở mọi URL cũ + `.en` + hash chương trên Preview.
- [ ] Advisor security: còn 7 INFO `rls_enabled_no_policy` (cố ý, chỉ service_role) + WARN leaked password (không dùng đăng nhập mật khẩu) — ghi nhận, không sửa.
- [ ] Mở PR `development` → `production`, Deren duyệt.

## T12 · Log phiên vào Journal (D51, code 2026-11-21)
- Log phiên ở artifact lưu localStorage khoá **`cb-log`** (chưa có trong danh sách `claude/03`; khung cũ `ov-log`). Trường: date, p (vị trí composite), b (pRTH build), o (OVN), bias, ot (open type + hướng), ib, edge (phản ứng mép HVN), reach (tới HVN kế), setup, r, biasok, note.
- Trùng với `journal_entries`: `open_type`, `bias_correct`; `r` tính được từ `journal_trades`. Deren chốt: thêm cột vào `journal_entries` (D51); artifact dừng (D52).
- [x] Migration `20261121074126_journal_session_log` (đã áp, test `save_journal` trong transaction rồi rollback) + thẻ "Log phiên" trong Journal (điền sẵn từ plan) + cột Setup F / C / V + thống kê có khoảng tin cậy Wilson.
- [ ] Deren test thẻ Log phiên trên Preview.
- [ ] Nhập `cb-log` cũ: Deren bấm "Copy CSV" ở tab Log của artifact, gửi CSV → Claude nhập bằng SQL (dòng có R tạo một lệnh với setup tương ứng).

## Quy ước
- Mỗi thay đổi: push repo, Vercel tự deploy; cập nhật file này và [09-nhat-ky.md](09-nhat-ky.md).
- Ngôn ngữ mặc định VI (`x.html`), EN sinh tự động bằng `python3 i18n/build_en.py`.
- Không commit token, key, URL webhook, CSV dữ liệu Rithmic.

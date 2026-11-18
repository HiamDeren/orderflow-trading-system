# 08 · Roadmap

Danh sách việc còn lại. Khi Deren nhắn "liệt kê các việc còn lại", trả lời từ file này.
Hướng dài hạn: **web app cá nhân / dashboard** (xem [07-chuyen-doi-web-app.md](07-chuyen-doi-web-app.md)).

Cập nhật: 2026-11-18 (thêm mục Dashboard mới).

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
1. [ ] **Indicator Plan Sender (tối 2026-11-17):** chart NQ M30 lookback 30 ngày, Claude Code build `docs/plan-sender/PlanSender.cs` theo `PROMPT_PlanSender.md`, kiểm số với 11/11 và 12/11.
2. [ ] **Bật gửi web trong indicator:** API URL `https://orderflow-trading-system.vercel.app/api/plan` + `PLAN_TOKEN`; log phải có `HTTP 200`.
3. [x] **Test đầu-cuối trên production (2026-11-18):** nút "Gửi plan lên web" với JSON ATAS 17/11 → database `trading.trade_plans`, ảnh WebP `trading/2026/11/17/plan/`, Discord nhận ảnh.
3b. [ ] **Test buổi sáng thật:** 9:29 ET indicator gửi → Discord + Storage, nút "Lấy plan mới nhất" khớp.
4. [ ] Xoá bucket cũ `trade-plans` (trống) trên Dashboard → Storage.

## Việc còn lại · dọn dẹp và an toàn
- [x] Supabase: chuyển sang project Singapore, tách schema `trading` / `util`, `id` uuid (2026-11-18).
- [x] Supabase: xoá project Sydney (Deren xoá 2026-11-18).
- [x] Supabase: thu quyền `anon` / `authenticated` trên `trade_plans` (làm khi tạo lại bảng 2026-11-17).
- [ ] Khi có nhiều API: đổi `PLAN_TOKEN` thành token chung (ví dụ `API_TOKEN`) hoặc chuyển sang đăng nhập.
- [x] Artifact đổi tên "NQ Trade Plan · Composite × pRTH × OVN", dùng chung `plan-core.js`, nguồn trong `artifact/`.
- [x] Gỡ `i18n/__pycache__/` khỏi git (đã thêm vào `.gitignore`).

## Ý tưởng tiếp theo cho Trade Plan
- [ ] Log phiên lên Supabase (bảng `session_logs`) thay vì localStorage, đưa tab Log phiên (đang chỉ có ở artifact) lên trang Trade Plan, để thống kê bias / setup theo thời gian.
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

## Dashboard mới · Deren Desk (design 2026-11-18)
Bản thiết kế (canvas, 7 màn hình): https://claude.ai/artifact/Bpk6CF9e83hZtGRdZeKTnw. Màu graphite trầm + nhấn cát `#D4B483`, Long `#8CC2A4`, Short `#E0947C`; font Inter + JetBrains Mono. Làm trên `development` khi Deren duyệt bản cuối.
- [ ] **Đăng nhập chỉ Discord, một người:** Supabase Auth provider Discord; server so Discord ID với biến `OWNER_DISCORD_ID` (Vercel), khác ID → từ chối + đăng xuất, không tạo tài khoản. Middleware chặn mọi trang dashboard. Trang login có hình nền riêng.
- [ ] **Profile:** avatar, tên, ID lấy từ Discord (`user_metadata` chỉ để hiển thị, không dùng để phân quyền); thiết lập giao dịch (mã, phiên, giới hạn lệnh, 1R); trạng thái kết nối (ATAS, Discord webhook, Supabase, lịch kinh tế); đăng xuất mọi thiết bị.
- [ ] **Dashboard** (trang mặc định): đồng hồ ET / VN, timeline phiên 04:00–16:00 ET có chấm tin, card plan hôm nay, lịch kinh tế (API, cache ~15 phút, không lưu DB), nhắc journal, ô Options sắp có.
- [ ] **Plan Studio** (đổi tên từ Plan Builder / Plan Desk): gửi plan bằng ATAS X hoặc dán JSON (cùng `/api/plan`), hiện 5 bước kết quả.
- [ ] **Plan Studio · lịch sử theo ngày (làm sau):** lịch tháng đánh dấu ngày có plan (chấm màu theo bias), bấm ngày → xem lại plan + ảnh của ngày đó.
  - Server: thêm query danh sách ngày theo tháng, ví dụ `GET /api/plan?month=YYYY-MM` → `trade_date, symbol, summary->bias, image_path, updated_at` (không trả `payload` cho nhẹ).
  - `GET /api/plan?date=YYYY-MM-DD` đã có (trả plan + signed URL ảnh 1 giờ), dùng lại cho phần xem chi tiết.
  - Đổi xác thực các route đọc từ `PLAN_TOKEN` sang session đăng nhập (token chỉ còn cho ATAS gửi POST), để trình duyệt không cần giữ token.
- [ ] **Journal:** migration `trading.journal_days` (1 dòng / ngày: day type, kết quả, open type, bias đúng?, các ô recap chữ: diễn biến phiên, plan so với thực tế, chấm từng lệnh, footprint / DOM / tape, điểm quy trình, tâm lý & kỷ luật, level ngày mai, bài học) + `trading.journal_trades` (giờ, hướng, level, trigger, R, PnL $, theo plan, tag lỗi). Ảnh vào `YYYY/MM/DD/journal/`. Gắn với plan cùng ngày. Thống kê: win rate, R TB, % theo plan, R theo day type, lỗi lặp lại.
- [ ] **PnL Calendar:** lịch tháng Thứ 2–6 + cột tổng tuần, đổi đơn vị $ / R, ô tô màu theo lãi lỗ, bấm ngày mở journal. Số liệu tính từ `journal_trades`.
- [ ] **Knowledge:** 3 phần AMT → Context (TPO / VPO) → Entry (Orderflow tools); Deren tổng hợp nội dung, port dần từ `levels.html` / `tools.html` / quiz.
- [ ] Menu "Sắp có": News · Earnings, Options (GEX / DEX / OI khi có API).

## Quy ước
- Mỗi thay đổi: sửa artifact (nếu liên quan) + push repo, Vercel tự deploy; cập nhật file này và [09-nhat-ky.md](09-nhat-ky.md).
- Ngôn ngữ mặc định VI (`x.html`), EN sinh tự động bằng `python3 i18n/build_en.py`.
- Không commit token, key, URL webhook, CSV dữ liệu Rithmic.

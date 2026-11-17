# 08 · Roadmap

Danh sách việc còn lại. Khi Deren nhắn "liệt kê các việc còn lại", trả lời từ file này.
Hướng dài hạn: **web app cá nhân / dashboard** (xem [07-chuyen-doi-web-app.md](07-chuyen-doi-web-app.md)).

Cập nhật: 2026-11-17.

## Đã xong
- [x] Trade Plan · Composite × pRTH × OVN là system chính (2026-11-17): gộp Plan Builder cổ điển + Testing plan thành trang `plan.html`, Plan Builder vẽ ảnh TPO kèm plan chữ, copy ảnh.
- [x] Plan Builder nhập JSON từ ATAS (dán / clipboard / file) và **"Lấy plan mới nhất từ web"**.
- [x] Supabase: bảng `trading.trade_plans`, bucket private `trade-plans`, RLS bật, chỉ server đọc ghi.
- [x] Vercel: `api/plan.js` (token); biến `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PLAN_TOKEN`, `DISCORD_WEBHOOK_TRADE_PLAN` đã đặt.
- [x] Server tự vẽ ảnh plan tiếng Việt (PNG), lưu Storage, gửi Discord qua webhook. Test đầu-cuối bằng JSON mẫu thành công 2026-11-17.
- [x] `plan-core.js`: một nguồn code cho tính plan + vẽ ảnh, dùng chung web và server.
- [x] Avatar webhook Discord "Trade Plan".
- [x] Bối cảnh dự án ghi vào `CLAUDE.md` + thư mục `claude/`.
- [x] Claude Code: hook, 7 subagent, lệnh `/viec-con-lai` `/kiem-tra` `/ship`, snapshot plan-core, prompt chuyển đổi web app.

## Việc còn lại · plan tự động
1. [ ] **Indicator Plan Sender (tối 2026-11-17):** chart NQ M30 lookback 30 ngày, Claude Code build `docs/plan-sender/PlanSender.cs` theo `PROMPT_PlanSender.md`, kiểm số với 11/11 và 12/11.
2. [ ] **Bật gửi web trong indicator:** API URL `https://orderflow-trading-system.vercel.app/api/plan` + `PLAN_TOKEN`; log phải có `HTTP 200`.
3. [ ] **Test buổi sáng thật:** 9:29 ET bấm gửi → ảnh lên Discord + Storage, nút "Lấy plan mới nhất" trên web khớp.
4. [ ] Xoá ảnh test `2026/11/plan_2026-11-12_NQZ6.png` trong Storage (Dashboard → Storage → `trade-plans`). Dòng dữ liệu đã xoá.

## Việc còn lại · dọn dẹp và an toàn
- [x] Supabase: chuyển sang project Singapore, tách schema `trading` / `util`, `id` uuid (2026-11-18).
- [ ] Supabase: xoá project Sydney (`njbeaswlwqweblvgvrlx`) sau khi API chạy ổn trên Singapore.
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
- [ ] Giai đoạn 0: Deren duyệt stack (đề xuất Next.js + Supabase Auth) và thứ tự module (prompt: `claude/prompts/chuyen-doi-web-app.md`).
- [ ] Giai đoạn 1: khung Next.js trong repo, trang cũ chạy qua `public/legacy/`, `/api/plan` chuyển sang route handler.
- [ ] Giai đoạn 2: đăng nhập chủ site, `profiles` + `user_state`, nhập file sao lưu tiến độ cũ.
- [ ] Giai đoạn 3: shell component + trang dashboard (plan hôm nay, đồng hồ phiên, lịch tin).
- [ ] Giai đoạn 4: port dần Trade Plan, Quiz, hai khoá học.
- [ ] Giai đoạn 5: module mới: economic calendar, options (GEX / DEX / OI, gộp repo Gex-Dashboard), earnings, news, heatmap.
- [ ] Các module khác Deren tự quyết: journal, tài chính cá nhân, học tiếng Anh, tập luyện...

## Quy ước
- Mỗi thay đổi: sửa artifact (nếu liên quan) + push repo, Vercel tự deploy; cập nhật file này và [09-nhat-ky.md](09-nhat-ky.md).
- Ngôn ngữ mặc định VI (`x.html`), EN sinh tự động bằng `python3 i18n/build_en.py`.
- Không commit token, key, URL webhook, CSV dữ liệu Rithmic.

# Roadmap · orderflow-trading-system

Site đang là nơi học (Tools, Levels, Plan, Testing plan, Quiz) và công cụ lập plan mỗi ngày.
Hướng dài hạn: **web cá nhân / dashboard** của Deren (trading, công việc, các tính năng nghĩ thêm sau), không chỉ dừng ở kiến thức và trade plan.

Cập nhật: 17/11/2026.

## Đã xong
- [x] Testing plan · Composite × pRTH × OVN (VI + EN), Plan Builder vẽ ảnh TPO kèm plan chữ, copy ảnh.
- [x] Plan Builder nhập JSON từ ATAS (dán / clipboard / file) và **"Lấy plan mới nhất từ web"**.
- [x] Supabase: bảng `trade_plans`, bucket private `trade-plans`, RLS bật, chỉ server đọc ghi.
- [x] Vercel: `api/plan.js` (token), biến `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PLAN_TOKEN` đã đặt và test ghi / đọc thành công.
- [x] Server tự vẽ ảnh plan tiếng Việt (PNG), lưu Storage, gửi Discord qua webhook.
- [x] `plan-core.js`: một nguồn code duy nhất cho tính plan + vẽ ảnh, dùng chung web và server.

## Việc còn lại · plan tự động
1. [ ] **Indicator Plan Sender (tối 17/11):** chart NQ M30 lookback 35 ngày, Claude Code build `docs/plan-sender/PlanSender.cs` theo `PROMPT_PlanSender.md`, kiểm số với 11/11 và 12/11.
2. [ ] **Bật gửi web trong indicator:** API URL `https://orderflow-trading-system.vercel.app/api/plan` + `PLAN_TOKEN`, log phải có `HTTP 200`.
3. [ ] **Discord:** tạo webhook kênh `#trade-plan`, đặt `DISCORD_WEBHOOK_TRADE_PLAN` trên Vercel, Redeploy, test bằng JSON mẫu.
4. [ ] **Test đầu-cuối buổi sáng thật:** 9:29 ET bấm gửi → ảnh lên Discord + Storage, web "Lấy plan mới nhất" khớp.
5. [ ] Xoá dòng test (nếu có) trong `trade_plans` sau khi chạy thật ổn.

## Việc còn lại · dọn dẹp và an toàn
- [ ] Supabase: thu quyền `EXECUTE` của `anon` / `authenticated` trên hàm `public.rls_auto_enable()` (advisor cảnh báo).
- [ ] Supabase: cân nhắc thu quyền `anon` / `authenticated` trên `trade_plans` (RLS đã chặn, đây là lớp phòng thêm).
- [ ] Khi có nhiều API: đổi `PLAN_TOKEN` thành token chung (ví dụ `API_TOKEN`) hoặc đăng nhập Supabase Auth cho chủ site.
- [ ] Artifact "Composite × pRTH × OVN Playbook": đồng bộ dùng `plan-core.js` (hiện vẫn là bản tự chứa).

## Ý tưởng tiếp theo cho Testing plan
- [ ] Log phiên lên Supabase (bảng `session_logs`) thay vì localStorage, để thống kê setup F / C / V theo thời gian.
- [ ] Recap sau phiên: kết quả thực tế so với plan (bias đúng / sai, tới HVN kế tiếp hay không).
- [ ] Backtest khung Composite × pRTH × OVN khi có data 30 phút 6–12 tháng (indicator xuất thêm nến M30).
- [ ] Discord bot (khác webhook): lệnh `/plan` xem lại plan, `/log` ghi kết quả phiên ngay trong Discord.

## Hướng web cá nhân / dashboard
- [ ] Trang chủ thành dashboard: plan hôm nay, ảnh plan, lịch tin tức, tình trạng prop account.
- [ ] Đăng nhập cho chủ site (Supabase Auth) để mở các trang riêng tư.
- [ ] Các module thêm sau (Deren tự quyết): journal, tài chính cá nhân, học tiếng Anh, theo dõi tập luyện...

## Quy ước
- Mỗi thay đổi: sửa artifact (nếu liên quan) + push repo, Vercel tự deploy.
- Ngôn ngữ mặc định VI (`x.html`), EN sinh tự động bằng `python3 i18n/build_en.py`.
- Không commit token, key, URL webhook, CSV dữ liệu Rithmic.

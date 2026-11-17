# 06 · Quyết định kỹ thuật

Mỗi mục: đã chọn gì, vì sao, và khi nào nên xem lại. Muốn đổi một mục thì ghi quyết định mới bên dưới, đừng xoá mục cũ.

| # | Ngày | Quyết định | Lý do | Xem lại khi |
|---|---|---|---|---|
| D1 | 2026-11 | Site tĩnh, vanilla JS, không build | Học trên nhiều thiết bị, deploy đơn giản, port nhanh từ artifact | Chuyển web app (đang lên kế hoạch) |
| D2 | 2026-11 | Bản EN sinh tự động từ VI bằng Python | Chỉ sửa một nguồn nội dung; VI là ngôn ngữ chính | Khi có framework i18n thật (next-intl hoặc tương tự) |
| D3 | 2026-11 | `plan-core.js` dạng UMD, hàm thuần, không DOM | Một nguồn logic cho trang web, server và (sau này) artifact; ảnh trên web và trên Discord giống hệt | Port sang TypeScript (`lib/plan-core.ts`) |
| D4 | 2026-11-17 | Server vẽ ảnh bằng `@resvg/resvg-js`, font gói kèm | Không cần trình duyệt headless; nhẹ, chạy trên Vercel Function; font tiếng Việt cố định | Nếu cần vẽ phức tạp hơn SVG |
| D5 | 2026-11-17 | Font Be Vietnam Pro ghép thêm glyph DejaVu (→ ↑ ↓ σ ≈ ≤ ≥ Σ Δ ▲ ▼) vào chính file font | resvg dùng font dự phòng cho cả đoạn chữ nếu thiếu glyph, làm hỏng kiểu chữ | Đổi font |
| D6 | 2026-11 | Supabase gọi bằng `fetch` + PostgREST, không dùng `supabase-js` | Một function nhỏ, không cần SDK | Khi có Auth / nhiều bảng: dùng `@supabase/ssr` |
| D7 | 2026-11 | RLS bật, không policy, chỉ secret key phía server | Chưa có đăng nhập; mọi truy cập đi qua API có token | Khi thêm Supabase Auth: viết policy theo `auth.uid()` |
| D8 | 2026-11-17 | Một secret key chung tên `vercel_server` | Sau này còn nhiều loại dữ liệu từ Vercel về Supabase, không tạo key theo tính năng | Khi tách nhiều service |
| D9 | 2026-11-17 | Tên bảng `trade_plans` (snake_case, không tiền tố `tb_`) | Quy ước Postgres / Supabase | — |
| D10 | 2026-11-17 | Ảnh lưu Supabase Storage bucket private `trade-plans/YYYY/MM/` | Cùng chỗ với dữ liệu, chỉ server đọc, gói free 1 GB đủ nhiều năm (~340 KB / ảnh); Discord giữ thêm bản | Nếu cần CDN công khai |
| D11 | 2026-11-17 | Discord dùng webhook, không dùng bot | Chỉ cần đẩy tin một chiều; không cần host bot chạy liên tục | Khi cần lệnh `/plan`, `/log` |
| D12 | 2026-11-17 | Tên biến webhook `DISCORD_WEBHOOK_<MỤC_ĐÍCH>` | Sẽ có nhiều webhook | — |
| D13 | 2026-11 | Token Bearer `PLAN_TOKEN` cho API | Đủ cho một người dùng + ATAS | Khi có đăng nhập: session cho web, token riêng cho ATAS |
| D14 | 2026-11 | Indicator dùng nến M30 (chart 30m, lookback 30 ngày) | Một chart xem được pRTH, OVN, composite; period TPO đúng 30' | — |
| D15 | 2026-11 | TPO 30' chỉ dùng đổi bias; vào lệnh trên M1 | Góp ý của anh An | — |
| D16 | 2026-11 | Ảnh plan: profile TPO (không phải nến), pRTH và OVN sát nhau, khối chữ bên phải, nút copy ảnh thay cho tải về | Đọc nhanh trước phiên, dán thẳng vào chat | — |
| D17 | 2026-11 | Một phiên Claude giữ artifact và repo đồng bộ, push `main` để Vercel tự deploy | Tránh trôi tin nhắn giữa nhiều phiên | Khi chuyển sang web app |
| D18 | 2026-11-17 | Bối cảnh dự án ghi trong `CLAUDE.md` + `claude/` | Chuẩn bị chuyển sang web app dài hạn | — |
| D19 | 2026-11-17 | Hook Claude Code viết bằng Node (`.mjs`), không dùng bash + jq | Chạy được cả Windows (máy trade) lẫn Linux; Node đã có sẵn cho dự án | — |
| D20 | 2026-11-17 | Snapshot `scripts/plan-core.snapshot.json` là chuẩn nghiệm thu engine plan | Port sang TypeScript / web app phải ra đúng kết quả cũ | Khi đổi luật cố ý (`--update` + ghi nhật ký) |
| D21 | 2026-11-17 | Gộp Plan Builder cổ điển + Testing plan thành một trang **Trade Plan** (`plan.html`), bỏ builder cổ điển; `/testing`, `/overlap` redirect về `/plan` | Deren chốt Composite × pRTH × OVN là system trade plan chính | — |
| D22 | 2026-11-17 | Artifact dùng chung `plan-core.js` (ghép lúc build), nguồn artifact lưu trong repo `artifact/` | Một engine cho web, server, artifact; artifact sửa được ở phiên sau | — |
| D23 | 2026-11-17 | Giữ tên khoá localStorage `ofs.tp.*` dù đổi tên trang | Không mất dữ liệu đã lưu trên trình duyệt | Khi chuyển dữ liệu lên DB |
| D24 | 2026-11-17 | Tạo lại `trade_plans`: bỏ cột `price` (trùng `payload.price`, `summary.price`), sắp cột theo nhóm (khoá + thời gian → định danh → kết quả server → dữ liệu gốc), comment từng cột, thu quyền `anon` / `authenticated` | Bảng dễ đọc, không lưu trùng; chỉ server truy cập | Khi thêm Auth (cần thêm `user_id` + policy) |

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
| D25 | 2026-11-18 | Supabase region Singapore + Vercel function `sin1`; mỗi nghiệp vụ một schema (`trading`, `util`...), không dùng `public`; khoá chính `uuid` | Gần Việt Nam; web app sau này nhiều nghiệp vụ, tách schema dễ phân quyền và quản lý | Khi cần chia sẻ dữ liệu giữa schema hoặc expose cho client |
| D26 | 2026-11-18 | **Stack web app (Deren chốt):** Node.js 26 LTS, Next.js App Router + React + TypeScript, pnpm workspaces (monorepo `apps/web`, `packages/*`, `supabase/`), CSS Modules giữ biến CSS hiện có, shadcn/ui khi cần, Supabase (`@supabase/ssr` + `supabase-js`, kiểu sinh tự động, không ORM), Supabase CLI + GitHub Actions cho migration, Zod, TanStack Query, date-fns + date-fns-tz, lightweight-charts + ECharts/Recharts (giữ SVG tự vẽ cho TPO/footprint), next-intl, resvg, Vercel Cron / pg_cron, Vitest + Playwright, Biome; worker Node + Hono (Railway/Fly) chỉ khi cần chạy liên tục | Một app Next.js chứa cả UI lẫn API, ít thứ phải vận hành; Deren quen React/Next | Khi cần worker chạy liên tục hoặc nhiều client |
| D27 | 2026-11-18 | Tổ chức code theo tính năng (`features/<x>/{queries,actions,service,schema,components}`), giữ tinh thần tách lớp MVC; không dựng `models/controllers/views` | Dashboard nhiều module; thêm module = thêm một thư mục | — |
| D28 | 2026-11-18 | Một repo, chia thư mục theo nơi chạy (`apps/web` → Vercel, `supabase/` → Supabase), không tách repo FE/BE | Một lần deploy, không CORS, kiểu dữ liệu dùng chung | Khi thêm `apps/worker` |
| D29 | 2026-11-18 | Cột thời gian dùng `timestamp` (không tz), luôn là giờ UTC; client coi chuỗi không có `Z` là UTC; đổi sang ET ở tầng code | Deren chọn | Khi gặp lỗi lệch giờ / DST |
| D30 | 2026-11-18 | Schema chỉ đổi qua file `supabase/migrations/`, không sửa tay trên dashboard | Repo và database luôn khớp; sửa tay từng làm mất default cột | — |
| D31 | 2026-11-18 | Nhánh `production` (Vercel production) và `development` (nhánh mặc định, Vercel preview) thay cho `main`; production chỉ nhận merge qua PR | Deren muốn tên nhánh nói rõ môi trường | Khi cần thêm staging |
| D32 | 2026-11-18 | Trang cũ đặt trong `apps/web/public/` (không phải `public/legacy/`), URL sạch bằng rewrites; plan-core JS nạp vào route handler qua `lib/plan-core.ts` | Giữ nguyên URL, đường dẫn tương đối `assets/...`, engine một nguồn | Khi port plan-core sang `packages/plan-core` |
| D33 | 2026-11-18 | Cột thời gian quay lại `timestamptz` (thay D29) | Supabase / Postgres khuyến nghị; tránh lệch giờ khi client đọc | — |
| D34 | 2026-11-18 | Storage: một bucket private `trading`, đường dẫn `YYYY/MM/DD/<plan|journal>/<file>` (thay bucket `trade-plans`, cập nhật D10); recap gộp vào journal | Mở một ngày thấy đủ plan + journal; bucket khớp schema; dễ viết policy theo folder khi có Auth | Khi có nhiều người dùng (thêm `<user_id>/` đầu đường dẫn) |
| D35 | 2026-11-18 | `/api/plan`: database lỗi vẫn vẽ ảnh, lưu Storage, gửi Discord rồi mới trả 502 | Plan 9:29 quan trọng hơn bản ghi database; Discord luôn nhận plan | — |
| D36 | 2026-11-18 | Ảnh lưu Storage dạng WebP qua sharp: plan lossless, journal q85 tối đa 2560 px | Gói Free 1 GB storage; plan giảm ~70% không mất chất lượng, ảnh chụp giảm ~80% | Khi cần ảnh gốc cho phân tích (lưu thêm bản gốc) |

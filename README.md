# Orderflow Trading System

Website học tập gộp hai playbook **Orderflow Tools** và **TPO Level** cho NQ intraday (ATAS · Rithmic), tối ưu cho cả desktop lẫn điện thoại.

## Nội dung

| Trang | Mô tả |
|---|---|
| `index.html` | Tổng quan: tiếp tục học, hệ thống 4 lớp, tiến độ 2 khoá, thống kê trắc nghiệm, sao lưu tiến độ |
| `tools.html` | Khoá 2 · Orderflow Tools: DOM, Tape, Footprint, Delta & CVD, 13 kịch bản, kết hợp tại level, thuật ngữ |
| `levels.html` | Khoá 1 · TPO Level: TPO, day/open types, IB, level map, VWAP RTH, EMA 9/34, CVD, quy trình lên plan |
| `plan.html` | **Trade Plan** (system chính từ 17/11/2026) · Composite × pRTH × OVN: khung plan, xác định HVN, đọc bias, VWAP RTH, Plan Builder (nhập JSON từ indicator ATAS hoặc lấy plan đã gửi từ web, ảnh plan TPO kèm plan chữ, copy ảnh), quy trình trade, quiz 10 câu riêng (không tính vào thi thử) |
| `quiz.html` | Trung tâm trắc nghiệm: luyện tập, thi thử, ôn câu sai |

**Ngân hàng câu hỏi: 188 câu, giữ nguyên văn** — 87 câu Orderflow Tools (`apps/web/public/assets/js/bank-tools.js`, id `T001…T087`) và 101 câu TPO Level (chương EMA: `apps/web/public/assets/js/bank-ema.js`, id `L094…L108`; `apps/web/public/assets/js/bank-levels.js`, id `L001…L093`, bỏ 7 câu case study).

- Mỗi chương có bài kiểm tra nhanh theo đúng module.
- Thi thử: đề Tools 50 câu, đề Level 50 câu, đề tổng 100 câu (50 + 50), rút ngẫu nhiên giữ tỉ lệ theo chương. Qua bài khi đạt ≥ 80% ba lần liên tiếp.
- Câu sai được gom lại để ôn; trả lời đúng thì tự rời danh sách.

Tiến độ lưu `localStorage` theo từng trình duyệt. Dùng mục **Sao lưu & khôi phục** ở trang Tổng quan để chuyển tiến độ giữa các thiết bị.

## Song ngữ VI / EN

Nút **VI | EN** trên thanh trên cùng. Bản tiếng Việt là `x.html`, bản tiếng Anh là `x.en.html` (JS ở `apps/web/public/assets/js/en/`). Lựa chọn ngôn ngữ được nhớ; tiến độ dùng chung cho cả hai bản.

Bản EN được sinh tự động từ bản VI: sửa nội dung tiếng Việt rồi chạy `python3 i18n/build_en.py`. Script báo các câu tiếng Việt mới chưa có bản dịch — thêm chúng vào `i18n/en_extra.tsv` (`câu VI<TAB>câu EN`) rồi chạy lại.

## Cấu trúc

```
apps/web/public/assets/css/app.css        design system + shell + quiz engine
apps/web/public/assets/css/tools.css      style component khoá Tools (scope .pg-tools)
apps/web/public/assets/css/levels.css     style component khoá Level (scope .pg-levels)
apps/web/public/assets/js/core.js         sidebar, topbar, bottom nav, router chương, đồng hồ phiên realtime, nút VI/EN
apps/web/public/assets/js/quiz.js         quiz engine (luyện tập / thi thử / ôn câu sai)
apps/web/public/assets/js/fp.js           renderer footprint kiểu cluster ATAS, DOM/Tape helpers, 13 kịch bản
apps/web/public/assets/js/tools-page.js   hình minh hoạ khoá Tools
apps/web/public/assets/js/levels-data.js  dữ liệu khoá Level
apps/web/public/assets/js/levels-page.js  widget khoá Level (TPO profile, Plan Builder, …)
apps/web/public/assets/js/home.js         trang tổng quan
```

## Chạy & deploy

Monorepo pnpm: app Next.js ở `apps/web` (trang học tĩnh trong `apps/web/public/` + API), migration Supabase ở `supabase/`.

- Local: `pnpm install` rồi `pnpm dev`, mở `http://localhost:3000`.
- Vercel: Root Directory **apps/web**, framework Next.js. Nhánh `production` deploy production, `development` (nhánh mặc định) deploy preview.

Không phải lời khuyên đầu tư. Các con số thống kê truyền thống cần tự kiểm chứng bằng backtest.

## Plan Sender (ATAS → web)

Indicator `Deren · Plan Sender` gửi số liệu pRTH / OVN / VA từng phiên lúc 9:29 ET để Plan Builder lập plan.
Hướng dẫn đầy đủ, mã indicator, prompt Claude Code và SQL: `docs/plan-sender/README.md`.
`apps/web/app/api/plan/route.ts` là Vercel Function lưu / đọc plan trên Supabase (cần biến môi trường `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PLAN_TOKEN`).
Thư mục `docs/` không được deploy lên site.

## Bối cảnh cho Claude / người mới
`CLAUDE.md` (quy tắc bắt buộc) và thư mục `claude/` (tổng quan, kiến trúc, tính năng, dữ liệu & API, nghiệp vụ, quyết định, kế hoạch chuyển sang web app, roadmap, nhật ký). Hai mục này không được deploy.

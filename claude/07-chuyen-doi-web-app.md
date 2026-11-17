# 07 · Kế hoạch chuyển sang web app / personal dashboard

Trạng thái: **đề xuất, chưa bắt đầu**. Deren chốt hướng 2026-11-17; stack và thứ tự bên dưới cần Deren duyệt trước khi làm.

## Mục tiêu
- Có đăng nhập; trang riêng tư chỉ chủ site xem được.
- Dữ liệu theo người dùng nằm trên database thay vì `localStorage`.
- Thêm module mới mà không phải sửa shell: trade plan, economic calendar, options (GEX / DEX / OI...), heatmap cổ phiếu, news, earnings, và các module Deren nghĩ thêm.
- Giữ nguyên mọi tính năng hiện có ([03-tinh-nang.md](03-tinh-nang.md)) và các URL đang dùng.

## Stack đề xuất
| Lớp | Đề xuất | Vì sao |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Deren đã dùng React / Next.js; chạy tốt nhất trên Vercel; có server components, route handlers, middleware |
| UI | Giữ design system trong `app.css` (biến CSS, giao diện tối), chuyển dần thành component | Không phải vẽ lại giao diện; Tailwind là tuỳ chọn, không bắt buộc |
| Auth | Supabase Auth qua `@supabase/ssr` (cookie session) | Đã có Supabase; chỉ cần một tài khoản chủ site |
| Database | Supabase Postgres, RLS theo `auth.uid()` | Đã có; bảng `trade_plans` giữ nguyên, thêm `user_id` |
| File | Supabase Storage (giữ bucket `trade-plans`) | Đã chạy |
| Job định kỳ | Vercel Cron hoặc Supabase `pg_cron` + Edge Function | Kéo dữ liệu calendar / options / news theo lịch. Kiểm tra giới hạn gói Hobby trước khi chọn |
| i18n | `next-intl` (hoặc tương tự), VI mặc định | Thay script `build_en.py`; dữ liệu dịch lấy từ `i18n/en.tsv` + `en_extra.tsv` |
| Chart | SVG tự vẽ cho TPO / footprint (giữ code hiện có); thư viện chart cho module mới khi cần | Code vẽ hiện tại không phụ thuộc thư viện |

Phương án nhẹ hơn nếu không muốn React: giữ HTML tĩnh, thêm Supabase Auth bằng `supabase-js` phía trình duyệt và thêm Functions. Nhanh hơn ở bước đầu nhưng khó mở rộng thành dashboard nhiều module. Đề xuất chọn Next.js.

## Cấu trúc thư mục đích (gợi ý)
```
app/
  (public)/            trang học công khai: levels, tools, quiz (nếu muốn công khai)
  (app)/               cần đăng nhập
    dashboard/         trang chủ dashboard
    plan/              Trade Plan (Composite × pRTH × OVN) + lịch sử plan
    calendar/          economic calendar
    options/           GEX / DEX / OI
    heatmap/           heatmap cổ phiếu
    news/, earnings/
  api/
    plan/route.ts      thay api/plan.js (giữ đúng hợp đồng)
    cron/*/route.ts    job kéo dữ liệu
lib/
  plan-core.ts         port từ assets/js/plan-core.js (giữ test số liệu 11/11, 12/11)
  supabase/{server,client}.ts
  render/png.ts        resvg + font (từ api/_fonts)
components/
  shell/               sidebar, topbar, bottom nav, đồng hồ phiên (từ core.js)
  tpo/, footprint/, quiz/
content/
  levels/, tools/      nội dung bài học (MDX hoặc JSON) tách khỏi code
  quiz/                ngân hàng câu hỏi (từ bank-*.js)
public/legacy/         trang HTML cũ trong lúc chuyển dần
```

## Mô hình dữ liệu thêm (gợi ý)
| Bảng | Dùng cho | Ghi chú |
|---|---|---|
| `profiles` | chủ site, tuỳ chọn ngôn ngữ, múi giờ | 1-1 với `auth.users` |
| `user_state` | thay `localStorage` (`key`, `value jsonb`) | migrate thẳng các khoá ở [03](03-tinh-nang.md#bảng-khoá-localstorage); file sao lưu JSON hiện có là đường nhập |
| `quiz_attempts`, `quiz_answers` | lịch sử thi, câu sai | thay `ofs.quiz.v1` |
| `trade_plans` | giữ nguyên + cột `user_id` | API ATAS vẫn ghi được bằng token riêng |
| `session_logs` | kết quả phiên so với plan | đã có trong roadmap |
| `ib_journal` | IB Journal | thay `ibj-rows` |
| `econ_events`, `earnings_events`, `news_items` | cache dữ liệu kéo về theo lịch | không gọi API ngoài trực tiếp từ trình duyệt |
| `options_snapshots` | GEX / DEX / OI theo thời điểm | xem repo `HiamDeren/Gex-Dashboard` |

Mọi bảng: RLS bật, policy `to authenticated using ((select auth.uid()) = user_id)`, UPDATE có cả `with check`. Bảng cache dùng chung chỉ cho đọc.

## Nguồn dữ liệu cho module mới (cần khảo sát trước khi chọn)
- **Options (GEX / DEX / OI / Vanna / Charm):** đã có repo `Gex-Dashboard` và skill `skill-quant-dashboard` (Quant Data API). Gộp hoặc nhúng vào module `options`.
- **Economic calendar, news, earnings:** chọn nhà cung cấp sau khi so giá, giới hạn gọi và điều khoản hiển thị.
- **Heatmap:** hai hướng: nhúng widget có sẵn (ví dụ widget heatmap của TradingView, cần kiểm tra điều khoản) hoặc tự vẽ treemap từ dữ liệu giá.
- **Dữ liệu ATAS / Rithmic / CME:** chỉ dùng cá nhân, chỉ hiện ở trang cần đăng nhập.

## Các giai đoạn
Prompt dùng cho từng giai đoạn: [prompts/chuyen-doi-web-app.md](prompts/chuyen-doi-web-app.md). Subagent dẫn dắt: `migration-architect`.

0. **Chuẩn bị (xong 2026-11-17):** ghi bối cảnh vào `CLAUDE.md` + `claude/`; luồng plan tự động chạy ổn.
1. **Khung Next.js trong cùng repo:** tạo app, chuyển HTML hiện tại vào `public/legacy/`, thêm rewrites để `/levels`, `/tools`, `/plan`, `/quiz`, `.en` vẫn chạy và `/testing`, `/overlap` vẫn chuyển về `/plan`. Chuyển `api/plan.js` sang `app/api/plan/route.ts` giữ đúng request / response. Deploy, kiểm tra không có gì gãy.
2. **Đăng nhập + dữ liệu người dùng:** Supabase Auth, middleware bảo vệ `(app)/`, bảng `profiles` + `user_state`, trang nhập file sao lưu cũ để chuyển tiến độ lên DB.
3. **Shell + dashboard:** component hoá sidebar / topbar / đồng hồ phiên; trang dashboard: plan hôm nay + ảnh, đồng hồ phiên, lịch tin trong ngày.
4. **Port dần từng trang cũ:** Trade Plan (dùng `lib/plan-core.ts`), Quiz, rồi hai khoá học (nội dung sang `content/`). Xong trang nào thì bỏ bản legacy của trang đó.
5. **Module mới:** calendar → options (gộp Gex-Dashboard) → earnings → news → heatmap (thứ tự Deren quyết).

Mỗi giai đoạn deploy được độc lập; không có bước "viết lại toàn bộ rồi mới chạy".

## Phải giữ khi chuyển
- Hợp đồng `/api/plan` và JSON v1 (indicator ATAS đã code theo đó).
- Kết quả `plan-core`: `node scripts/check-plan-core.mjs` phải pass (snapshot từ `assets/sample_plan_20261112.json`); số indicator khớp bảng 11/11, 12/11 ở [04](04-du-lieu-api.md).
- URL và hash chương đang dùng (bookmark, `ofs.last`).
- Ngân hàng 188 câu giữ nguyên văn và id `T001…`, `L001…`.
- Giao diện tối, chữ đọc được trên nền tối, tiếng Việt mặc định.
- Font và cách vẽ ảnh plan phía server.

## Rủi ro
- Gói Vercel Hobby: giới hạn thời gian chạy function, cron, dùng cá nhân. Kiểm tra trước khi thêm job định kỳ.
- Kích thước bundle khi port các widget lớn (`levels-page.js`, `fp.js`): tách theo trang, lazy load.
- Chi phí và điều khoản API dữ liệu thị trường.
- Đổi sang session đăng nhập không được làm gãy luồng ATAS → API (giữ token riêng cho máy trade).

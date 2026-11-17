# Prompt chuyển đổi sang web app / personal dashboard

Dùng với **Claude Code mở tại thư mục repo** `orderflow-trading-system` (hook và subagent trong `.claude/` tự nạp).
Mỗi lần bắt đầu một phiên: dán **Prompt khởi động** + prompt của giai đoạn đang làm. Làm xong một giai đoạn mới sang giai đoạn sau.

Kế hoạch gốc: [`../07-chuyen-doi-web-app.md`](../07-chuyen-doi-web-app.md). Tình trạng từng giai đoạn: [`../08-roadmap.md`](../08-roadmap.md).

---

## Prompt khởi động (dán đầu mọi phiên chuyển đổi)

```
Mình đang chuyển repo orderflow-trading-system từ site tĩnh (HTML + vanilla JS + 1 Vercel Function) sang web app cá nhân / dashboard.

Trước khi làm gì:
1. Đọc CLAUDE.md, rồi claude/README.md và lần lượt claude/01 → 09. Đọc claude/prompts/chuyen-doi-web-app.md.
2. Đối chiếu tài liệu với code thật (cấu trúc thư mục, api/plan.js, assets/js/plan-core.js, vercel.json). Có chỗ tài liệu sai thì liệt kê ra.
3. Cho mình biết: giai đoạn nào đã xong, giai đoạn tiếp theo là gì, và các quyết định mình cần chốt.

Quy tắc trong suốt quá trình:
- Trả lời tiếng Việt, giữ thuật ngữ tiếng Anh.
- Chuyển dần, mỗi giai đoạn deploy được độc lập, site cũ vẫn chạy.
- Làm trên nhánh riêng `webapp/<giai-doan>`, mở PR, không push thẳng main cho tới khi mình duyệt.
- Không đổi hợp đồng /api/plan và JSON v1 từ ATAS. Snapshot `node scripts/check-plan-core.mjs` phải luôn pass.
- Bí mật chỉ ở biến môi trường. RLS bật cho mọi bảng. Không dùng khái niệm ICT.
- Tra tài liệu hiện hành của Next.js / Supabase / Vercel trước khi dùng API, không dựa vào trí nhớ.
- Dùng subagent migration-architect để lập kế hoạch, backend-supabase cho DB/API, plan-engine cho plan-core, content-reviewer trước khi merge, docs-keeper cập nhật claude/ cuối mỗi giai đoạn.
- Quyết định khó đảo ngược (đổi stack, schema, xoá trang cũ, đổi URL): trình bày phương án và chờ mình duyệt.
```

---

## Giai đoạn 0 · Chốt phương án (chưa code)

```
Giai đoạn 0. Chưa viết code.
Dùng subagent migration-architect:
1. Đánh giá lại stack đề xuất trong claude/07 (Next.js App Router + TypeScript + Supabase Auth qua @supabase/ssr, giữ Supabase + Vercel) với phiên bản hiện hành, nêu ưu nhược và phương án thay thế.
2. Hỏi mình các quyết định: trang học (levels, tools, quiz) công khai hay cần đăng nhập; đăng nhập bằng email magic link hay GitHub; dùng Tailwind hay giữ CSS hiện tại; thứ tự module mới (calendar, options, earnings, news, heatmap).
3. Kiểm giới hạn gói Vercel Hobby (thời gian function, cron) và Supabase free có ảnh hưởng gì.
4. Ghi kết quả đã chốt vào claude/06-quyet-dinh.md (dòng D mới) và cập nhật claude/07.
```

## Giai đoạn 1 · Khung Next.js, trang cũ vẫn chạy

```
Giai đoạn 1: dựng khung Next.js trong cùng repo, nhánh webapp/g1.
Yêu cầu:
- Tạo app Next.js (App Router, TypeScript) ở gốc repo. Chuyển các trang HTML cũ + assets vào public/legacy/ (hoặc cách tương đương) và thêm rewrites để mọi URL cũ vẫn chạy y như hiện tại: /, /levels, /tools, /plan, /quiz, các bản .en, /testing và /overlap → /plan, hash chương (#ema, #builder...).
- Chuyển api/plan.js sang app/api/plan/route.ts, giữ nguyên request/response, xác thực PLAN_TOKEN, render PNG bằng @resvg/resvg-js với font api/_fonts (đảm bảo font được đóng gói vào function).
- Port assets/js/plan-core.js sang lib/plan-core.ts nhưng trang legacy vẫn dùng bản JS cũ; viết test chạy cả hai trên assets/sample_plan_20261112.json, kết quả phải khớp scripts/plan-core.snapshot.json.
- Cập nhật hook trong .claude/ nếu đường dẫn đổi (guard bản EN, check plan-core).
- Kiểm tra: build pass, mở từng URL cũ trên Preview Deployment, POST/GET /api/plan bằng JSON mẫu (rồi xoá dòng + ảnh test).
- Cuối giai đoạn: docs-keeper cập nhật claude/02, 04, 07, 08, 09. Mở PR, chưa merge.
```

## Giai đoạn 2 · Đăng nhập và dữ liệu người dùng

```
Giai đoạn 2: đăng nhập chủ site và đưa dữ liệu localStorage lên database, nhánh webapp/g2.
Yêu cầu:
- Supabase Auth qua @supabase/ssr (cookie session), middleware bảo vệ nhóm route (app)/. Chỉ email của mình được đăng nhập (allowlist), không cho đăng ký tự do.
- Bảng profiles, user_state (key text, value jsonb) và các bảng cần thiết theo claude/07; RLS `to authenticated using ((select auth.uid()) = user_id)`, UPDATE có with check. Thêm cột user_id cho trade_plans, giữ API ATAS ghi được bằng token riêng.
- Trang "Nhập tiến độ cũ": nhận file sao lưu JSON hiện có ({app:"orderflow-system", v:1, data}) và ghi vào user_state; danh sách khoá ở claude/03.
- Không làm gãy luồng ATAS → /api/plan → Supabase → Discord.
- Chạy Supabase advisors (security + performance), sửa cảnh báo, kể cả rls_auto_enable().
- Kiểm tra, cập nhật claude/ (04, 06, 07, 08, 09), mở PR.
```

## Giai đoạn 3 · Shell và trang dashboard

```
Giai đoạn 3: shell component và trang dashboard, nhánh webapp/g3.
Yêu cầu:
- Component hoá shell từ assets/js/core.js: sidebar, topbar, bottom nav mobile, mục lục chương, đồng hồ phiên (giờ VN, đếm tới RTH 9:30 ET, cửa sổ 9:30–11:30 ET, tự đổi giờ mùa hè/đông của Mỹ), nút VI/EN. Giữ design system trong assets/css/app.css (giao diện tối).
- Cấu hình điều hướng theo module để thêm module mới chỉ cần khai báo một chỗ.
- Trang /dashboard: plan hôm nay (ảnh + plan chữ từ trade_plans), đồng hồ phiên, ô trống cho lịch tin / options sẽ làm sau.
- i18n: VI mặc định, EN dùng dữ liệu dịch từ i18n/en.tsv + i18n/en_extra.tsv.
- Kiểm tra mobile và desktop, cập nhật claude/, mở PR.
```

## Giai đoạn 4 · Port từng trang cũ

```
Giai đoạn 4: port trang <tên trang: plan | quiz | levels | tools> sang React, nhánh webapp/g4-<trang>.
Yêu cầu:
- Dùng danh mục trong claude/03-tinh-nang.md làm checklist: mọi widget, chương, tương tác, khoá dữ liệu của trang này phải có ở bản mới (hoặc mình đồng ý bỏ).
- Nội dung bài học / câu hỏi tách sang content/ (MDX hoặc JSON); ngân hàng câu hỏi giữ nguyên văn và id T001…, L001….
- Trade Plan dùng lib/plan-core.ts (artifact/ cũng build từ engine này); snapshot phải pass. Vẽ TPO, footprint giữ code SVG hiện có.
- Dữ liệu người dùng đọc / ghi user_state thay cho localStorage.
- Giữ URL và hash chương. Xong thì gỡ bản legacy của riêng trang này.
- Gọi content-reviewer, cập nhật claude/, mở PR.
```

## Giai đoạn 5 · Thêm module mới (dùng lại cho mọi module)

```
Giai đoạn 5: thêm module <calendar | options | earnings | news | heatmap | tên khác>, nhánh webapp/m-<module>.
Trước khi code:
1. Đề xuất 2–3 nguồn dữ liệu (giá, giới hạn gọi, điều khoản hiển thị, độ trễ) và cách lưu cache (bảng Supabase + job định kỳ Vercel Cron hoặc pg_cron). Chờ mình chọn.
2. Phác thảo màn hình (dùng giao diện tối hiện có) và bảng dữ liệu.
Khi làm:
- Gọi API ngoài chỉ từ server / job, không từ trình duyệt; key API ở biến môi trường.
- Bảng cache dùng chung: RLS bật, chỉ cho đọc khi đã đăng nhập.
- Module options: xem repo HiamDeren/Gex-Dashboard và skill skill-quant-dashboard để tái dùng.
- Dữ liệu Rithmic / CME chỉ hiện ở trang cần đăng nhập.
- Khai báo module vào điều hướng, thêm thẻ vào dashboard nếu hợp.
- Kiểm tra, cập nhật claude/ (03, 04, 06, 08, 09), mở PR.
```

## Nghiệm thu cuối mỗi giai đoạn

```
Nghiệm thu giai đoạn <n>. Không code thêm, chỉ kiểm:
1. Build và deploy Preview thành công.
2. node scripts/check-plan-core.mjs pass; test lib/plan-core.ts (nếu đã có) khớp snapshot.
3. POST + GET /api/plan với assets/sample_plan_20261112.json: image.path có, discord.sent true (hoặc notify:false), rồi xoá dòng và ảnh test.
4. Mở lần lượt mọi URL cũ (cả bản .en) và hash chương; liệt kê cái nào hỏng.
5. Đối chiếu bảng "Phải giữ khi chuyển" trong claude/07.
6. Supabase advisors không còn cảnh báo security mới.
7. claude/ đã cập nhật đúng.
Báo cáo: đạt / chưa đạt từng mục, việc còn phải sửa.
```

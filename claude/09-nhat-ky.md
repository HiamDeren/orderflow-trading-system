# 09 · Nhật ký thay đổi

Ghi theo ngày, mới nhất ở trên. Chi tiết từng commit: `git log`.

## 2026-11-21 · Chẩn đoán Plan Sender (log máy ATAS + Supabase + Vercel)
- 17/11 21:31–21:40 VN: log không có dòng `web:` → "Gửi lên web" chưa bật / URL mẫu, indicator bỏ qua im lặng. 21:41 và 21:43 đã `HTTP 200` nhưng vào project Supabase cũ (Sydney); project Singapore tạo lúc 22:45 VN nên "không thấy POST". Dòng 17/11 hiện có là bản gửi lại qua Plan Builder 18/11.
- 19/11 9:29 ET: đầu-cuối chạy (`HTTP 200`, dòng DB, ảnh `2026/11/19/plan/plan_2026-11-19_NQ.webp`, `discord.sent:true`) nhưng 2 POST (bấm tay + tự gửi) → 2 tin Discord; chart Price scale 4 → tick 4, row 16, cả `periods_hl` bị làm tròn 4 điểm → số 19/11 sai.
- Domain cũ trả 307 sang `zendojo-deren.vercel.app`; indicator vẫn trỏ domain cũ → lần gửi tới sẽ `401` (.NET bỏ `Authorization` khi redirect).
- `/api/plan`: chống Discord trùng (cùng ngày + symbol + cùng số liệu, bỏ qua `trigger` / `ts_et`, trong 120 giây → `discord: {sent:false, skipped:"duplicate"}`); đẩy `warnings` của indicator vào tin Discord và response. `tsc` + `check-plan-core` OK.
- Tài liệu: `docs/plan-sender/PROMPT_PlanSender_fix-2026-11-21.md` (sửa indicator trên máy), README mục "Cấu hình bắt buộc", `dashboard-setup.md` (307, Price scale).
- Supabase: không có dữ liệu test (chỉ 2 dòng thật 17/11, 19/11 + 2 ảnh); `rls_auto_enable` đã thu quyền anon / authenticated.

## 2026-11-21 · Đối chiếu trạng thái, chốt đợt ship dashboard
- Kiểm thật: production còn ở PR #3; Preview `development` READY; domain mới + redirect 307 đã chạy; `journal_images` chưa áp; thiếu `COINGECKO_API_KEY`.
- Chốt đợt đang làm: nghiệm thu + PR `development` → `production`. Ghi phương án T12 (log phiên → cột trong `journal_entries`, khoá localStorage `cb-log`) vào `08`.

## 2026-11-20 · Dự án đổi tên thành ZenDojo (D50)
- Code và tài liệu dùng tên mới: `package.json` (`zendojo`), `supabase/config.toml` (`project_id`), `CLAUDE.md`, `claude/01`, `02`, `04`, `08`, prompt chuyển đổi, subagent, hook SessionStart, artifact (domain mới, build lại `app.js`).
- `docs/dashboard-setup.md`: thêm checklist đổi tên trên GitHub, Vercel, Supabase, Discord, ATAS. Domain chính mới `zendojo-deren.vercel.app` (`zendojo.vercel.app` đã có người dùng).

## 2026-11-19 · Brand kit ZenDojo
- Logo có 3 dạng (vuông bo góc, tròn góc trong suốt, không nền) + avatar tràn nền. Đã thử biến thể `[ツ]` và con dấu son rồi bỏ theo ý Deren: chỉ giữ ensō + ツ; nền login / điện thoại bỏ con dấu ở góc.
- Thêm bộ hình nền lấy ㋡ làm hình chính (`05-backgrounds/tsu/`: 5K / 4K / QHD / 16:10, điện thoại, biểu ngữ server + hồ sơ Discord) và biểu ngữ hồ sơ Discord 2040×720 cho bộ nền núi.
- `scripts/zendojo-brand/kit.mjs` + `kit.py` đóng gói ZenDojo-brand-kit.zip (~13 MB, ~60 file): logo SVG + PNG tới 4096 (3 dạng), logo kèm chữ (4×, nền tối / trong suốt), avatar 1024 / 2048, favicon.ico + PNG 16–1024 + maskable, hình nền 5K / 4K / QHD / 16:10 / điện thoại / banner Discord, OG 2400×1260, minh hoạ, bảng màu + `tokens.css` / `tokens.json` / màu ATAS ARGB, README. Kit không commit (file lớn), sinh lại bằng lệnh trong `scripts/zendojo-brand/README-kit.md`.

## 2026-11-19 · ZenDojo (D49)
- Đổi tên Deren Desk → ZenDojo: `layout.tsx` (title, icon, apple icon, Open Graph / Twitter), sidebar, login, mobile topbar, News; câu EN mới.
- Logo làm 2 vòng theo góp ý: bản đầu ensō nét đều → Deren muốn "vết mực quẹt, kiểu Nhật" + "thêm tý công nghệ". Bản chốt: ensō mô phỏng ~75 sợi lông bút gom thành búi (khe khô dọc nét, đầu nét xoè, đuôi mảnh), lát glitch bằng `clipPath` + `<use>` dịch ngang, khe scanline bằng `mask`, đuôi tan thành pixel bám lưới; chữ ツ bút lông màu cát.
- Ảnh trong `apps/web/public/assets/img/zendojo/`: `icon-32/180/192/512.png`, `login-bg.webp` (26 KB), `empty.webp`, `og.png` (Playwright, font Inter + Noto CJK). Nguồn: `scripts/zendojo-brand/` (`ink.py`, `build.py`, `raster.mjs`, `og.html`). Xoá `desk-login-bg.svg`. Trang học cũ (`/learn`) giữ icon cũ.
- Minh hoạ ở Dashboard (chưa có plan / cuối tuần) và trang 404 mới `app/not-found.tsx`.
- Test mock: build OK, login / Dashboard / 404 ở 1440 px và 390 px không tràn ngang, thẻ og:image và icon đúng đường dẫn.

## 2026-11-19 · Khách (D48)
- Đợt 2: danh sách khách chuyển từ biến `DESK_GUEST_DISCORD_IDS` sang bảng `access.members` (schema riêng `access`, tách khỏi `trading`; migration `20261119071248_access_members`, test Postgres 16 local: check constraint, trigger `approved_at`, anon / authenticated bị chặn ở mức schema; `lib/db.ts` có `dbSchema(schema)`; đã áp lên Supabase version `20261119071248`; advisor chỉ còn INFO "RLS bật, không policy" như các bảng trading). Callback ghi yêu cầu pending; Profile có khung **Khách truy cập** (duyệt / từ chối / gỡ quyền / thêm bằng ID), `/api/members`. Cache kiểm khách đặt trên `globalThis` để gỡ quyền có hiệu lực ngay (route API và trang là 2 module riêng).
- `lib/auth.ts`: `getViewer` / `requireViewer` (chủ sở hữu + khách), `requireOwner` đưa khách về `/dashboard`; callback đánh dấu `desk_guest`; proxy chặn khách ở `/trade-plan`, `/journal*`; thêm layout chỉ chủ sở hữu cho 2 trang này.
- Khách: sidebar / tab mobile / palette ẩn Trade Plan, Journal, PnL; Dashboard không đọc plan / journal; Profile ẩn thiết lập giao dịch + kết nối.
- Test mock: khách vào 9 trang thị trường (200), 3 trang giao dịch → `/dashboard`, `/api/journal` + `/api/plan` 401; khách bị gỡ khỏi danh sách → về `/login`; chủ sở hữu không đổi.

## 2026-11-19 · Dashboard đợt 5 (code ý tưởng canvas v2)
- Shell v2: `Topbar`, `Palette` (Ctrl/Cmd+K), thanh tab mobile; bỏ session khỏi `lib/settings.ts`, `EventRow`, timeline (D47).
- Markets mới (`lib/markets.ts`, `/markets`, D46); `/api/stock/summary` cho ngăn tóm tắt ở Earnings; proxy thêm `/markets`, `/api/stock`.
- Dashboard: watchlist (`getQuotes`), earnings tuần, journal mini, thang level plan. Calendar tuần dạng cột, News cột lọc, trang mã chia tab, Journal recap theo tab. 72 câu EN mới.
- Test mock (Finnhub + CoinGecko giả): build OK, desktop 1600 px / mobile 390 px không tràn ngang, không lỗi console; palette gõ "nvda" + Enter mở `/stock/NVDA`. Sửa CSS thứ tự: topbar ẩn và tab dưới hiện ở ≤ 860 px.

## 2026-11-19 · Dashboard đợt 4 (9 góp ý)
- Layout vừa khung cho Calendar / Earnings / News; sửa lỗi phần đầu trang bị co lại khi trang dài (`.main > *` không co); Journal đưa nút lưu lên đầu.
- Trang Stocks mới (D44), Knowledge nhúng khoá học cũ (D45): `core.js` v21, `app.css` v19, chạy lại `i18n/build_en.py`.
- Timeline: mốc giờ cũ chia đều nên chấm tin lệch so với nhãn (14:00 nằm ở 83% nhưng nhãn ở 86%) → đặt mốc theo trục thật.
- Test mock: 12 trang × desktop 1600 px / mobile 390 px không tràn ngang, không lỗi console; iframe khoá học tự cao theo nội dung.

## 2026-11-18 · Dashboard đợt 3 (6 góp ý)
- Calendar xem cả tuần; Earnings thành lịch tháng; News 20 bài + trình đọc trong app (D42, thư viện mới `@mozilla/readability` 0.6.0, `linkedom` 0.18.15, `sanitize-html` 2.18.2); Journal có ảnh lệnh (D43); sidebar thu gọn hết giật khi rê chuột; lưới các trang đều hơn.
- Migration `20261118120000_journal_images` test trên Postgres 16 local (trigger `day_id`, anon bị chặn); chưa áp lên Supabase.
- Test local với mock: tải ảnh 3000×1600 PNG → WebP 2560 px, sửa ghi chú / gắn lệnh, xoá (cả file Storage), khách 401; trình đọc lọc `<script>` / `onerror`, link tuyệt đối mở tab mới, redirect về 127.0.0.1 bị chặn; không tràn ngang ở 1440 px và 390 px.

## 2026-11-18 · Dashboard đợt 2 (13 góp ý sau test preview)
- Giao diện: scrollbar mảnh, sidebar ghim / thu gọn (cookie `desk_side`), mobile có thanh trên + ngăn kéo, lưới Dashboard co về 1 cột dưới 1100 px.
- VI / EN (cookie `desk_lang`, từ điển `lib/i18n-en.ts`), múi giờ hiển thị (cookie `desk_tz`); Calendar nhóm ngày theo múi giờ chọn. Giải thích lệch ngày FOMC: feed ForexFactory là giờ ET (14:00 ET Thứ 4), trang forexfactory.com xem ở VN hiện 02:00 Thứ 5.
- Trade Plan (đổi tên), `/api/plan/image` + nút Copy ảnh; Journal có tab PnL Calendar; News / Earnings (Finnhub); bỏ thẻ Journal ở Dashboard.
- Migration `20261118090014_trade_days_hub` (D39) test trên Postgres 16 local: backfill, trigger `day_id`, upsert kiểu production cũ, `save_journal`, tag n:n, anon bị chặn. Đã áp lên Supabase (version `20261118090014`). News / Earnings bật lại sau khi Deren thêm `FINNHUB_API_KEY`.

## 2026-11-18 · Code dashboard Deren Desk
- Chỉnh sau test preview: sidebar đứng yên, chỉ vùng nội dung cuộn (desktop); lịch kinh tế màu theo ForexFactory (đỏ / cam / vàng / xám), lấy mọi currency, bộ lọc Mức tác động + Currencies lưu trong cookie `desk_econ` dùng chung Calendar và Dashboard (mặc định USD, mọi mức).
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

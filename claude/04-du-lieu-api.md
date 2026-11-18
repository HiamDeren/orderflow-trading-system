# 04 · Dữ liệu, API và tích hợp

## Supabase
- Project: **Personal Trading Dashboard**, ref `gpbypxuglcfmvarmferr`, region `ap-southeast-1` (Singapore), tạo 2026-11-18. Project cũ `njbeaswlwqweblvgvrlx` (Sydney) chỉ giữ tạm tới khi xác nhận xoá.
- Truy cập chỉ từ server (Vercel Function, region `sin1`) bằng **secret key**. Không có client nào dùng publishable / anon key.
- **Mỗi nghiệp vụ một schema, không dùng `public`:** `trading` (trade plan; sau này journal, recap), `util` (hàm dùng chung, không expose). Nghiệp vụ mới (calendar, options, news...) tạo schema riêng theo cùng mẫu quyền.
- Schema mới phải thêm vào **Project Settings → Data API → Exposed schemas** thì PostgREST mới thấy. Gọi REST: header `Accept-Profile: <schema>` khi đọc, `Content-Profile: <schema>` khi ghi.
- Nguồn chuẩn schema: `supabase/migrations/` (version trùng lịch sử trên production); bản gộp để đọc: `docs/plan-sender/supabase.sql`. Migration đã áp trên project Singapore: `trading_schema_trade_plans`, `revoke_rls_auto_enable_execute` (thu quyền gọi `public.rls_auto_enable()` của anon / authenticated), `trade_plans_timestamp_utc_defaults` (tạm dùng `timestamp` UTC), `trade_plans_timestamptz_defaults` (đổi lại `timestamptz`, default `now()`, trigger `now()`), `storage_trading_bucket` (bucket `trading`).

### Bảng `trading.trade_plans`
Tạo 2026-11-18 khi chuyển sang Singapore (dữ liệu cũ chép sang, khớp md5). Mỗi cột có `comment` trong database.

| # | Cột | Kiểu | Ghi chú |
|---|---|---|---|
| 1 | `id` | uuid PK, mặc định `gen_random_uuid()` | |
| 2 | `created_at` | timestamptz, mặc định `now()` | lần gửi đầu tiên của ngày |
| 3 | `updated_at` | timestamptz, mặc định `now()` | lần gửi gần nhất; trigger `trade_plans_touch` → `util.touch_updated_at()` (`search_path=''`) |
| 4 | `trade_date` | date not null | ngày phiên trade (ET) |
| 5 | `symbol` | text not null, mặc định `'NQ'` | ví dụ `NQZ6` |
| 6 | `summary` | jsonb | server tính: `{date, location, prth, ovn, bias, conf, setup, target, distance, flip, price, zone}` để lọc / thống kê |
| 7 | `plan_text` | text | plan chữ như khối bên phải ảnh |
| 8 | `image_path` | text | đường dẫn ảnh trong bucket |
| 9 | `payload` | jsonb not null | JSON v1 nguyên bản từ indicator |

- **Thời gian:** cột dùng `timestamptz` (D33, theo khuyến nghị Supabase). API trả chuỗi có offset (`+00:00`). Trang plan vẫn thêm `Z` nếu chuỗi thiếu offset (an toàn cho cả hai kiểu). Ngày phiên vẫn là `trade_date` (giờ ET).
- Giá lúc 9:29 ET không có cột riêng: lấy ở `payload->>'price'` hoặc `summary->>'price'`.
- Ràng buộc `trade_plans_trade_date_symbol_key unique (trade_date, symbol)`: gửi lại cùng ngày thì ghi đè (upsert).
- RLS bật, **không có policy**; `anon` / `authenticated` không có quyền trên schema `trading` lẫn bảng; chỉ `service_role` (secret key) có `usage` + `select, insert, update, delete`. Default privileges của schema `trading` đã đặt sẵn để bảng mới tự theo mẫu này.
- Thêm cột mới: Postgres luôn thêm vào cuối. Muốn giữ thứ tự nhóm thì tạo lại bảng khi bảng còn trống, hoặc chấp nhận cột mới ở cuối.

### Storage
- Bucket **`trading`** (cùng tên schema): private, tối đa 10 MB / file, `image/png`, `image/jpeg`, `image/webp`, không storage policy (chỉ secret key).
- Đường dẫn theo **ngày rồi loại**: `YYYY/MM/DD/<loại>/<file>`, loại = `plan` | `journal` (journal gồm ảnh chụp lệnh và recap cuối phiên). Ví dụ `2026/11/17/plan/plan_2026-11-17_NQ.webp`. Helper: `apps/web/lib/storage.ts` (`dayPath`, `planImagePath`).
- **Nén ảnh** (`apps/web/lib/image.ts`, sharp): plan = WebP lossless (2600 px, giống từng pixel PNG, ~100 KB thay vì ~330 KB); journal = xoay EXIF, tối đa 2560 px ngang, WebP q85 (ảnh chụp 4K ~1,1 MB → ~200 KB). `trade_plans.image_path` lưu đường dẫn trong bucket.
- Hạn mức gói Free: 1 GB file storage, 5 GB egress. Ước tính: plan ~25 MB / năm; journal 5 ảnh / ngày ~250 MB / năm.
- Bucket cũ `trade-plans` (trống) chờ xoá trên Dashboard. Xoá file / bucket phải qua Storage API hoặc Dashboard (SQL bị chặn bởi `storage.protect_delete()`).

## Biến môi trường Vercel (Production, kiểu Secret)
| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `SUPABASE_URL` | có | `https://<ref>.supabase.co` (code nhận thêm `NEXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_SERVICE_KEY` | có | secret key `sb_secret_...` (code nhận thêm `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) |
| `PLAN_TOKEN` | có | token Bearer cho `/api/plan` (ATAS và trình duyệt chủ site dùng) |
| `DISCORD_WEBHOOK_TRADE_PLAN` | không | webhook kênh `#trade-plan` (tên cũ `DISCORD_WEBHOOK_URL` vẫn nhận) |
| `PLAN_BUCKET` | không | mặc định `trading` |

Quy ước đặt tên webhook: `DISCORD_WEBHOOK_<MỤC_ĐÍCH>` (ví dụ sau này `DISCORD_WEBHOOK_SESSION_LOG`, `DISCORD_WEBHOOK_ALERTS`).

Lưu ý gọi Supabase bằng `fetch`: gửi key ở cả `apikey` và `Authorization: Bearer <key>` (như supabase-js); gateway đổi `sb_secret_...` thành JWT service_role nội bộ. Lỗi `401 Invalid API key` (REST) + `400 headers must have required property authorization` (Storage) cùng lúc = key trên Vercel sai / đã bị xoá; đổi biến xong phải **Redeploy**.

## API `/api/plan`
Xác thực: `Authorization: Bearer <PLAN_TOKEN>` (so sánh thời gian hằng). Sai hoặc thiếu → `401 {"error":"unauthorized"}`. Luôn `Cache-Control: no-store`.

### `POST /api/plan`
Body: JSON v1 (bên dưới). Bắt buộc `date` dạng `YYYY-MM-DD`, `prth`, `ovn`. Thêm `"notify": false` để không gửi Discord.

Các bước:
1. Upsert `{trade_date, symbol, payload}` (`on_conflict=trade_date,symbol`). Lỗi ở đây → `502`.
2. `planFromJson(payload)` (plan-core.js) → SVG → PNG bằng resvg với font trong `apps/web/fonts/`.
3. Upload PNG (`x-upsert: true`), PATCH dòng với `image_path`, `plan_text`, `summary`.
4. Gửi Discord nếu có webhook.

Bước 2–4 lỗi thì plan vẫn được lưu. Bước 1 (database) lỗi thì API **vẫn vẽ ảnh, lưu Storage và gửi Discord** rồi trả `502 {"error":"supabase", status, detail, ok:false, image, discord}` (plan 9:29 không mất vì database). Response bình thường:
```json
{ "ok": true, "date": "2026-11-12", "symbol": "NQZ6",
  "image": { "path": "2026/11/12/plan/plan_2026-11-12_NQZ6.webp", "bytes": 101834 },
  "discord": { "sent": true } }
```
`image` / `discord` có thể là `{ "error": "..." }`; `discord` là `null` khi không gửi.

### `GET /api/plan[?date=YYYY-MM-DD]`
Trả plan của ngày đó, hoặc mới nhất: `trade_date, symbol, created_at, updated_at, summary, plan_text, image_path, payload` + `image_url` (link ký tạm 1 giờ). Không có → `404`.

## JSON v1 từ indicator ATAS (`Deren · Plan Sender`)
Chỉ ký tự ASCII. Tên trường cố định, không đổi.
```
{ v, source, trigger, symbol, date, ts_et, price, tick, row,
  prth: { date, vah, val, poc, high, low, close, periods, periods_hl },
  ovn:  { vah, val, poc, onh, onl, periods, periods_hl },
  sessions: [ { date, type: "RTH"|"OVN", val, vah, poc, periods } ],
  composite: { days, row, vah, val, poc },
  warnings: [] }
```
- `periods_hl`: high / low từng period 30' để dựng lại profile TPO trên ảnh.
- Phiên: RTH 9:30–16:14 ET (nến 9:30…16:00), OVN 18:00–9:29 ET (tính cho ngày hôm sau nếu ≥ 18:00).
- TPO / VA: row 4 tick, VA 70% mở rộng hai hàng một lần; POC hoà thì chọn gần giữa, rồi chọn thấp hơn (giống `analyze.py` của backtest).
- Tham số indicator: `SessionsLookback 30`, `CompositeDays 30`, `CompositeRowTicks 40`, `RowTicks 4`, `ValueAreaPct 70`, `AutoSendAt929`, `SendHttp`, `ApiUrl`, `ApiToken`, `OutputFolder` (`Documents\ATAS_Export\plans`).
- Đầu ra: `plan_yyyyMMdd.json`, `latest_plan.json`, `plan_sender.log`, clipboard (clip.exe), HTTP POST.
- Số kiểm tra khi build:

| AsOfDate | VA pRTH | POC pRTH | VA OVN | POC OVN | ONH / ONL |
|---|---|---|---|---|---|
| 2026-11-12 | 28416–28697 | 28548.5 | 28176–28307 | 28204.5 | 28368.75 / 28013.75 |
| 2026-11-11 | 27647–27916 | 27789.5 | 28118–28407 | 28226.5 | 28406.25 / 27847.75 |

Mã nguồn, prompt build và hướng dẫn: `docs/plan-sender/`.

## Discord
- Webhook (không phải bot), kênh `#trade-plan`, tên "Trade Plan", `allowed_mentions` rỗng.
- Gửi multipart: `payload_json` (embed) + `files[0]` (PNG). Embed: tiêu đề `PLAN <date> · <symbol>`, các dòng Bias, Vị trí, Setup, Target, Đổi bias, Giá 9:29; màu theo hướng bias; ảnh `attachment://<file>`.
- Bot thật (lệnh `/plan`, `/log`) là ý tưởng sau này, xem roadmap.

## Bảo mật hiện tại
- Một token chung `PLAN_TOKEN`; trình duyệt lưu token ở `localStorage` (`ofs.api.token`), xoá khi gặp 401.
- Không CORS mở; trang và API cùng origin.
- Khi có đăng nhập: thay token bằng Supabase Auth session cho người dùng web, giữ token riêng (hoặc API key theo thiết bị) cho ATAS.

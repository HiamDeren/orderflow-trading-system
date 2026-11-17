# 04 · Dữ liệu, API và tích hợp

## Supabase
- Project: **HiamDeren's Project**, ref `njbeaswlwqweblvgvrlx`, region `ap-southeast-2`.
- Truy cập chỉ từ server (Vercel Function) bằng **secret key** (tên key trên Supabase: `vercel_server`, dùng chung cho mọi tính năng backend sau này). Không có client nào dùng publishable / anon key.
- SQL chuẩn: `docs/plan-sender/supabase.sql`. Migration đã áp: `trade_plans_image_and_storage` (cột ảnh, bucket, sửa `search_path`), `trade_plans_recreate_ordered_no_price` (tạo lại bảng, bỏ `price`, thu quyền anon/authenticated).

### Bảng `public.trade_plans`
Tạo lại 2026-11-17 (migration `trade_plans_recreate_ordered_no_price`): bỏ cột `price`, sắp cột theo nhóm. Mỗi cột có `comment` trong database. SQL chuẩn: `docs/plan-sender/supabase.sql`.

| # | Cột | Kiểu | Ghi chú |
|---|---|---|---|
| 1 | `id` | bigint identity PK | khoá tự tăng |
| 2 | `created_at` | timestamptz, mặc định `now()` | lần gửi đầu tiên của ngày |
| 3 | `updated_at` | timestamptz, mặc định `now()` | lần gửi gần nhất; trigger `trade_plans_touch` → `public.touch_updated_at()` (`search_path=''`) |
| 4 | `trade_date` | date not null | ngày phiên trade (ET) |
| 5 | `symbol` | text not null, mặc định `'NQ'` | ví dụ `NQZ6` |
| 6 | `summary` | jsonb | server tính: `{date, location, prth, ovn, bias, conf, setup, target, distance, flip, price, zone}` để lọc / thống kê |
| 7 | `plan_text` | text | plan chữ như khối bên phải ảnh |
| 8 | `image_path` | text | đường dẫn ảnh trong bucket |
| 9 | `payload` | jsonb not null | JSON v1 nguyên bản từ indicator |

- Giá lúc 9:29 ET không có cột riêng: lấy ở `payload->>'price'` hoặc `summary->>'price'`.
- Ràng buộc `trade_plans_trade_date_symbol_key unique (trade_date, symbol)`: gửi lại cùng ngày thì ghi đè (upsert).
- RLS bật, **không có policy**; `anon` / `authenticated` đã bị thu hết quyền trên bảng; chỉ `service_role` (secret key) có `select, insert, update, delete`.
- Thêm cột mới: Postgres luôn thêm vào cuối. Muốn giữ thứ tự nhóm thì tạo lại bảng khi bảng còn trống, hoặc chấp nhận cột mới ở cuối.

### Storage
- Bucket `trade-plans`: private, tối đa 5 MB / file, chỉ `image/png`, không có storage policy.
- Đường dẫn: `YYYY/MM/plan_<date>_<symbol>.png` (ký tự lạ trong symbol đổi thành `_`). Ảnh khoảng 340 KB (PNG zoom ×2).
- Xoá file: phải qua Storage API hoặc Dashboard (SQL `delete from storage.objects` bị chặn bởi `storage.protect_delete()`).

### Cảnh báo advisor còn mở
- Hàm `public.rls_auto_enable()` là SECURITY DEFINER, `anon` / `authenticated` gọi được → nên thu `EXECUTE`.

## Biến môi trường Vercel (Production, kiểu Secret)
| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `SUPABASE_URL` | có | `https://<ref>.supabase.co` (code nhận thêm `NEXT_PUBLIC_SUPABASE_URL`) |
| `SUPABASE_SERVICE_KEY` | có | secret key `sb_secret_...` (code nhận thêm `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) |
| `PLAN_TOKEN` | có | token Bearer cho `/api/plan` (ATAS và trình duyệt chủ site dùng) |
| `DISCORD_WEBHOOK_TRADE_PLAN` | không | webhook kênh `#trade-plan` (tên cũ `DISCORD_WEBHOOK_URL` vẫn nhận) |
| `PLAN_BUCKET` | không | mặc định `trade-plans` |

Quy ước đặt tên webhook: `DISCORD_WEBHOOK_<MỤC_ĐÍCH>` (ví dụ sau này `DISCORD_WEBHOOK_SESSION_LOG`, `DISCORD_WEBHOOK_ALERTS`).

Lưu ý gọi Supabase bằng `fetch`: key `sb_secret_...` chỉ gửi header `apikey`; key JWT cũ (`eyJ...`) gửi thêm `Authorization: Bearer`.

## API `/api/plan`
Xác thực: `Authorization: Bearer <PLAN_TOKEN>` (so sánh thời gian hằng). Sai hoặc thiếu → `401 {"error":"unauthorized"}`. Luôn `Cache-Control: no-store`.

### `POST /api/plan`
Body: JSON v1 (bên dưới). Bắt buộc `date` dạng `YYYY-MM-DD`, `prth`, `ovn`. Thêm `"notify": false` để không gửi Discord.

Các bước:
1. Upsert `{trade_date, symbol, payload}` (`on_conflict=trade_date,symbol`). Lỗi ở đây → `502`.
2. `planFromJson(payload)` (plan-core.js) → SVG → PNG bằng resvg với font trong `api/_fonts/`.
3. Upload PNG (`x-upsert: true`), PATCH dòng với `image_path`, `plan_text`, `summary`.
4. Gửi Discord nếu có webhook.

Bước 2–4 lỗi thì plan vẫn được lưu. Response:
```json
{ "ok": true, "date": "2026-11-12", "symbol": "NQZ6",
  "image": { "path": "2026/11/plan_2026-11-12_NQZ6.png", "bytes": 338930 },
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

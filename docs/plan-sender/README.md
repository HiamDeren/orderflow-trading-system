# Plan Sender · ATAS → Plan Builder → Vercel + Supabase

Tài liệu gộp cho toàn bộ luồng lập plan tự động của khung **Composite × pRTH × OVN**.
Mọi file liên quan nằm trong thư mục này và trong `api/plan.js` ở gốc repo.

```
ATAS X (chart M30, 30 ngày)
  └─ Deren · Plan Sender, bấm lúc 9:29 ET
       ├─ Bước 1: copy JSON vào clipboard + lưu latest_plan.json
       │          → dán vào trang Testing plan · chương 04 Plan Builder
       └─ Bước 2: POST /api/plan (token) → Vercel → Supabase (bảng plans)
                  → trang plan đọc GET /api/plan
```

| File | Dùng để |
|---|---|
| `PlanSender.cs` | Indicator C# cho ATAS X: tính VA TPO của pRTH, OVN, VA từng phiên 30 ngày, composite; xuất JSON |
| `PROMPT_PlanSender.md` | Prompt cho Claude Code: build, cài, kiểm số liệu với giá trị chuẩn |
| `supabase.sql` | Tạo bảng `plans` trên Supabase (RLS bật, không public) |
| `../../api/plan.js` | Vercel Function nhận / trả plan, đã nằm trong repo |

Thư mục `docs/` không được deploy lên site (khai báo trong `.vercelignore`), nhưng repo đang public trên GitHub: **không đưa token, key, CSV hay file JSON dữ liệu vào repo**.

---

## Bước 1 · Indicator + dán JSON (làm tối nay)

1. Trên ATAS: tạo chart **NQ khung 30 phút**, phiên ETH đầy đủ, load **ít nhất 35 ngày**.
2. Mở Claude Code trên máy có ATAS, đưa file `PlanSender.cs` và nội dung `PROMPT_PlanSender.md`. Claude Code sẽ build, cài, rồi kiểm số với 2 ngày chuẩn (11/11 và 12/11).
3. Mỗi sáng phiên Mỹ, lúc 9:29 ET (21:29 VN mùa đông), trong indicator bật **"Bấm để gửi plan"**.
   - JSON được copy vào clipboard và lưu `Documents\ATAS_Export\plans\latest_plan.json`.
4. Mở site → **Testing plan → 04 · Plan Builder** → ô "Nhập từ ATAS" → bấm **"Dán từ clipboard"** (hoặc Ctrl+V vào ô rồi "Nhập và lập plan", hoặc chọn file).
5. Builder tự điền pRTH / OVN / giá, tìm HVN từ VA các phiên (theo tham số ở chương 01), vẽ plan dạng **TPO** kèm plan chữ bên phải trong cùng một ảnh. Bấm **"Copy ảnh plan"** rồi dán vào journal, Discord hoặc Notion.

Kiểm tra nhanh không cần ATAS: nút **"Nạp ví dụ 12/11 (data thật, có TPO)"**.

### JSON indicator gửi (v1)
```json
{
  "v": 1, "symbol": "NQZ6", "date": "2026-11-17", "ts_et": "2026-11-17T09:29:05", "price": 0,
  "prth": { "date": "2026-11-16", "vah": 0, "val": 0, "poc": 0, "high": 0, "low": 0, "close": 0,
            "periods": 14, "periods_hl": [[0, 0]] },
  "ovn":  { "vah": 0, "val": 0, "poc": 0, "onh": 0, "onl": 0, "periods": 31, "periods_hl": [[0, 0]] },
  "sessions": [ { "date": "2026-11-16", "type": "RTH", "val": 0, "vah": 0, "poc": 0, "periods": 14 } ],
  "composite": { "days": 30, "row": 10, "vah": 0, "val": 0, "poc": 0 },
  "warnings": []
}
```
- `periods_hl`: high/low từng period 30' theo thứ tự thời gian, để web vẽ lại profile TPO.
- `sessions`: VA của mọi phiên RTH và OVN trong 30 ngày; web dùng để tìm HVN (công cụ chồng VA).
- TPO: row 4 tick (1 điểm), VA 70% mở rộng 2 dòng, giống script backtest.
- Nến M30 lúc 16:00 chứa cả 16:15–16:29: pRTH dài hơn RTH chuẩn 15 phút, chấp nhận lệch nhỏ này.

---

## Bước 2 · Vercel + Supabase (làm trên web được)

`api/plan.js` **đã có trong repo**. Chỉ cần tạo database và khai báo biến môi trường.

### A. Supabase
1. supabase.com → **New project**, region **Southeast Asia (Singapore)**, đặt Database password và lưu lại.
2. **SQL Editor → New query** → dán nội dung `supabase.sql` → **Run**. Kiểm tra **Table Editor** có bảng `plans`, RLS bật.
3. **Project Settings → API Keys** (tên mục có thể khác nhẹ):
   - Copy **Project URL** (`https://xxxx.supabase.co`).
   - Copy **secret key** (`sb_secret_...`); project kiểu cũ thì dùng **service_role**.
   - Key này có toàn quyền database: chỉ dán vào Vercel, không để ở đâu khác.

### B. PLAN_TOKEN
Tạo chuỗi ngẫu nhiên từ 32 ký tự (chữ + số) bằng trình tạo mật khẩu. Dùng chung cho indicator và trang plan. Lộ thì đổi.

### C. Vercel
1. Project của site → **Settings → Environment Variables**, môi trường **Production**:

   | Tên | Giá trị | Sensitive |
   |---|---|---|
   | `SUPABASE_URL` | Project URL | |
   | `SUPABASE_SERVICE_KEY` | secret key | bật |
   | `PLAN_TOKEN` | chuỗi ở bước B | bật |

2. **Deployments → bản mới nhất → Redeploy** (biến chỉ có hiệu lực ở lần deploy sau khi thêm).

### D. Kiểm tra
1. Mở `https://<site>/api/plan`:
   - `{"error":"unauthorized"}` → đúng, function chạy và đang chặn khi không có token.
   - `Thiếu biến môi trường ...` → chưa Redeploy sau khi thêm biến.
   - 404 → bản deploy chưa có `api/plan.js`.
2. Tối nay, sau khi có `latest_plan.json`, chạy PowerShell:
   ```powershell
   $t = "<PLAN_TOKEN>"
   $u = "https://<site>/api/plan"
   Invoke-RestMethod -Method Post -Uri $u -Headers @{Authorization="Bearer $t"} -ContentType "application/json" -InFile "$HOME\Documents\ATAS_Export\plans\latest_plan.json"
   Invoke-RestMethod -Uri $u -Headers @{Authorization="Bearer $t"}
   ```
   Lệnh 1 trả `ok: True`, lệnh 2 trả lại plan, bảng `plans` có 1 dòng.
3. Trong indicator, nhóm **"2 · Web"**: bật "Gửi lên web", điền API URL = `$u`, API token = `$t`. Bấm gửi → `plan_sender.log` có `HTTP 200`.

### API
| Method | Header | Kết quả |
|---|---|---|
| `POST /api/plan` | `Authorization: Bearer <PLAN_TOKEN>`, body = JSON v1 | lưu / ghi đè plan theo (ngày, symbol) |
| `GET /api/plan` | như trên | plan mới nhất |
| `GET /api/plan?date=YYYY-MM-DD` | như trên | plan của ngày đó |

### Việc tiếp theo
Thêm nút **"Lấy plan mới nhất"** vào Plan Builder: gọi `GET /api/plan` với token lưu trong trình duyệt, rồi tự chạy "Nhập và lập plan". Làm sau khi D chạy ổn.

---

## Màu TPO cho ATAS X (ARGB)

| Thành phần | Trong VA | Ngoài VA | POC |
|---|---|---|---|
| RTH | `#FFE0A458` | `#73E0A458` | `#FFFF9F1A` |
| OVN | `#FF6F9BD9` | `#736F9BD9` | `#FFE87BA4` |
| Composite | `#6626A69A` | `#40888780` | `#FFFFFFFF` |

Vùng HVN: fill `#1F26A69A`, viền `#9926A69A`. Single print / tail `#FFEF5350`. VWAP RTH `#FF26C6DA`.

## An toàn
- Data Rithmic / CME chỉ dùng cá nhân: bảng `plans` không public, endpoint bắt buộc token.
- Token nằm trong template ATAS dạng chữ thường: không chia sẻ template, không commit.
- Khung Composite × pRTH × OVN **chưa được backtest**: forward test với size nhỏ, ghi log mỗi phiên.

# Prompt cho Claude Code trên máy ATAS · Plan Sender sửa lỗi 21/11/2026

Dán nguyên file này cho Claude Code đang mở **thư mục source indicator trên máy** (bản có `Core\PlanMath.cs`, `Tests\PlanSender.Tests`).
Bản `docs/plan-sender/PlanSender.cs` trong repo đã cũ, **không** dùng để build.

Ràng buộc giữ nguyên: không đổi tên field JSON v1, không đổi thuật toán TPO / VA, JSON chỉ ASCII, không ghi token ra log hay file.

## Bối cảnh (từ `plan_sender.log` + Supabase, 21/11)

| Ngày | Chuyện gì xảy ra | Hậu quả |
|---|---|---|
| 17/11 21:31–21:40 VN | Gửi 3 lần, log không có dòng `web:` | "Gửi lên web" chưa bật / URL còn mẫu `<ten-site>` → indicator bỏ qua im lặng |
| 17/11 21:41, 21:43 | `HTTP 200` vào project Supabase cũ (Sydney) | Project Singapore lúc đó chưa tồn tại (tạo 22:45 VN), nên "không thấy POST"; project cũ đã xoá |
| 19/11 21:29:28 / 21:29:30 | Bấm tay **và** tự gửi 9:29 cùng lúc → 2 POST, `HTTP 200` cả hai | Discord nhận **2 tin** |
| 19/11 | Chart để Price scale = 4 → tick chart 4, row 16 điểm | **High/low từng nến cũng bị làm tròn 4 điểm** (`periods_hl` toàn bội số 4): VA, POC, ONH/ONL, composite của 19/11 đều sai |
| Từ 20/11 | `ApiUrl` vẫn là `orderflow-trading-system.vercel.app` | Domain này trả **307 redirect** sang `zendojo-deren.vercel.app`; .NET bỏ header `Authorization` khi theo redirect → sẽ ra `401` |

## Việc cần sửa trong indicator

1. **Chặn gửi khi chart gộp giá.** Nếu tick của chart khác `InstrumentInfo.TickSize` (Price scale > 1):
   - Không POST lên web, không copy clipboard.
   - Log: `ERROR chart dang gop gia (tick chart X, tick that Y): dat Price scale = 1 roi gui lai`.
   - Vẫn được ghi `plan_yyyyMMdd.json` để xem, nhưng thêm warning như hiện tại.
2. **Một ngày một lần tự gửi.** Khi bấm tay thành công cho ngày D thì gán luôn `_lastAutoDate = D`, để tự gửi 9:29 không chạy thêm. (Server cũng đã chặn Discord trùng trong 120 giây, đây là lớp thứ hai.)
3. **Không theo redirect.** `HttpClient` dùng `new HttpClientHandler { AllowAutoRedirect = false }`. Gặp 3xx thì log: `HTTP 307 -> doi ApiUrl sang <Location>`.
4. **Log rõ khi không gửi web:** `web: tat (SendHttp=false)` hoặc `web: ApiUrl chua dien`.
5. Mặc định `ApiUrl = "https://zendojo-deren.vercel.app/api/plan"`.
6. Đọc `warnings` trong response (server trả lại nếu có) và ghi vào log.

## Kiểm tra sau khi build

1. Chart NQ M30, ETH, ≥ 35 ngày, **Price scale = 1**. "Tính như ngày" = `2026-11-12`, rồi `2026-11-11`; tắt "Gửi lên web" khi làm bước này.
2. So với `plans/VALIDATION.md` (bảng mục 2, phần chart) và điền kết quả:
   - 12/11: VA pRTH 28416–28697, POC 28548.5; VA OVN 28176–28307, POC 28204.5; ONH/ONL 28368.75 / 28013.75.
   - 11/11: VA pRTH 27647–27916, POC 27789.5; VA OVN 28118–28407, POC 28226.5.
3. Thử Price scale = 4: log phải có dòng `ERROR chart dang gop gia`, không có dòng `web: POST`.
4. Chạy test `Tests\PlanSender.Tests`.

## Đưa source vào repo

Copy source (không kèm `bin/`, `obj/`, template ATAS có token, CSV / JSON dữ liệu) vào `indicators/plan-sender/` của repo `HiamDeren/zendojo`, nhánh `development`; xoá `docs/plan-sender/PlanSender.cs` cũ, sửa link trong `docs/plan-sender/README.md`.

## Báo lại

Kết quả build + test, bảng so số trên chart, 5 dòng cuối `plan_sender.log`.

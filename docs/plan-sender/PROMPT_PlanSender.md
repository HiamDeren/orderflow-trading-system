# Prompt cho Claude Code: build và kiểm tra "Deren · Plan Sender" (ATAS X)

Bạn đang ở trên máy Windows có ATAS X (.NET 10, data Rithmic). Trên máy đã có project indicator chứa
`M1DataExporter.cs` (đã build và chạy được). Nhiệm vụ: thêm indicator `PlanSender.cs` vào cùng project,
build, cài vào ATAS, rồi kiểm tra số liệu với giá trị chuẩn bên dưới.

## Ràng buộc
- KHÔNG sửa, xoá hay đổi tên indicator / template khác trong ATAS.
- KHÔNG đổi tên field trong JSON và KHÔNG đổi thuật toán TPO / VA (phải khớp script backtest `analyze.py`).
- Nếu API ATAS khác tên (property, method), đối chiếu với `M1DataExporter.cs` để sửa cho build được.
- KHÔNG đưa file JSON, CSV dữ liệu hay API token lên GitHub public (data Rithmic chỉ dùng cá nhân).

## Bước 1 · Build và cài
1. Chép `PlanSender.cs` vào project indicator (cùng chỗ với `M1DataExporter.cs`).
2. Build Release giống cách đã build exporter. Chép DLL vào thư mục indicator của ATAS X như lần trước.
3. Khởi động lại ATAS X nếu cần.

## Bước 2 · Chuẩn bị chart
- Chart NQ (hợp đồng đang chạy, ví dụ NQZ6), **khung 30 phút (M30)**, phiên ETH đầy đủ, load **ít nhất 35 ngày**.
- Thêm indicator "Deren · Plan Sender" (nhóm Deren).
- Mặc định: Row TPO = 4 tick, VA = 70%, Thời gian nến là UTC = true.

## Bước 3 · Kiểm tra số liệu bằng ngày cũ
Đặt "Tính như ngày" = `2026-11-12`, rồi bật "Bấm để gửi plan". Mở
`Documents\ATAS_Export\plans\plan_20261112.json` và `plan_sender.log`. Giá trị chuẩn (tính từ data M1 cùng nguồn):

| Field | Giá trị chuẩn |
|---|---|
| prth.date | 2026-11-11 |
| prth.vah / val / poc | 28697 / 28416 / 28548.5 |
| prth.high / low | 28697 / 28199 |
| ovn.vah / val / poc | 28307 / 28176 / 28204.5 |
| ovn.onh / onl | 28368.75 / 28013.75 |
| prth.periods / ovn.periods | 14 / 31 |

Làm lại với `2026-11-11`:

| Field | Giá trị chuẩn |
|---|---|
| prth.date | 2026-11-10 |
| prth.vah / val / poc | 27916 / 27647 / 27789.5 |
| ovn.vah / val / poc | 28407 / 28118 / 28226.5 |
| ovn.onh / onl | 28406.25 / 27847.75 |

Cho phép lệch tối đa 1 điểm (1 row). Nếu lệch nhiều hơn:
- Lệch đúng 1 giờ hoặc phiên bị cắt sai → đổi "Thời gian nến là UTC" và kiểm tra lại múi giờ ET.
- `warnings` báo chart không phải 30 phút → đổi chart sang M30.
- Lệch đều vài tick → kiểm tra tick size và RowTicks.
Ghi kết quả so sánh (bảng: field, chuẩn, indicator, lệch) vào `plans/VALIDATION.md`.

## Bước 4 · Kiểm tra với Plan Builder
1. Mở trang Composite × pRTH × OVN Playbook, tab "03 Plan Builder".
2. Dán nội dung `plan_20261112.json` vào ô "JSON từ ATAS" → bấm "Nhập và lập plan".
3. Phải thấy profile TPO của pRTH và OVN, vùng HVN, target. So với nút "Nạp ví dụ 12/11 (data thật, có TPO)": hai hình phải gần như giống nhau.

## Bước 5 · Chạy thật
1. Xoá "Tính như ngày" (để trống).
2. Bật "Bấm để gửi plan" → JSON được copy vào clipboard (dán thử vào Notepad) và lưu `latest_plan.json`.
3. Tuỳ chọn: bật "Tự gửi lúc 9:29 ET" (chỉ chạy khi có tick lúc 9:29 và ATAS đang mở).

## Bước 6 · (Sau khi setup Vercel + Supabase xong) gửi lên web
1. Trong nhóm "2 · Web": bật "Gửi lên web", điền API URL (`https://<site>.vercel.app/api/plan`) và API token.
2. Bấm "Bấm để gửi plan" → `plan_sender.log` phải có dòng `HTTP 200`.
3. Kiểm tra bảng `trade_plans` trong Supabase có dòng của ngày đó.
4. Không lưu template ATAS có token vào repo.

Báo lại: kết quả build, bảng VALIDATION, ảnh chụp Plan Builder sau khi dán JSON, dòng log HTTP (nếu làm bước 6).

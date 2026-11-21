# 03 · Danh mục tính năng

Danh mục này dùng làm checklist khi port sang web app: mỗi dòng là một thứ phải giữ (hoặc chủ động bỏ).

## Shell dùng chung (core.js, app.css)
- Sidebar (desktop), topbar + bottom nav (mobile), mục lục chương của trang đang mở.
- Router chương theo hash, nhớ vị trí học gần nhất (`ofs.last`).
- Đồng hồ phiên realtime theo giờ VN: đếm tới RTH, trạng thái "Cửa sổ trade" 9:30–11:30 ET.
- Nút VI | EN, nhớ lựa chọn (`ofs.lang`).
- Toast thông báo, icon SVG nội tuyến, logo TPO.
- Giao diện tối, màu theo trang (`--c`): Level, Tools, Trade Plan (#26A69A), Quiz. Nhóm sidebar: Khoá học · Trade plan · Ôn luyện.

## Trang Tổng quan (`index.html`, home.js)
- Hero minh hoạ, đồng hồ phiên lớn.
- "Tiếp tục học" từ `ofs.last`.
- Hệ thống 4 lớp khi giá tới key level (TPO → VWAP + EMA → CVD / DOM / tape → footprint M1).
- Tiến độ 2 khoá, thống kê trắc nghiệm.
- Công cụ trong phiên (link nhanh).
- **Sao lưu & khôi phục**: xuất toàn bộ `localStorage` thành JSON (`{app:"orderflow-system", v:1, ts, data}`), copy, nhập từ ô hoặc file, xoá toàn bộ (bấm 2 lần).

## Khoá TPO Level (`levels.html`, levels-data.js, levels-page.js, ema-page.js)
Chương: 00 Tổng quan · 01 Nền tảng TPO · 02 Day & Open types · 03 Initial Balance · 04 Level map · 05 VWAP RTH · 06 EMA 9/34 · 07 CVD divergence · 08 Lên plan mỗi ngày.

Widget chính:
- Vẽ TPO profile từ chuỗi period (`computeProfile`, `tpoSVG`), giải phẫu profile, từ điển TPO, công cụ Rotation Factor.
- Chọn day type (Dalton) xem profile, open types, open location (bấm ô), quan hệ value giữa hai ngày.
- IB: phân loại độ rộng + công cụ tính, 5 kịch bản sau 10:30, 4 setup IB, checklist 10:30, **IB Journal** (lưu `ibj-rows`).
- Thứ bậc level, acceptance / rejection, 80% rule, spike rules, chấm điểm level.
- VWAP RTH: 4 trạng thái, VWAP × TPO, màu ATAS gợi ý (ARGB).
- EMA 9/34: engine chart tự viết (không thư viện), trạng thái S1–S5, entry E1–E4, holding ladder.
- CVD divergence.
- Chương 08: timeline, checklist trước / sau phiên; có callout trỏ sang trang Trade Plan cho plan hằng ngày.
- Khoá localStorage: `plan-in`, `dt-last`, `tog-scalp`, `ib-in2`, `ibj-rows`, các khoá checklist; EMA dùng tiền tố `emapb:`.

## Khoá Orderflow Tools (`tools.html`, fp.js, tools-page.js, tape-pats.js)
Chương: 00 Tổng quan · 01 Nền tảng · 02 Thuật ngữ · 03 Footprint · 04 Delta & CVD · 05 DOM · 06 Tape · 07 13 kịch bản · 08 Kết hợp tại level.

Widget chính:
- Renderer footprint cluster kiểu ATAS (bid × ask, delta, imbalance chéo, POC nến).
- 13 kịch bản footprint có hình.
- DOM mẫu, tape mẫu; chuyển layout tape Đầy đủ / 2 cột như Smart Tape (`ofs.tape.layout`).
- Trình tự 5 pha tại key level, ma trận kiểm soát tape, 7 pattern tape, chấm hạng setup (A++ / A+ / B / Skip).

## Đã bỏ: Plan Builder cổ điển (2026-11-17)
Trang `plan.html` cũ (form PD High/Low, VAH/POC/VAL, ON High/Low, level tuỳ chỉnh `[TAG] giá`, kịch bản A/B, bản đồ level SVG qua `plan-chart.js`) đã bỏ khi Deren chốt khung Composite × pRTH × OVN làm system chính. Code còn trong lịch sử git (commit trước `Gộp Plan Builder và Testing plan`). Khoá `plan-in` không còn dùng.

## Trade Plan · Composite × pRTH × OVN (`plan.html`, plan-core.js, plan-page.js) · system chính
Chương: 00 Khung plan · 01 Xác định HVN · 02 Đọc bias · 03 VWAP RTH · 04 Plan Builder · 05 Quy trình trade · 06 Quiz (10 câu riêng, không tính vào thi thử).

Widget chính:
- **Công cụ tìm HVN** bằng chồng VA các phiên RTH / OVN (dán danh sách VA, chỉnh số phiên, ngưỡng, gộp khe, bề rộng tối thiểu, chế độ both / rth / ovn / inter). Lưu `ofs.tp.hvn`.
- Bảng ghép pRTH × OVN → bias (A củng cố / A cần xác nhận / Xung đột / Balance).
- Cổng VWAP cho ba setup (Fade / Continuation / Theo bias).
- **Plan Builder**:
  - Nhập tay (vùng HVN, VA pRTH, VA OVN, giá, kiểu build pRTH) hoặc nhập JSON từ indicator ATAS (dán, clipboard, file).
  - **"Lấy plan mới nhất từ web"**: `GET /api/plan` với token lưu ở `ofs.api.token`; hiện link ảnh đã lưu.
  - Ảnh plan SVG: profile TPO pRTH và OVN đặt sát nhau, vùng vào lệnh, mép đổi bias, mũi tên target, khối plan chữ bên phải. Kiểu vẽ TPO (mặc định) hoặc Box.
  - **Copy ảnh plan** (ClipboardItem, lỗi thì tải PNG).
  - Ví dụ 12/11 (data thật, có TPO).
  - Lưu: `ofs.tp.builder` (nhập tay), `ofs.tp.builder.json` (JSON gần nhất; ưu tiên khi mở lại).
- Quy trình trade: chốt hướng lúc 10:00 ET, ba setup vào lệnh trên M1, quản lý lệnh và rủi ro.

## Trung tâm trắc nghiệm (`quiz.html`, quiz.js)
- Chế độ: A Luyện tập · B Thi thử · C Ôn câu sai.
- Ngân hàng: 87 câu Tools (`T001…T087`), 101 câu Level (`L001…L093` + chương EMA `L094…L108`, đã bỏ 7 câu case study). Một số câu có hình (`vis()`).
- Thi thử: đề Tools 50 câu, Level 50 câu, tổng 100 câu; rút ngẫu nhiên giữ tỉ lệ theo chương; qua bài khi ≥ 80% ba lần liên tiếp. Có đồng hồ, chấm điểm, lịch sử.
- Thứ tự đáp án xáo theo hash id câu (ổn định giữa các lần).
- Câu sai tự gom để ôn, trả lời đúng thì rời danh sách.
- Phím tắt điều hướng, quiz nhanh cuối mỗi chương theo module.
- Lưu: `ofs.quiz.v1` (đáp án, câu sai, lịch sử), `ofs.exam.cur` (bài thi đang làm).

## Backend (apps/web/app/api/plan/route.ts)
Chi tiết hợp đồng API: [04-du-lieu-api.md](04-du-lieu-api.md).
- POST: lưu plan → vẽ ảnh tiếng Việt → lưu Storage → cập nhật dòng → gửi Discord.
- GET: plan mới nhất (hoặc theo `?date=`) kèm link ảnh ký tạm.

## Ngoài repo
- **Indicator ATAS `Deren · Plan Sender`** (`docs/plan-sender/PlanSender.cs`): tính TPO / VA từng phiên RTH / OVN từ nến M30, composite 30 ngày, xuất JSON v1, copy clipboard, ghi file, POST lên API. Chưa build (dự kiến tối 2026-11-17 bằng Claude Code).
- **Artifact claude.ai "NQ Trade Plan · Composite × pRTH × OVN"** (ngừng duy trì 2026-11-21, D52): bản song song cũ của trang Trade Plan, nguồn lưu ở `artifact/`. Tab Log phiên (localStorage `cb-log`, khung cũ `ov-log`) đã chuyển vào Journal (D51); bảng màu ATAS ARGB còn ở `artifact/app.src.js`.
- **Journal · Log phiên** (D51): thẻ "Log phiên · Composite × pRTH × OVN" (vị trí composite, pRTH, OVN, bias trước phiên — điền sẵn từ plan; hướng open type, IB, phản ứng mép HVN, tới HVN kế), cột Setup F / C / V ở bảng lệnh, thống kê có khoảng tin cậy ở cột phải.
- **Discord**: kênh `#trade-plan`, webhook tên "Trade Plan" (avatar TPO profile).

## Bảng khoá localStorage
| Khoá | Trang | Nội dung |
|---|---|---|
| `ofs.lang` | mọi trang | `vi` / `en` |
| `ofs.last` | mọi trang | chương học gần nhất |
| `ofs.quiz.v1` | quiz | đáp án, câu sai, lịch sử thi |
| `ofs.exam.cur` | quiz | bài thi đang làm |
| `ofs.tape.layout` | tools | layout tape mẫu |
| `ofs.tp.hvn` | plan | nhập liệu công cụ HVN |
| `ofs.tp.builder` | plan | nhập tay Plan Builder |
| `ofs.tp.builder.json` | plan | JSON ATAS gần nhất |
| `ofs.api.token` | plan | `PLAN_TOKEN` (chỉ trình duyệt chủ site) |
| `dt-last`, `tog-scalp`, `ib-in2`, `ibj-rows`, checklist | levels | nhập liệu, IB journal (`plan-in` của builder cũ không còn dùng) |
| `emapb:*` | levels (EMA) | trạng thái widget EMA |

Khi chuyển web app: các khoá này là dữ liệu cần migrate lên DB theo user (xem [07-chuyen-doi-web-app.md](07-chuyen-doi-web-app.md)).

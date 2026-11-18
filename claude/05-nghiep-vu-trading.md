# 05 · Nghiệp vụ trading

Tài liệu để người code hiểu đúng thuật ngữ và luật trong engine. Không phải lời khuyên đầu tư. **Không dùng khái niệm ICT.**

## Thuật ngữ
| Thuật ngữ | Nghĩa trong repo |
|---|---|
| NQ | Hợp đồng tương lai Nasdaq-100 (CME), ví dụ `NQZ6` |
| RTH | Phiên chính 9:30–16:14 ET (TPO tính tới period 16:00) |
| OVN / ETH | Phiên qua đêm 18:00–9:29 ET |
| pRTH (Prev RTH) | Phiên RTH hôm trước. Trên ảnh viết "Prev RTH" |
| TPO | Time Price Opportunity, mỗi period 30' là một chữ / khối |
| VA, VAH, VAL | Value Area 70% quanh POC (mở rộng hai hàng mỗi lần) |
| POC | Giá có nhiều TPO nhất |
| IB | Initial Balance, 9:30–10:30 ET |
| Open type | OD, OTD, ORR, OA, chốt lúc 10:00 ET |
| Composite | Profile gộp 30 ngày gần nhất |
| HVN / LVN | Vùng giá ở lâu (balance) / vùng giá đi nhanh qua giữa hai HVN |
| VWAP RTH | VWAP neo 9:30 ET, band ±1/2/3σ |
| EMA 9/34 | Trạng thái S1–S5 trên M1 / M5 |
| CVD, delta, footprint, DOM, tape | Lớp trigger orderflow |
| Period 30' | Đơn vị đổi bias. Vào lệnh trên M1 |

## Khung Composite × pRTH × OVN · system trade plan chính (trang Trade Plan)
Deren chốt khung này làm system trade plan chính ngày 2026-11-17. Ý tưởng:
- HVN trên composite là vùng balance. Giá vào HVN thì fade hai mép. Giá ra khỏi HVN thì đi continuation tới HVN kế tiếp.
- HVN xác định bằng cách chồng VA các phiên RTH và OVN.
- pRTH đã build gì và OVN đã build gì quyết định hướng của ngày.

Chi tiết quy tắc nằm trong `apps/web/public/assets/js/plan-core.js`.

### 1. Tìm HVN (`findZones`)
- Đầu vào: danh sách VA từng phiên `{date, typ: RTH|OVN, lo, hi}`.
- Mặc định `HVN_DEFAULT = {n:16 ngày, k:3, merge:40, minw:100, mode:"both"}`.
- Lưới giá bước 5 điểm (10 điểm nếu biên độ > 2500). Đếm số VA phủ từng mức.
- Mức có ≥ k VA phủ là HVN. Mode `inter`: cần ≥ ⌈k/2⌉ RTH và ≥ ⌈k/2⌉ OVN.
- Gộp hai vùng cách nhau ≤ `merge` điểm. Vùng hẹp hơn `minw` bị đánh dấu `small`. `peak` là mức phủ nhiều nhất.
- Khe giữa hai HVN: `clear` khi có mức không VA nào phủ; `core` là đoạn ít phủ nhất (lõi LVN).

### 2. Vị trí giá (`locate`, P)
| Khoá | Tên | Điều kiện |
|---|---|---|
| `edgeU` | Sát mép trên HVN | \|giá − mép trên\| ≤ tol |
| `edgeD` | Sát mép dưới HVN | \|giá − mép dưới\| ≤ tol |
| `in` | Trong HVN | giữa hai mép |
| `lvn` | Trong LVN | giữa hai HVN |
| `out` | Ngoài composite | trên HVN cao nhất hoặc dưới HVN thấp nhất |

### 3. pRTH build gì (B)
| Khoá | Tên | Hướng |
|---|---|---|
| `accU` | Chấp nhận lên (đóng trên VAH / value cao hơn, không tail trên) | +1 |
| `accD` | Chấp nhận xuống | −1 |
| `bal` | Balance (đóng trong VA, profile cân) | 0 |
| `rejU` | Thử lên bị từ chối (tail / poor high) | −1 |
| `rejD` | Thử xuống bị từ chối | +1 |

`suggestBFrom` gợi ý B từ số liệu pRTH (close so với VA, tail).

### 4. OVN so với VA pRTH (`ovnKey`, O)
`in` (nằm trong) · `wide` (bao trùm) · `up` / `down` (tâm VA OVN cao / thấp hơn tâm VA pRTH).

### 5. Bias (`biasOf`)
| pRTH | OVN | Kết quả |
|---|---|---|
| có hướng | cùng hướng | **A củng cố**: open type không ngược hướng là đủ |
| có hướng | trung tính | **A cần xác nhận**: cần OD/OTD + EMA 9/34 cùng hướng lúc 10:00 |
| trung tính | có hướng | **A cần xác nhận**: cần OD/OTD cùng hướng OVN |
| có hướng | ngược hướng | **Xung đột**: chờ IB, theo phía IB được chấp nhận |
| trung tính | trung tính | **Balance**: fade trong HVN, chờ mép |

OVN `wide` thêm điều kiện: không trade A period.

### 6. Setup (`setupOf`) và cổng VWAP (`vwapGate`)
Ba nhóm setup: **Fade** (mép HVN, VWAP phải phẳng), **Continuation / Đi theo** (VWAP dốc theo hướng phá, vào ở pullback VWAP / ±1σ hoặc retest mép), **Theo bias trong HVN** (giữ phía VWAP theo bias). Khi chưa rõ: **Chờ IB** hoặc **Chờ phản ứng ở mép**.
- Target: giữa HVN, mép đối diện, hoặc mép gần của HVN kế tiếp; ngoài composite thì IB 1.5x–2x.
- Mép đổi bias: một period 30' đóng qua mép.
- `geomOf` vẽ dải vào lệnh rộng 15 điểm quanh mép và đường đổi bias trên ảnh.

### 7. Đầu ra `makePlan`
`{loc, ok, bk, B, S, G, D, M, panel, text, svg, summary}`. Khối chữ trên ảnh: Bias, Setup ưu tiên, Target, Đổi bias (TPO 30'), VWAP RTH, Prev RTH, OVN, Vào lệnh.

## Kết luận backtest (để không lặp lại)
- 47 phiên thử khung RTH × OVN overlap: **chưa có edge**, các mép overlap gần như ngẫu nhiên. Open type + EMA cho nhiều thông tin hơn.
- Bộ lọc VWAP cho lần chạm đầu ra 0/0 vì lần chạm đầu một level dưới giá mở cửa luôn nằm dưới VWAP (đặc tính, không phải lỗi).
- Luật đã đóng băng để kiểm tra out-of-sample. Cần thêm data M30 6–12 tháng trước khi kết luận.
- Khung Composite × pRTH × OVN là **system chính từ 2026-11-17** nhưng chưa có backtest dài hạn: ghi log từng phiên (tab Log phiên của artifact, sau này bảng `session_logs`) để kiểm tra bias / setup theo thời gian.

## Bảng màu (ARGB `#AARRGGBB`)
| Thành phần | Trong VA | Ngoài VA | POC |
|---|---|---|---|
| RTH (vàng) | `#FFE0A458` | `#73E0A458` | `#FFFF9F1A` |
| OVN (xanh) | `#FF6F9BD9` | `#736F9BD9` | `#FFE87BA4` |
| Composite | `#6626A69A` | `#40888780` | `#FFFFFFFF` |

Khác: HVN nền `#1F26A69A`, viền `#9926A69A`; tail `#FFEF5350`; VWAP `#FF26C6DA`.

Trong code web (RGB): `COL = {hvn:#26A69A, rth:#E0A458, ovn:#6F9BD9, rpoc:#FF9F1A, opoc:#E87BA4, up:#3fbf7f, dn:#ef5350}`.

## Ràng buộc tài khoản
PropFirm, trailing drawdown, 2–3 lệnh / ngày, cửa sổ NY AM 9:30–11:30 ET (21:30–23:30 giờ VN khi Mỹ theo giờ mùa đông).

# 01 · Tổng quan

## Mục tiêu
Site bắt đầu là nơi học hai playbook (**Orderflow Tools** và **TPO Level**) cho NQ intraday trên nhiều thiết bị. Từ 11/2026 site thêm công cụ lập trade plan mỗi ngày, nối với ATAS, Supabase và Discord.

Hướng dài hạn (Deren chốt 2026-11-17): **web app cá nhân / dashboard**, không còn chỉ là site tổng hợp kiến thức. Các module dự kiến:
- Trade plan hằng ngày (đã có, đang tự động hoá).
- Economic calendar.
- Options: GEX, DEX, OI, ... (Deren đã có repo riêng `HiamDeren/Gex-Dashboard`).
- Heatmap cổ phiếu dạng khối (kiểu TradingView).
- News, earnings.
- Đăng nhập cho chủ site; các module khác Deren sẽ quyết sau (journal, tài chính cá nhân, học tiếng Anh, tập luyện...).

## Người dùng
- Một người dùng chính: Deren (chủ site). Một phần nội dung học có thể để công khai.
- Dùng trên desktop (đang trade) và điện thoại (học, xem plan). Giao diện tối, ưu tiên đọc nhanh.

## Hiện trạng (2026-11-17)
- Production: `https://orderflow-trading-system.vercel.app` (Vercel, project `orderflow-trading-system`, team `derenluus-projects`, gói Hobby).
- Repo: `HiamDeren/orderflow-trading-system` (monorepo pnpm). Nhánh `production` → Vercel production, `development` → preview (nhánh mặc định).
- 5 trang (mỗi trang có bản VI và EN): Tổng quan, TPO Level, Orderflow Tools, **Trade Plan** (Composite × pRTH × OVN, `plan.html`), Trắc nghiệm. Chi tiết: [03-tinh-nang.md](03-tinh-nang.md).
- **System trade plan chính** (Deren chốt 2026-11-17): khung Composite × pRTH × OVN. Plan Builder cổ điển (PD levels, kịch bản A/B, bản đồ level) đã bỏ; trang Testing gộp vào trang Trade Plan.
- Ngân hàng câu hỏi: 188 câu (87 Tools + 101 Level).
- Tiến độ học, nhập liệu, token: lưu `localStorage` từng trình duyệt; có sao lưu / khôi phục bằng JSON ở trang Tổng quan.
- Backend: route handler Next.js `apps/web/app/api/plan/route.ts`. Dữ liệu: Supabase (bảng `trade_plans`, bucket `trade-plans`). Thông báo: Discord webhook.
- Luồng plan tự động đã chạy thông từ web đến Discord (test 2026-11-17 bằng JSON mẫu). Còn thiếu: indicator ATAS Plan Sender build và gửi thật.

## Hệ thống trading phía sau
Trade plan mỗi ngày: Composite 30 ngày (HVN/LVN) → pRTH + OVN ra bias → vị trí giá chọn setup (Fade / Continuation) → chốt lúc 10:00 bằng open type + EMA 9/34 + VWAP RTH → vào lệnh trên M1. Stack 4 lớp tại level: TPO bias → TPO zone / VWAP band → trạng thái EMA 9/34 → trigger orderflow (footprint, delta, CVD, DOM, tape). Không dùng ICT. Chi tiết nghiệp vụ: [05-nghiep-vu-trading.md](05-nghiep-vu-trading.md).

Giới hạn tài khoản: PropFirm, 2–3 lệnh / ngày, cửa sổ NY AM 9:30–11:30 ET.

## Nguyên tắc sản phẩm
- Tiếng Việt mặc định; tiếng Anh là bản phụ sinh tự động.
- Mọi con số thống kê truyền thống phải tự kiểm chứng bằng backtest. Khung Composite × pRTH × OVN là system chính nhưng chưa có backtest dài hạn: ghi kết quả từng phiên để kiểm tra theo thời gian.
- Không phải lời khuyên đầu tư.
- Dữ liệu thị trường từ Rithmic / CME chỉ dùng cá nhân, không công khai.

# CLAUDE.md · orderflow-trading-system

Đọc file này trước mọi việc trong repo. Bối cảnh đầy đủ nằm trong thư mục [`claude/`](claude/README.md).

## Repo này là gì
- Hiện tại: site tĩnh (HTML + CSS + vanilla JS) trên Vercel, học orderflow / TPO cho NQ intraday và lập trade plan mỗi ngày. Có một Vercel Function (`api/plan.js`) nối Supabase và Discord.
- Hướng đi: thành **web app cá nhân / dashboard** của Deren (đăng nhập, plan, economic calendar, options GEX/DEX/OI, heatmap, news, earnings...). Kế hoạch chuyển đổi: [`claude/07-chuyen-doi-web-app.md`](claude/07-chuyen-doi-web-app.md).
- Chủ repo: Deren, fullstack dev, trader NQ PropFirm (ATAS + Rithmic, NY AM 9:30–11:30 ET).

## Quy tắc bắt buộc
1. **Bí mật:** không commit token, Supabase key, Discord webhook URL, `PLAN_TOKEN`. Chỉ đặt trên Vercel Environment Variables. Secret key Supabase chỉ dùng phía server.
2. **Dữ liệu thị trường:** data Rithmic / CME chỉ dùng cá nhân. Không đưa CSV / nến thô lên GitHub hay trang công khai.
3. **Nội dung trading:** không đưa khái niệm ICT (FVG, PD array, OTE, ...). Hệ thống dùng TPO, VWAP, EMA 9/34, CVD, footprint, DOM, tape.
4. **Màu:** khi đưa mã màu cho ATAS, viết dạng ARGB `#AARRGGBB`. Chữ trong SVG phải đọc được trên nền tối.
5. **Ngôn ngữ:** trao đổi kỹ thuật bằng tiếng Việt, giữ thuật ngữ tiếng Anh. Web mặc định VI; bản EN sinh tự động.
6. **ATAS:** khi sửa indicator Plan Sender, không đổi tên trường JSON và không đổi thuật toán TPO / VA. Không đụng indicator / template ATAS khác.

## Cách làm việc hằng ngày
- Sửa trang VI (`x.html`, `assets/js/*.js`) → chạy `python3 i18n/build_en.py` → câu VI mới chưa có bản dịch thì thêm vào `i18n/en_extra.tsv` (`câu VI<TAB>câu EN`) rồi chạy lại.
- Đổi file JS / CSS thì tăng `?v=` trong thẻ `<script>` / `<link>` của các trang dùng nó (cache 1 giờ).
- Logic plan (HVN, bias, setup, vẽ ảnh) chỉ sửa ở `assets/js/plan-core.js`; file này chạy cả trình duyệt lẫn server.
- Push lên `main` là Vercel tự deploy production. Commit message tiếng Việt, ngắn, nói thay đổi gì.
- Artifact "Composite × pRTH × OVN Playbook" trên claude.ai là bản song song của trang Testing; đổi logic plan thì cập nhật cả hai.
- Sau mỗi thay đổi đáng kể: cập nhật [`claude/08-roadmap.md`](claude/08-roadmap.md) và [`claude/09-nhat-ky.md`](claude/09-nhat-ky.md).
- Khi Deren nhắn "liệt kê các việc còn lại": trả lời từ `claude/08-roadmap.md`.

## Kiểm tra nhanh
- Local: `python3 -m http.server 8000` (trang tĩnh). API cần Vercel (`vercel dev`) hoặc test trên production.
- Test API bằng `assets/sample_plan_20261112.json` (xem `docs/plan-sender/README.md`, Bước 3). Test xong nhớ xoá dòng mẫu trong `trade_plans` và ảnh trong Storage.

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
- Trade plan chính thức (từ 2026-11-17) là khung **Composite × pRTH × OVN** ở trang `plan.html` (Trade Plan). `/testing`, `/overlap` chỉ còn là redirect.
- Artifact "NQ Trade Plan · Composite × pRTH × OVN" trên claude.ai: nguồn ở `artifact/`, engine lấy từ `plan-core.js`. Đổi engine hoặc trang plan thì `node scripts/build-artifact.mjs` rồi publish lại artifact (xem `artifact/README.md`).
- Sau mỗi thay đổi đáng kể: cập nhật [`claude/08-roadmap.md`](claude/08-roadmap.md) và [`claude/09-nhat-ky.md`](claude/09-nhat-ky.md).
- Khi Deren nhắn "liệt kê các việc còn lại": trả lời từ `claude/08-roadmap.md`.

## Công cụ Claude Code (`.claude/`)
- Hook tự chạy: nạp bối cảnh đầu phiên, chặn force push / bí mật / CSV / sửa tay bản EN / thuật ngữ ICT, kiểm cú pháp và snapshot plan-core sau khi sửa, không cho kết thúc khi bản EN chưa sinh lại. Chi tiết: [`claude/10-claude-code.md`](claude/10-claude-code.md).
- Subagent: `i18n-sync`, `plan-engine`, `content-reviewer`, `backend-supabase`, `atas-indicator`, `docs-keeper`, `migration-architect`.
- Lệnh: `/viec-con-lai`, `/kiem-tra`, `/ship`.
- Chuyển sang web app: dùng [`claude/prompts/chuyen-doi-web-app.md`](claude/prompts/chuyen-doi-web-app.md).

## Kiểm tra nhanh
- Engine plan: `node scripts/check-plan-core.mjs` (snapshot `scripts/plan-core.snapshot.json`).
- Local: `python3 -m http.server 8000` (trang tĩnh). API cần Vercel (`vercel dev`) hoặc test trên production.
- Test API bằng `assets/sample_plan_20261112.json` (xem `docs/plan-sender/README.md`, Bước 3). Test xong nhớ xoá dòng mẫu trong `trade_plans` và ảnh trong Storage.

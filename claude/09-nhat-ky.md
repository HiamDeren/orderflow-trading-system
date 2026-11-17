# 09 · Nhật ký thay đổi

Ghi theo ngày, mới nhất ở trên. Chi tiết từng commit: `git log`.

## 2026-11-17 · Plan tự động và chuẩn bị chuyển web app
- Claude Code: `.claude/settings.json` + 5 hook Node, 7 subagent, 3 lệnh tắt; `scripts/check-plan-core.mjs` + snapshot; `claude/10-claude-code.md`, `claude/prompts/chuyen-doi-web-app.md`.
- Ghi bối cảnh dự án: `CLAUDE.md` + thư mục `claude/` (roadmap chuyển từ `docs/ROADMAP.md` sang `claude/08-roadmap.md`).
- Discord: biến `DISCORD_WEBHOOK_TRADE_PLAN` (vẫn nhận `DISCORD_WEBHOOK_URL`), avatar webhook. Test đầu-cuối web → Supabase → Storage → Discord thành công; xoá dòng test.
- Server tự vẽ ảnh plan tiếng Việt (resvg + font gói kèm), lưu Supabase Storage, gửi Discord; `GET /api/plan` trả link ảnh ký tạm; nút "Lấy plan mới nhất từ web" (`94cd84e`).
- Tách `plan-core.js` dùng chung trình duyệt và server.
- Đổi tên bảng `plans` → `trade_plans`; API nhận thêm tên biến key do tích hợp Supabase tạo.
- Ảnh plan: profile TPO pRTH và OVN đặt sát nhau, plan chữ bên phải, nút copy ảnh (bỏ tải SVG); nhãn "Prev RTH".
- Bỏ chương "Ví dụ 16/11"; Plan Builder nhập JSON từ indicator ATAS; `api/plan.js` lưu plan lên Supabase (`d6aebb4`).
- Thêm chương VWAP RTH; bỏ chương Màu ATAS trên web.
- Thay trang RTH × OVN Overlap bằng **Composite × pRTH × OVN** (`testing.html`; `/overlap` chuyển hướng về `/testing`).
- Ngoài repo: Supabase project và bucket, biến môi trường Vercel, artifact "Composite × pRTH × OVN Playbook" làm lại theo hướng composite.

## 2026-11-12 · Testing plan đầu tiên
- Thêm trang RTH × OVN Overlap, thêm lớp day type RTH hôm qua.
- Backtest 47 phiên: overlap chưa có edge; open type + EMA cho nhiều thông tin hơn (xem [05](05-nghiep-vu-trading.md#kết-luận-backtest-để-không-lặp-lại)).

## 2026-11-09 → 11-10 · Mở rộng nội dung
- Chương EMA 9/34 trong khoá TPO Level, viết lại không dùng ICT.
- Chương Tape: ba lần quét, ma trận kiểm soát, 7 pattern.

## 2026-11-05 · Khởi tạo site
- Gộp hai artifact Orderflow Tools Playbook và TPO Level Playbook thành website học tập (Vercel).
- Bản tiếng Anh tự sinh, đồng hồ phiên realtime theo giờ VN, chương Initial Balance.
- Plan Builder tách thành `plan.html`, vẽ bản đồ level, copy ảnh.
- Giao diện tối toàn site.

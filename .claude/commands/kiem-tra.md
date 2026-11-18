---
description: Chạy toàn bộ kiểm tra của repo trước khi commit
---
Chạy lần lượt ở gốc repo và báo kết quả ngắn gọn (tiếng Việt):
1. `pnpm build` (Next.js: build + kiểm TypeScript cho `apps/web`).
1. `node --check` cho mọi file `apps/web/public/assets/js/*.js`, `apps/web/public/assets/js/en/*.js`, `scripts/*.mjs`, `.claude/hooks/*.mjs`.
2. `node scripts/check-plan-core.mjs`.
3. `python3 i18n/build_en.py`: báo câu VI chưa có bản dịch (nếu có thì gọi subagent i18n-sync).
4. `git status --short` và kiểm `?v=` của các file JS/CSS vừa đổi đã tăng trong mọi trang dùng chúng.
5. Gọi subagent content-reviewer cho phần nội dung đã đổi (nếu có thay đổi ở `*.html` hoặc `apps/web/public/assets/js/`).
Không commit. Liệt kê việc cần sửa nếu có.

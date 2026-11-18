---
description: Kiểm tra, cập nhật tài liệu, commit và push development (Vercel preview); mở PR sang production khi Deren duyệt
argument-hint: [mô tả ngắn thay đổi]
---
Thay đổi: $ARGUMENTS

1. Chạy các bước của lệnh /kiem-tra; có lỗi thì dừng và báo.
2. Gọi subagent docs-keeper cập nhật `claude/09-nhat-ky.md`, `claude/08-roadmap.md` và file `claude/` liên quan.
3. `git add` đúng các file liên quan (không `.env*`, không CSV, không `settings.local.json`).
4. Commit message tiếng Việt, ngắn, nói thay đổi gì.
5. `git push origin development` (không force; không push thẳng `production`). Muốn lên production: mở PR `development` → `production` và chờ Deren duyệt. Báo commit hash; nhắc Deren kiểm bản deploy trên Vercel là Ready, và nếu đổi API thì test bằng `apps/web/public/assets/sample_plan_20261112.json`.

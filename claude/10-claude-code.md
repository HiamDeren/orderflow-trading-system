# 10 · Công cụ Claude Code của repo

Thư mục `.claude/` được commit cùng repo, nên mở Claude Code ở gốc repo là có ngay hook, subagent và lệnh tắt. Yêu cầu máy: Node.js (≥ 18), Python 3, Git (trên Windows, Claude Code chạy hook qua Git Bash).

## Hook (`.claude/settings.json`, script ở `.claude/hooks/`)
| Sự kiện | Script | Làm gì |
|---|---|---|
| SessionStart (startup, resume, clear, compact) | `session-start.mjs` | Đưa vào đầu phiên: nhánh, 5 commit gần nhất, số file chưa commit, 5 việc đầu roadmap, nhắc quy tắc, danh sách subagent |
| PreToolUse · Bash | `guard-bash.mjs` | Chặn force push; chặn `rm -r` vào gốc repo / thư mục chính; khi `git commit` thì quét phần sắp commit: chặn `.env*`, `*.csv`, `settings.local.json`, và chuỗi giống secret key / JWT / webhook Discord / giá trị biến bí mật |
| PreToolUse · Write/Edit/MultiEdit | `guard-write.mjs` | Chặn sửa tay bản EN sinh tự động (`*.en.html`, `apps/web/public/assets/js/en/`); chặn ghi `.env*`, file data `*.csv`; chặn nội dung chứa bí mật; chặn thuật ngữ ICT trong nội dung site (`*.html`, `apps/web/public/assets/js/`) |
| PostToolUse · Write/Edit/MultiEdit | `after-edit.mjs` | `node --check` file JS vừa sửa; sửa `plan-core.js` thì chạy `scripts/check-plan-core.mjs` (khác snapshot → báo Claude); sửa `PlanSender.cs` thì kiểm còn đủ trường JSON v1; nhắc (mỗi loại một lần / phiên): chạy build EN, tăng `?v=`, cập nhật artifact, cập nhật `claude/` |
| Stop | `stop-check.mjs` | Không cho kết thúc lượt khi đã sửa bản VI mà bản EN tương ứng chưa sinh lại (nhắc một lần mỗi lượt) |

Hàm dùng chung: `.claude/hooks/_lib.mjs` (đọc stdin, đường dẫn tương đối, mẫu bí mật, mẫu ICT). Exit 2 = chặn / báo Claude, exit 0 = cho qua.

`permissions.deny` trong `settings.json`: không đọc `.env*`, `.vercel/**`; không `git push --force` / `-f`.

Cài đặt riêng từng máy (không commit): `.claude/settings.local.json`.

### Thử hook bằng tay
```bash
export CLAUDE_PROJECT_DIR=$PWD
echo '{"tool_input":{"command":"git push --force origin production"}}' | node .claude/hooks/guard-bash.mjs; echo $?   # 2
echo '{"tool_input":{"file_path":"apps/web/public/assets/js/en/core.js","content":"x"}}' | node .claude/hooks/guard-write.mjs; echo $?   # 2
echo '{"source":"startup"}' | node .claude/hooks/session-start.mjs
```
Trong Claude Code: lệnh `/hooks` xem hook đang nạp. Sửa `settings.json` thì mở phiên mới để có hiệu lực.

## Subagent (`.claude/agents/`)
| Tên | Dùng khi | Quyền |
|---|---|---|
| `i18n-sync` | Sau khi sửa bản VI: chạy `build_en.py`, thêm bản dịch vào `en_extra.tsv` | sửa |
| `plan-engine` | Đổi luật plan, ảnh plan, port `plan-core` sang TypeScript | sửa |
| `content-reviewer` | Duyệt nội dung trading trước khi commit (không ICT, đúng luật, màu ARGB, chữ đọc được trên nền tối) | chỉ đọc |
| `backend-supabase` | `api/`, Supabase (bảng, RLS, Storage), Discord, biến môi trường | sửa |
| `atas-indicator` | Build / sửa indicator `PlanSender.cs`, kiểm số 11/11, 12/11 | sửa |
| `docs-keeper` | Cập nhật `claude/` sau thay đổi; "liệt kê các việc còn lại" | sửa |
| `migration-architect` | Lập kế hoạch và làm từng giai đoạn chuyển sang web app | sửa |

Gọi trực tiếp: "dùng subagent plan-engine để ...". Claude cũng tự chọn theo phần `description` của từng file.

## Lệnh tắt (`.claude/commands/`)
| Lệnh | Làm gì |
|---|---|
| `/viec-con-lai` | Liệt kê việc còn lại từ `claude/08-roadmap.md` |
| `/kiem-tra` | `node --check` toàn bộ JS, snapshot plan-core, build EN, kiểm `?v=`, duyệt nội dung |
| `/ship <mô tả>` | Kiểm tra → cập nhật `claude/` → commit → push `development` (PR sang `production` khi Deren duyệt) |

## Script kiểm tra
- `node scripts/check-plan-core.mjs` (hoặc `npm run check`): chạy `plan-core` trên payload mẫu, so `summary`, vùng HVN và plan chữ với `scripts/plan-core.snapshot.json`. Đổi luật cố ý thì `--update`.
- Khi port sang TypeScript, bản mới phải cho ra đúng snapshot này.
- `node scripts/build-artifact.mjs`: ghép `plan-core.js` + `artifact/app.src.js` thành `artifact/app.js` để publish artifact.

## Prompt chuyển đổi web app
[`prompts/chuyen-doi-web-app.md`](prompts/chuyen-doi-web-app.md): prompt khởi động + prompt từng giai đoạn + prompt nghiệm thu.

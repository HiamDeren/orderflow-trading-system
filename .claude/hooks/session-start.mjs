// SessionStart: đưa bối cảnh ngắn của repo vào đầu phiên Claude Code.
import fs from "fs";
import path from "path";
import { ROOT, readInput, git } from "./_lib.mjs";

readInput();
const L = [];
L.push("# ZenDojo · bối cảnh phiên");
L.push("Đọc CLAUDE.md (quy tắc bắt buộc). Bối cảnh đầy đủ: claude/README.md. Trao đổi bằng tiếng Việt.");
const branch = git("rev-parse --abbrev-ref HEAD");
if (branch) {
  L.push(`Nhánh: ${branch}. Làm việc trên development (preview); production chỉ nhận merge qua PR khi Deren duyệt.`);
  const log = git("log -5 --format=%h·%ad·%s --date=short");
  if (log) L.push("Commit gần nhất:\n" + log.split("\n").map(s => "  " + s).join("\n"));
  const st = git("status --porcelain");
  if (st) L.push(`Đang có ${st.split("\n").length} file chưa commit.`);
}
try {
  const rm = fs.readFileSync(path.join(ROOT, "claude/08-roadmap.md"), "utf8");
  const open = rm.split("\n").filter(l => /^\s*(\d+\.|-)\s*\[ \]/.test(l)).map(l => l.replace(/^\s*(\d+\.|-)\s*\[ \]\s*/, "").replace(/\*\*/g, ""));
  if (open.length) {
    L.push(`Roadmap còn ${open.length} việc (claude/08-roadmap.md). 5 việc đầu:`);
    open.slice(0, 5).forEach(t => L.push("  - " + (t.length > 140 ? t.slice(0, 137) + "..." : t)));
  }
} catch {}
L.push("Nhắc nhanh: không commit bí mật / CSV data; không dùng ICT; màu ATAS dạng #AARRGGBB; sửa bản VI rồi chạy python3 i18n/build_en.py; logic plan chỉ ở assets/js/plan-core.js (kiểm bằng node scripts/check-plan-core.mjs).");
L.push("Subagent của repo: .claude/agents/ (i18n-sync, plan-engine, content-reviewer, backend-supabase, atas-indicator, docs-keeper, migration-architect).");
process.stdout.write(L.join("\n") + "\n");

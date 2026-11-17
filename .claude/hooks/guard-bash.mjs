// PreToolUse (Bash): chặn lệnh nguy hiểm và commit có bí mật / data.
import { readInput, git, block, findSecret } from "./_lib.mjs";

const input = readInput();
const cmd = String((input.tool_input && input.tool_input.command) || "");
if (!cmd) process.exit(0);

// 1. Push ép buộc
if (/\bgit\s+push\b/.test(cmd) && /(\s--force(-with-lease)?\b|\s-f\b|\s\+\S+)/.test(cmd)) {
  block("Bị chặn: không force push (main tự deploy production). Tạo commit sửa thay vì ghi đè lịch sử.");
}
// 2. Xoá hàng loạt ở gốc repo / thư mục chính
if (/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*|--recursive)\b/.test(cmd) &&
    /(\s|^)(\.\/?|\*|\/|~|\.\.|assets|api|claude|docs|i18n|scripts|\.claude|\.git)\/?(\s|$|;|&)/.test(cmd)) {
  block("Bị chặn: lệnh rm -r nhắm vào gốc repo hoặc thư mục chính. Xoá từng file cụ thể, hoặc nhờ Deren tự xoá.");
}
// 3. git add -A / commit: kiểm file và nội dung sắp commit
if (/\bgit\s+commit\b/.test(cmd)) {
  // file sẽ vào commit: đã stage + (nếu dùng -a/-am) file đã theo dõi đang sửa
  let files = git("diff --cached --name-only").split("\n").filter(Boolean);
  let diff = git("diff --cached -U0");
  if (/\s-[a-zA-Z]*a/.test(cmd)) {
    files = files.concat(git("diff --name-only").split("\n").filter(Boolean));
    diff += "\n" + git("diff -U0");
  }
  const badFile = files.find(f => /(^|\/)\.env(\.|$)/.test(f) || /\.(csv|scid|ticks)$/i.test(f) || /(^|\/)settings\.local\.json$/.test(f));
  if (badFile) block(`Bị chặn: "${badFile}" không được commit (bí mật hoặc data Rithmic/CME chỉ dùng cá nhân). Bỏ khỏi stage: git restore --staged "${badFile}".`);
  const added = diff.split("\n").filter(l => l.startsWith("+") && !l.startsWith("+++")).join("\n");
  const s = findSecret(added);
  if (s) block(`Bị chặn: phần sắp commit có ${s}. Xoá giá trị đó khỏi file, đặt trên Vercel Environment Variables, rồi commit lại.`);
}
process.exit(0);

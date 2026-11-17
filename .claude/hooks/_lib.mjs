// Hàm dùng chung cho các hook Claude Code của repo.
// Hook đọc JSON từ stdin. exit 0 = cho qua, exit 2 = chặn / báo Claude (stderr là lý do).
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";

export const ROOT = path.resolve(process.env.CLAUDE_PROJECT_DIR || path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", ".."));

export function readInput() {
  try { const s = fs.readFileSync(0, "utf8"); return s.trim() ? JSON.parse(s) : {}; } catch { return {}; }
}

// Đường dẫn tương đối so với gốc repo, dùng dấu "/" (chạy được cả Windows).
export function rel(p) {
  if (!p) return "";
  const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
  return path.relative(ROOT, abs).split(path.sep).join("/");
}

export function git(args) {
  try { return execSync("git " + args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trimEnd(); }
  catch { return ""; }
}

export function block(msg) { process.stderr.write(msg.trim() + "\n"); process.exit(2); }

// Thêm ngữ cảnh cho Claude mà không chặn (PostToolUse / UserPromptSubmit).
export function addContext(event, text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
  process.exit(0);
}

// Nhắc một lần mỗi phiên cho mỗi loại, tránh lặp ở mọi lần sửa file.
export function firstTime(input, key) {
  const id = String(input.session_id || "nosession").replace(/[^A-Za-z0-9_-]/g, "");
  const f = path.join(os.tmpdir(), `ofs-hook-${id}-${key}`);
  if (fs.existsSync(f)) return false;
  try { fs.writeFileSync(f, "1"); } catch {}
  return true;
}

// Mẫu bí mật không được commit / ghi vào file.
export const SECRET_PATTERNS = [
  [/sb_secret_[A-Za-z0-9_-]{10,}/, "Supabase secret key (sb_secret_...)"],
  [/sb_publishable_[A-Za-z0-9_-]{10,}/, "Supabase publishable key"],
  [/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "JWT (service_role / anon key cũ)"],
  [/discord(?:app)?\.com\/api\/webhooks\/\d{5,}\/[A-Za-z0-9_-]{20,}/, "Discord webhook URL"],
  [/\b(PLAN_TOKEN|SUPABASE_SERVICE_KEY|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|DISCORD_WEBHOOK_[A-Z_]+)\s*[=:]\s*["']?(?!env\.|process\.env|\$|\{|<)[A-Za-z0-9_\-./:]{16,}/, "giá trị biến môi trường bí mật"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
];
export function findSecret(text) {
  if (!text) return null;
  for (const [re, name] of SECRET_PATTERNS) if (re.test(text)) return name;
  return null;
}

// Thuật ngữ ICT không được đưa vào nội dung trading (CLAUDE.md quy tắc 3).
export const ICT_RE = /\bFVG\b|fair value gap|\border ?blocks?\b|\bOTE\b|\bPD arrays?\b|\bSIBI\b|\bBISI\b|breaker block|silver bullet|judas swing|\bkill ?zones?\b|\bICT\b|draw on liquidity/i;

// File sinh tự động từ bản VI.
export const isGeneratedEn = r => r.startsWith("assets/js/en/") || /\.en\.html$/.test(r);
// Nội dung trading hiển thị cho người học (kiểm ICT).
export const isContent = r => /\.html$/.test(r) || (r.startsWith("assets/js/") && r.endsWith(".js"));

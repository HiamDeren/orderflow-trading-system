// PreToolUse (Write|Edit|MultiEdit): chặn sửa file sinh tự động, file bí mật / data, và nội dung vi phạm quy tắc.
import { readInput, rel, block, findSecret, ICT_RE, isGeneratedEn, isContent } from "./_lib.mjs";

const input = readInput();
const ti = input.tool_input || {};
const r = rel(ti.file_path || ti.path || "");
if (!r || r.startsWith("..")) process.exit(0); // ngoài repo: không can thiệp

const texts = [ti.content, ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map(e => e && e.new_string) : [])].filter(Boolean).join("\n");

if (isGeneratedEn(r)) {
  block(`Bị chặn: ${r} là bản EN sinh tự động. Sửa bản VI tương ứng rồi chạy: python3 i18n/build_en.py (câu mới chưa dịch thì thêm vào i18n/en_extra.tsv dạng "câu VI<TAB>câu EN").`);
}
if (/(^|\/)\.env(\.|$)/.test(r)) block(`Bị chặn: không ghi file ${r}. Bí mật đặt trên Vercel Environment Variables.`);
if (/\.(csv|scid|ticks)$/i.test(r)) block(`Bị chặn: không lưu data thị trường (${r}) trong repo. Data Rithmic/CME chỉ dùng cá nhân, để ngoài repo.`);

const s = findSecret(texts);
if (s) block(`Bị chặn: nội dung ghi vào ${r} có ${s}. Dùng biến môi trường (process.env...) thay vì dán giá trị.`);

if (isContent(r) && ICT_RE.test(texts)) {
  const m = texts.match(ICT_RE)[0];
  block(`Bị chặn: "${m}" là khái niệm ICT, hệ thống không dùng (CLAUDE.md quy tắc 3). Viết lại bằng TPO / VWAP / EMA 9/34 / CVD / footprint / DOM / tape.`);
}
process.exit(0);

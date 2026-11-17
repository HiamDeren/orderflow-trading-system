// Stop: không cho kết thúc khi bản EN chưa sinh lại sau khi sửa bản VI.
import fs from "fs";
import path from "path";
import { ROOT, readInput, git, block } from "./_lib.mjs";

const input = readInput();
if (input.stop_hook_active) process.exit(0); // đã nhắc một lần trong lượt này

const changed = new Set(
  git("status --porcelain").split("\n").filter(Boolean).map(l => l.slice(3).replace(/^"|"$/g, "").split(" -> ").pop())
);
if (!changed.size) process.exit(0);

const stale = [];
for (const f of changed) {
  let en = null;
  if (/^[^/]+\.html$/.test(f) && !/\.en\.html$/.test(f)) en = f.replace(/\.html$/, ".en.html");
  else if (/^assets\/js\/[^/]+\.js$/.test(f)) en = "assets/js/en/" + path.basename(f);
  if (en && fs.existsSync(path.join(ROOT, en)) && !changed.has(en)) stale.push(`${f} → ${en}`);
}
if (stale.length) {
  block(`Bản EN có thể chưa cập nhật:\n${stale.map(s => "  " + s).join("\n")}\nChạy python3 i18n/build_en.py (câu chưa dịch → i18n/en_extra.tsv), hoặc gọi subagent i18n-sync. Nếu thay đổi không ảnh hưởng bản EN thì nói rõ rồi kết thúc.`);
}
process.exit(0);

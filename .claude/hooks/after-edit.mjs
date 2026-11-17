// PostToolUse (Write|Edit|MultiEdit): kiểm cú pháp, chạy hồi quy plan-core, nhắc các bước bắt buộc.
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { ROOT, readInput, rel, block, addContext, firstTime } from "./_lib.mjs";

const input = readInput();
const ti = input.tool_input || {};
const r = rel(ti.file_path || ti.path || "");
if (!r || r.startsWith("..")) process.exit(0);
const abs = path.join(ROOT, r);
const notes = [];

function run(cmd) {
  try { return { ok: true, out: execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) }; }
  catch (e) { return { ok: false, out: String(e.stdout || "") + String(e.stderr || "") }; }
}

// 1. Cú pháp JS
if (/\.(m?js)$/.test(r) && fs.existsSync(abs)) {
  const c = run(`node --check "${abs}"`);
  if (!c.ok) block(`Lỗi cú pháp trong ${r}:\n${c.out.trim().split("\n").slice(0, 8).join("\n")}`);
}

// 2. Engine plan
if (r === "assets/js/plan-core.js") {
  const c = run("node scripts/check-plan-core.mjs");
  if (!c.ok) block(`plan-core khác snapshot sau khi sửa:\n${c.out.trim().split("\n").slice(0, 14).join("\n")}\nNếu đổi luật / chữ là cố ý: chạy node scripts/check-plan-core.mjs --update và ghi lý do vào claude/09-nhat-ky.md.`);
  if (firstTime(input, "plancore")) notes.push("plan-core.js đổi: tăng ?v= của plan-core.js trong plan.html, chạy build_en, build lại artifact (node scripts/build-artifact.mjs) rồi publish, cập nhật claude/05-nghiep-vu-trading.md nếu luật đổi. Ảnh server (api/plan.js) dùng chung file này.");
}

// 3. API
if (r.startsWith("api/") && /\.js$/.test(r) && firstTime(input, "api")) {
  notes.push("API đổi: giữ đúng hợp đồng /api/plan + JSON v1 (claude/04-du-lieu-api.md). Sau deploy test bằng assets/sample_plan_20261112.json rồi xoá dòng test + ảnh test.");
}

// 4. Indicator ATAS: tên trường JSON phải còn đủ
if (r === "docs/plan-sender/PlanSender.cs" && fs.existsSync(abs)) {
  const src = fs.readFileSync(abs, "utf8");
  const KEYS = ["v","source","trigger","symbol","date","ts_et","price","tick","row","prth","ovn","sessions","composite","warnings","vah","val","poc","high","low","close","periods","periods_hl","onh","onl","days","type"];
  const miss = KEYS.filter(k => !src.includes(`\\"${k}\\"`));
  if (miss.length) block(`PlanSender.cs thiếu trường JSON: ${miss.join(", ")}. Không đổi tên trường JSON v1 (web và API đọc theo đúng tên này).`);
  if (firstTime(input, "atas")) notes.push("PlanSender.cs: không đổi thuật toán TPO / VA; build lại rồi kiểm số với bảng 11/11 và 12/11 trong claude/04-du-lieu-api.md.");
}

// 5. Nội dung VI và tài nguyên tĩnh
const viSource = (/\.html$/.test(r) && !/\.en\.html$/.test(r)) || (/^assets\/js\/[^/]+\.js$/.test(r));
if (viSource && firstTime(input, "i18n")) notes.push("Đã sửa bản VI: trước khi xong, chạy python3 i18n/build_en.py (câu chưa dịch → i18n/en_extra.tsv) và tăng ?v= của file JS/CSS vừa đổi ở mọi trang dùng nó.");
if (/^assets\/css\//.test(r) && firstTime(input, "css")) notes.push("CSS đổi: tăng ?v= ở thẻ <link> của các trang dùng file này (cache /assets 1 giờ).");

// 6. Nhật ký
const docOnly = r.startsWith("claude/") || r === "CLAUDE.md" || r.startsWith(".claude/");
if (!docOnly && firstTime(input, "docs")) notes.push("Thay đổi đáng kể thì cập nhật claude/08-roadmap.md và claude/09-nhat-ky.md (subagent docs-keeper làm được).");

if (notes.length) addContext("PostToolUse", notes.join("\n"));
process.exit(0);

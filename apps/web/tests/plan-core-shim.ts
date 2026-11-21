// Chỉ dùng trong Vitest: nạp plan-core.js (UMD) bằng require, như Node / route handler.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export default require("../public/assets/js/plan-core.js");

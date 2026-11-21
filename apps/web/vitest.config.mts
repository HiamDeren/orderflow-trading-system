// Vitest cho apps/web: test hàm thuần (plan-core, journal, econ, time). Không gọi mạng, không cần biến môi trường.
import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: [
      // plan-core.js là UMD (CommonJS khi chạy Node): nạp qua require để giống hệt server /api/plan
      { find: /^.*\/public\/assets\/js\/plan-core\.js$/, replacement: path.join(root, "tests/plan-core-shim.ts") },
      { find: /^@\//, replacement: root + "/" },
    ],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});

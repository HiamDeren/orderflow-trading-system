# artifact/ · nguồn artifact claude.ai

Artifact **"NQ Trade Plan · Composite × pRTH × OVN"**: https://claude.ai/artifact/JP2oqaEdXQrCG9bCPjaQ1x (slug `8cbed587-6959-483d-a389-64da7c4149bb`).

Bản song song của trang web `plan.html`, thêm 3 tab chỉ có ở artifact: **06 Log phiên** (localStorage `cb-log`, copy CSV), **07 Màu ATAS** (ARGB), **09 Lưu trữ** (backtest khung cũ RTH × OVN overlap).

| File | Vai trò |
|---|---|
| `index.html` | Trang + CSS (sửa trực tiếp) |
| `app.src.js` | UI của artifact (tab, builder, log, màu, quiz). Engine **không** viết ở đây |
| `va_lines.txt` | VA mẫu cho công cụ HVN (thay `"__VA_LINES__"`) |
| `app.js` | File build, **không sửa tay**: `node scripts/build-artifact.mjs` |

Engine plan (HVN, bias, setup, vẽ ảnh) lấy từ `assets/js/plan-core.js`, cùng code với web và `/api/plan`. Đổi engine thì build lại artifact và publish `index.html` + `app.js`.

Khoá localStorage riêng của artifact: `cb-builder`, `cb-builder-json`, `cb-log`, `cb-hvn` (khác origin với web nên không dùng chung).

Không deploy lên Vercel (`.vercelignore`).

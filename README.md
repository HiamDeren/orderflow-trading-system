# Orderflow Trading System

Website học tập gộp hai playbook **Orderflow Tools** và **TPO Level Playbook** cho NQ intraday (ATAS · Rithmic), tối ưu cho cả desktop lẫn điện thoại.

## Nội dung

| Trang | Mô tả |
|---|---|
| `index.html` | Tổng quan: tiếp tục học, hệ thống 4 lớp, tiến độ 2 khoá, thống kê trắc nghiệm, sao lưu tiến độ |
| `tools.html` | Khoá 1 · Orderflow Tools: DOM, Tape, Footprint, Delta & CVD, 13 kịch bản, kết hợp tại level, thuật ngữ |
| `levels.html` | Khoá 2 · TPO Level Playbook: lộ trình 9 tuần, TPO, day/open types, level map, VWAP RTH, CVD, Plan Builder, case study |
| `quiz.html` | Trung tâm trắc nghiệm: luyện tập, thi thử, ôn câu sai |

**Ngân hàng câu hỏi: 180 câu, giữ nguyên văn** — 87 câu Orderflow Tools (`assets/js/bank-tools.js`, id `T001…T087`) và 93 câu TPO Level (`assets/js/bank-levels.js`, id `L001…L093`).

- Mỗi chương có bài kiểm tra nhanh theo đúng module.
- Thi thử: đề Tools 50 câu, đề Level 50 câu, đề tổng 100 câu (50 + 50), rút ngẫu nhiên giữ tỉ lệ theo chương. Qua bài khi đạt ≥ 80% ba lần liên tiếp.
- Câu sai được gom lại để ôn; trả lời đúng thì tự rời danh sách.

Tiến độ lưu `localStorage` theo từng trình duyệt. Dùng mục **Sao lưu & khôi phục** ở trang Tổng quan để chuyển tiến độ giữa các thiết bị.

## Song ngữ VI / EN

Nút **VI | EN** trên thanh trên cùng. Bản tiếng Việt là `x.html`, bản tiếng Anh là `x.en.html` (JS ở `assets/js/en/`). Lựa chọn ngôn ngữ được nhớ; tiến độ dùng chung cho cả hai bản.

Bản EN được sinh tự động từ bản VI: sửa nội dung tiếng Việt rồi chạy `python3 i18n/build_en.py`. Script báo các câu tiếng Việt mới chưa có bản dịch — thêm chúng vào `i18n/en_extra.tsv` (`câu VI<TAB>câu EN`) rồi chạy lại.

## Cấu trúc

```
assets/css/app.css        design system + shell + quiz engine
assets/css/tools.css      style component khoá Tools (scope .pg-tools)
assets/css/levels.css     style component khoá Level (scope .pg-levels)
assets/js/core.js         sidebar, topbar, bottom nav, router chương, đồng hồ phiên realtime, nút VI/EN
assets/js/quiz.js         quiz engine (luyện tập / thi thử / ôn câu sai)
assets/js/fp.js           renderer footprint kiểu cluster ATAS, DOM/Tape helpers, 13 kịch bản
assets/js/tools-page.js   hình minh hoạ khoá Tools
assets/js/levels-data.js  dữ liệu khoá Level
assets/js/levels-page.js  widget khoá Level (TPO profile, Plan Builder, …)
assets/js/home.js         trang tổng quan
```

## Chạy & deploy

Site tĩnh, không cần build.

- Local: `python3 -m http.server` rồi mở `http://localhost:8000`.
- Vercel: Import repo → Framework Preset **Other** → Build Command để trống → Output Directory để trống (root). `vercel.json` đã bật `cleanUrls`.

Không phải lời khuyên đầu tư. Các con số thống kê truyền thống cần tự kiểm chứng bằng backtest.

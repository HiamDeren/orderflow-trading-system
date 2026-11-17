# claude/ · bộ nhớ dự án

Thư mục này gom toàn bộ bối cảnh của repo để bất kỳ phiên Claude nào (hoặc người mới) đọc là nắm được: đã làm gì, chạy thế nào, vì sao chọn vậy, và chuyển sang web app ra sao.

Không deploy lên site (đã chặn trong `.vercelignore`). Không chứa bí mật.

## Thứ tự đọc

| File | Nội dung | Khi nào đọc |
|---|---|---|
| [01-tong-quan.md](01-tong-quan.md) | Mục tiêu, hiện trạng, người dùng, nguyên tắc | Luôn đọc đầu tiên |
| [02-kien-truc.md](02-kien-truc.md) | Stack, sơ đồ, cấu trúc thư mục, build, deploy, i18n | Trước khi sửa code |
| [03-tinh-nang.md](03-tinh-nang.md) | Danh mục từng trang, chương, widget, khoá localStorage | Khi port tính năng |
| [04-du-lieu-api.md](04-du-lieu-api.md) | Supabase, Storage, `/api/plan`, JSON từ ATAS, Discord, biến môi trường | Khi đụng backend / dữ liệu |
| [05-nghiep-vu-trading.md](05-nghiep-vu-trading.md) | Thuật ngữ, engine plan (HVN, bias, setup), bảng màu | Khi đụng logic trading |
| [06-quyet-dinh.md](06-quyet-dinh.md) | Các quyết định kỹ thuật và lý do | Trước khi đổi hướng một thứ đã chốt |
| [07-chuyen-doi-web-app.md](07-chuyen-doi-web-app.md) | Kế hoạch chuyển site tĩnh → web app dashboard | Khi bắt đầu chuyển đổi |
| [08-roadmap.md](08-roadmap.md) | Việc còn lại, ý tưởng | "Liệt kê các việc còn lại" |
| [09-nhat-ky.md](09-nhat-ky.md) | Nhật ký thay đổi theo ngày | Muốn biết cái gì đổi khi nào |

Tài liệu khác trong repo:
- `CLAUDE.md` (gốc repo): quy tắc ngắn gọn bắt buộc.
- `docs/plan-sender/`: indicator ATAS Plan Sender (C#), prompt build, SQL Supabase, hướng dẫn setup từng bước.

## Quy ước giữ thư mục này
- Mỗi lần thêm / đổi tính năng: sửa file liên quan ở đây trong cùng commit.
- Ghi sự thật đang chạy, không ghi ý định như thể đã xong. Việc chưa làm để ở `08-roadmap.md`.
- Ngày tháng viết dạng `YYYY-MM-DD`. Giờ phiên viết theo ET.

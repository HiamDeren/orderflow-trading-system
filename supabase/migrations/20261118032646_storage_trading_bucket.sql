-- 20261118032646 · storage_trading_bucket
-- Bucket chung cho nghiệp vụ trading (khớp schema trading). Đường dẫn: YYYY/MM/DD/<loại>/<file>, loại = plan | journal
-- (journal gồm cả ảnh chụp lệnh lẫn recap cuối phiên). Private, không policy: chỉ secret key (server) đọc ghi.
-- Bucket cũ trade-plans (trống) xoá bằng Dashboard / Storage API (SQL không được xoá bảng storage).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trading', 'trading', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

comment on column trading.trade_plans.image_path is 'Đường dẫn ảnh plan trong bucket trading: YYYY/MM/DD/plan/plan_<date>_<symbol>.png';

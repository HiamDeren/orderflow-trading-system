-- Schema Supabase cho trade plan (indicator "Deren · Plan Sender" → /api/plan).
-- Bản hiện hành (2026-11-17, migration trade_plans_recreate_ordered_no_price).
-- Chạy trong Supabase: SQL Editor → New query → dán → Run. LƯU Ý: drop table xoá toàn bộ plan đã lưu.

-- ---------- Hàm tự cập nhật updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Bảng trade_plans ----------
-- Thứ tự cột: khoá + thời gian → định danh plan → kết quả server tính → dữ liệu gốc từ ATAS.
drop table if exists public.trade_plans;

create table public.trade_plans (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),   -- lần gửi đầu tiên của ngày
  updated_at  timestamptz not null default now(),   -- lần gửi gần nhất (trigger)
  trade_date  date        not null,                 -- ngày phiên trade (ET)
  symbol      text        not null default 'NQ',    -- ví dụ NQZ6
  summary     jsonb,                                -- bias, conf, setup, target, flip, price (9:29 ET), zone...
  plan_text   text,                                 -- plan dạng chữ (giống khối chữ trên ảnh)
  image_path  text,                                 -- đường dẫn ảnh trong bucket trade-plans
  payload     jsonb       not null,                 -- JSON v1 nguyên bản từ indicator (có price)
  constraint trade_plans_trade_date_symbol_key unique (trade_date, symbol)
);

comment on table  public.trade_plans is 'Trade plan mỗi ngày (khung Composite × pRTH × OVN). Một dòng / ngày / symbol; gửi lại cùng ngày thì ghi đè. Chỉ server (secret key) đọc ghi.';
comment on column public.trade_plans.id         is 'Khoá tự tăng';
comment on column public.trade_plans.created_at is 'Lần gửi đầu tiên của ngày đó';
comment on column public.trade_plans.updated_at is 'Lần gửi gần nhất (trigger trade_plans_touch)';
comment on column public.trade_plans.trade_date is 'Ngày phiên trade (giờ ET), ví dụ 2026-11-17';
comment on column public.trade_plans.symbol     is 'Mã hợp đồng, ví dụ NQZ6';
comment on column public.trade_plans.summary    is 'Tóm tắt plan do server tính: bias, conf, setup, target, flip, price (giá 9:29 ET), zone...';
comment on column public.trade_plans.plan_text  is 'Plan dạng chữ (giống khối chữ trên ảnh plan)';
comment on column public.trade_plans.image_path is 'Đường dẫn ảnh plan trong bucket trade-plans (YYYY/MM/plan_<date>_<symbol>.png)';
comment on column public.trade_plans.payload    is 'JSON v1 nguyên bản từ indicator ATAS Plan Sender (có price, prth, ovn, sessions, composite)';

-- RLS bật, KHÔNG có policy; anon / authenticated không có quyền gì. Chỉ secret key (service_role, dùng trong Vercel) đọc ghi.
alter table public.trade_plans enable row level security;
revoke all on table public.trade_plans from anon, authenticated;
grant select, insert, update, delete on table public.trade_plans to service_role;

create trigger trade_plans_touch before update on public.trade_plans
for each row execute function public.touch_updated_at();

-- ---------- Storage: ảnh plan ----------
-- Bucket private, chỉ PNG, tối đa 5 MB. Không tạo policy: chỉ secret key (Vercel) đọc / ghi.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-plans', 'trade-plans', false, 5242880, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

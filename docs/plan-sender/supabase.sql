-- Schema Supabase cho trade plan (indicator "Deren · Plan Sender" → /api/plan).
-- Bản hiện hành (2026-11-18, project Singapore ap-southeast-1, migration trading_schema_trade_plans).
-- Mỗi nghiệp vụ một schema riêng, không dùng public: trading (plan, sau này journal / recap), util (hàm dùng chung).
-- Chạy trong Supabase: SQL Editor → New query → dán → Run (trên project trống).
-- Sau đó: Project Settings → Data API → Exposed schemas → thêm "trading" (util KHÔNG expose).

-- ---------- util: hàm dùng chung, không expose qua Data API ----------
create schema if not exists util;
revoke all on schema util from public, anon, authenticated;
grant usage on schema util to service_role;

create or replace function util.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;
revoke execute on function util.touch_updated_at() from public, anon, authenticated;

-- ---------- trading: chỉ server (secret key / service_role) đọc ghi ----------
create schema if not exists trading;
comment on schema trading is 'Nghiệp vụ trading: trade plan mỗi ngày (sau này journal, recap). Chỉ server (secret key) đọc ghi.';
revoke all on schema trading from public, anon, authenticated;
grant usage on schema trading to service_role;
-- Bảng / hàm tạo sau trong schema này tự có quyền đúng.
alter default privileges in schema trading revoke all on tables from public, anon, authenticated;
alter default privileges in schema trading grant select, insert, update, delete on tables to service_role;
alter default privileges in schema trading revoke execute on functions from public, anon, authenticated;

-- ---------- Bảng trading.trade_plans ----------
-- Thứ tự cột: khoá + thời gian → định danh plan → kết quả server tính → dữ liệu gốc từ ATAS.
create table trading.trade_plans (
  id          uuid        not null default gen_random_uuid() primary key,
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

comment on table  trading.trade_plans is 'Trade plan mỗi ngày (khung Composite × pRTH × OVN). Một dòng / ngày / symbol; gửi lại cùng ngày thì ghi đè. Chỉ server (secret key) đọc ghi.';
comment on column trading.trade_plans.id         is 'Khoá chính uuid (gen_random_uuid)';
comment on column trading.trade_plans.created_at is 'Lần gửi đầu tiên của ngày đó';
comment on column trading.trade_plans.updated_at is 'Lần gửi gần nhất (trigger trade_plans_touch)';
comment on column trading.trade_plans.trade_date is 'Ngày phiên trade (giờ ET), ví dụ 2026-11-17';
comment on column trading.trade_plans.symbol     is 'Mã hợp đồng, ví dụ NQZ6';
comment on column trading.trade_plans.summary    is 'Tóm tắt plan do server tính: bias, conf, setup, target, flip, price (giá 9:29 ET), zone...';
comment on column trading.trade_plans.plan_text  is 'Plan dạng chữ (giống khối chữ trên ảnh plan)';
comment on column trading.trade_plans.image_path is 'Đường dẫn ảnh plan trong bucket trade-plans (YYYY/MM/plan_<date>_<symbol>.png)';
comment on column trading.trade_plans.payload    is 'JSON v1 nguyên bản từ indicator ATAS Plan Sender (có price, prth, ovn, sessions, composite)';

-- RLS bật, KHÔNG có policy; anon / authenticated không có quyền gì.
alter table trading.trade_plans enable row level security;
revoke all on table trading.trade_plans from public, anon, authenticated;
grant select, insert, update, delete on table trading.trade_plans to service_role;

create trigger trade_plans_touch before update on trading.trade_plans
for each row execute function util.touch_updated_at();

-- ---------- Storage: ảnh plan ----------
-- Bucket private, chỉ PNG, tối đa 5 MB. Không tạo policy: chỉ secret key (Vercel) đọc / ghi.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-plans', 'trade-plans', false, 5242880, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ---------- Hàm Supabase tự tạo ----------
-- public.rls_auto_enable() (event trigger tự bật RLS cho bảng mới) là SECURITY DEFINER; thu quyền gọi qua /rpc.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

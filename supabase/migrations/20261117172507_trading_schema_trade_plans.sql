-- 20261117172507 · trading_schema_trade_plans (đã áp trên production Singapore 2026-11-18)
-- Schema nghiệp vụ trading + util, bảng trade_plans, bucket trade-plans.
-- Cột thời gian tạo ban đầu là timestamptz; migration 20261118021206 đổi sang timestamp (UTC).

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

create schema if not exists trading;
comment on schema trading is 'Nghiệp vụ trading: trade plan mỗi ngày (sau này journal, recap). Chỉ server (secret key) đọc ghi.';
revoke all on schema trading from public, anon, authenticated;
grant usage on schema trading to service_role;
alter default privileges in schema trading revoke all on tables from public, anon, authenticated;
alter default privileges in schema trading grant select, insert, update, delete on tables to service_role;
alter default privileges in schema trading revoke execute on functions from public, anon, authenticated;

create table trading.trade_plans (
  id          uuid        not null default gen_random_uuid() primary key,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  trade_date  date        not null,
  symbol      text        not null default 'NQ',
  summary     jsonb,
  plan_text   text,
  image_path  text,
  payload     jsonb       not null,
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

alter table trading.trade_plans enable row level security;
revoke all on table trading.trade_plans from public, anon, authenticated;
grant select, insert, update, delete on table trading.trade_plans to service_role;

create trigger trade_plans_touch before update on trading.trade_plans
for each row execute function util.touch_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-plans', 'trade-plans', false, 5242880, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

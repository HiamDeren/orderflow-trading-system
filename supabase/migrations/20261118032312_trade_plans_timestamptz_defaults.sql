-- 20261118032312 · trade_plans_timestamptz_defaults
-- Theo khuyến nghị Supabase: cột thời gian dùng timestamptz (Deren đổi lại trên dashboard 2026-11-18).
-- Đổi kiểu trên dashboard làm mất default; đặt lại default now() và trigger ghi now().
alter table trading.trade_plans
  alter column created_at type timestamptz using created_at,
  alter column updated_at type timestamptz using updated_at;

alter table trading.trade_plans
  alter column created_at set default now(),
  alter column updated_at set default now();
comment on column trading.trade_plans.created_at is 'Lần gửi đầu tiên của ngày đó (timestamptz)';
comment on column trading.trade_plans.updated_at is 'Lần gửi gần nhất (timestamptz, trigger trade_plans_touch)';

create or replace function util.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

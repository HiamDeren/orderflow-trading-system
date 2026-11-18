-- 20261118021206 · trade_plans_timestamp_utc_defaults
-- Deren đổi created_at / updated_at sang timestamp (không tz) trên dashboard 2026-11-18; file này ghi lại thay đổi đó
-- (đổi kiểu + default giờ UTC + trigger ghi giờ UTC). Quy ước: cột timestamp luôn là giờ UTC.
alter table trading.trade_plans
  alter column created_at type timestamp using created_at at time zone 'utc',
  alter column updated_at type timestamp using updated_at at time zone 'utc';

alter table trading.trade_plans
  alter column created_at set default (now() at time zone 'utc'),
  alter column updated_at set default (now() at time zone 'utc');
comment on column trading.trade_plans.created_at is 'Lần gửi đầu tiên của ngày đó (timestamp, giờ UTC)';
comment on column trading.trade_plans.updated_at is 'Lần gửi gần nhất, giờ UTC (trigger trade_plans_touch)';

create or replace function util.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now() at time zone 'utc';
  return new;
end $$;

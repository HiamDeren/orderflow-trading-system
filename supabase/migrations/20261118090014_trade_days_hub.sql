-- 20261118090014 · trade_days_hub (đã áp trên production Singapore 2026-11-18)
-- Tổ chức lại quanh bảng ngày trade:
--   trading.trade_days (1 dòng / ngày, id là khoá) ──1:n── trade_plans (1 / symbol)
--                                                 ──1:n── journal_entries (1 / symbol)  ──1:n── journal_trades ──n:n── tags (qua trade_tags)
-- Bảng con giữ cột trade_date (để đọc, và để /api/plan production cũ vẫn upsert theo trade_date, symbol);
-- day_id do trigger tự điền từ trade_date nên không bao giờ lệch.

-- 1. Bảng ngày
create table trading.trade_days (
  id          uuid        not null default gen_random_uuid() primary key,
  created_at  timestamptz not null default now(),
  trade_date  date        not null,
  note        text,
  constraint trade_days_trade_date_key unique (trade_date)
);
comment on table  trading.trade_days is 'Một dòng / ngày phiên (ngày ET). Khoá chung cho plan, journal, lệnh. Trigger tự tạo khi có plan / journal mới.';
comment on column trading.trade_days.note is 'Ghi chú chung của ngày (tuỳ chọn)';
alter table trading.trade_days enable row level security;
revoke all on table trading.trade_days from public, anon, authenticated;
grant select, insert, update, delete on table trading.trade_days to service_role;

-- 2. Trigger: từ trade_date → day_id (tạo ngày nếu chưa có)
create or replace function util.set_day_id()
returns trigger language plpgsql set search_path = '' as $$
begin
  insert into trading.trade_days (trade_date) values (new.trade_date) on conflict (trade_date) do nothing;
  select d.id into new.day_id from trading.trade_days d where d.trade_date = new.trade_date;
  return new;
end $$;
revoke execute on function util.set_day_id() from public, anon, authenticated;
grant execute on function util.set_day_id() to service_role;

insert into trading.trade_days (trade_date)
select trade_date from trading.trade_plans
union
select trade_date from trading.journal_days
on conflict (trade_date) do nothing;

-- 3. trade_plans → day_id
alter table trading.trade_plans add column day_id uuid references trading.trade_days (id) on delete restrict;
update trading.trade_plans p set day_id = d.id from trading.trade_days d where d.trade_date = p.trade_date;
alter table trading.trade_plans alter column day_id set not null;
create index trade_plans_day_id_idx on trading.trade_plans (day_id);
create trigger trade_plans_day before insert or update of trade_date on trading.trade_plans
for each row execute function util.set_day_id();
comment on column trading.trade_plans.day_id is 'Khoá ngày (trade_days.id), trigger điền từ trade_date';

-- 4. journal_days → journal_entries + day_id
alter table trading.journal_days rename to journal_entries;
alter trigger journal_days_touch on trading.journal_entries rename to journal_entries_touch;
alter table trading.journal_entries add column day_id uuid references trading.trade_days (id) on delete restrict;
update trading.journal_entries j set day_id = d.id from trading.trade_days d where d.trade_date = j.trade_date;
alter table trading.journal_entries alter column day_id set not null;
create index journal_entries_day_id_idx on trading.journal_entries (day_id);
create trigger journal_entries_day before insert or update of trade_date on trading.journal_entries
for each row execute function util.set_day_id();
comment on table  trading.journal_entries is 'Journal mỗi ngày trade (1 / ngày / symbol): thuộc tính ngày + các ô recap chữ. Chỉ server đọc ghi.';
comment on column trading.journal_entries.day_id is 'Khoá ngày (trade_days.id), trigger điền từ trade_date';

-- 5. journal_trades: day_id (cũ, trỏ journal_days) đổi tên thành entry_id; thêm day_id trỏ trade_days
alter table trading.journal_trades rename column day_id to entry_id;
alter index trading.journal_trades_day_id_idx rename to journal_trades_entry_id_idx;
alter table trading.journal_trades add column day_id uuid references trading.trade_days (id) on delete restrict;
update trading.journal_trades t set day_id = j.day_id from trading.journal_entries j where j.id = t.entry_id;
alter table trading.journal_trades alter column day_id set not null;
create index journal_trades_day_id_idx on trading.journal_trades (day_id);

create or replace function util.trade_day_from_entry()
returns trigger language plpgsql set search_path = '' as $$
begin
  select j.day_id into new.day_id from trading.journal_entries j where j.id = new.entry_id;
  return new;
end $$;
revoke execute on function util.trade_day_from_entry() from public, anon, authenticated;
grant execute on function util.trade_day_from_entry() to service_role;
create trigger journal_trades_day before insert or update of entry_id on trading.journal_trades
for each row execute function util.trade_day_from_entry();
comment on column trading.journal_trades.entry_id is 'Journal của ngày (journal_entries.id)';
comment on column trading.journal_trades.day_id   is 'Khoá ngày (trade_days.id), trigger lấy từ journal_entries';

-- 6. Tag n:n (lỗi, setup, trigger, level...)
create table trading.tags (
  id          uuid        not null default gen_random_uuid() primary key,
  created_at  timestamptz not null default now(),
  kind        text        not null,
  name        text        not null,
  constraint tags_kind_name_key unique (kind, name),
  constraint tags_kind_check check (kind in ('mistake', 'setup', 'trigger', 'level'))
);
create table trading.trade_tags (
  trade_id  uuid not null references trading.journal_trades (id) on delete cascade,
  tag_id    uuid not null references trading.tags (id) on delete cascade,
  primary key (trade_id, tag_id)
);
create index trade_tags_tag_id_idx on trading.trade_tags (tag_id);
comment on table trading.tags       is 'Danh mục tag dùng lại giữa các lệnh (kind: mistake / setup / trigger / level)';
comment on table trading.trade_tags is 'Bảng nối n:n giữa journal_trades và tags';
alter table trading.tags enable row level security;
alter table trading.trade_tags enable row level security;
revoke all on table trading.tags, trading.trade_tags from public, anon, authenticated;
grant select, insert, update, delete on table trading.tags, trading.trade_tags to service_role;

-- chuyển cột mistake (chữ) sang tag
insert into trading.tags (kind, name)
select distinct 'mistake', btrim(mistake) from trading.journal_trades where coalesce(btrim(mistake), '') <> ''
on conflict (kind, name) do nothing;
insert into trading.trade_tags (trade_id, tag_id)
select t.id, g.id from trading.journal_trades t join trading.tags g on g.kind = 'mistake' and g.name = btrim(t.mistake)
on conflict do nothing;
alter table trading.journal_trades drop column mistake;

-- 7. Lưu journal trong một giao dịch (gọi qua PostgREST: POST /rest/v1/rpc/save_journal, Content-Profile: trading)
create or replace function trading.save_journal(p jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_entry uuid;
  v_trade uuid;
  v_tag   uuid;
  t       jsonb;
  m       text;
  i       int := 0;
begin
  insert into trading.journal_entries as e (
    trade_date, symbol, day_type, result, open_type, bias_correct,
    context, session_story, plan_vs_actual, trade_review, orderflow, process_score, psychology, next_levels, lesson
  ) values (
    (p->>'trade_date')::date, coalesce(nullif(p->>'symbol', ''), 'NQ'),
    nullif(p->>'day_type', ''), nullif(p->>'result', ''), nullif(p->>'open_type', ''), nullif(p->>'bias_correct', ''),
    nullif(p->>'context', ''), nullif(p->>'session_story', ''), nullif(p->>'plan_vs_actual', ''), nullif(p->>'trade_review', ''),
    nullif(p->>'orderflow', ''), nullif(p->>'process_score', ''), nullif(p->>'psychology', ''), nullif(p->>'next_levels', ''),
    nullif(p->>'lesson', '')
  )
  on conflict (trade_date, symbol) do update set
    day_type = excluded.day_type, result = excluded.result, open_type = excluded.open_type, bias_correct = excluded.bias_correct,
    context = excluded.context, session_story = excluded.session_story, plan_vs_actual = excluded.plan_vs_actual,
    trade_review = excluded.trade_review, orderflow = excluded.orderflow, process_score = excluded.process_score,
    psychology = excluded.psychology, next_levels = excluded.next_levels, lesson = excluded.lesson
  returning e.id into v_entry;

  delete from trading.journal_trades where entry_id = v_entry;

  for t in select * from jsonb_array_elements(coalesce(p->'trades', '[]'::jsonb)) loop
    i := i + 1;
    insert into trading.journal_trades (entry_id, seq, entry_time, side, qty, level, trigger, r, pnl, fee, followed_plan)
    values (
      v_entry, i, nullif(t->>'entry_time', '')::time, t->>'side', coalesce(nullif(t->>'qty', '')::smallint, 1),
      nullif(t->>'level', ''), nullif(t->>'trigger', ''), nullif(t->>'r', '')::numeric, nullif(t->>'pnl', '')::numeric,
      coalesce(nullif(t->>'fee', '')::numeric, 0), nullif(t->>'followed_plan', '')
    )
    returning id into v_trade;
    for m in select distinct btrim(x) from jsonb_array_elements_text(coalesce(t->'mistakes', '[]'::jsonb)) as x where btrim(x) <> '' loop
      insert into trading.tags (kind, name) values ('mistake', m)
      on conflict (kind, name) do update set name = excluded.name
      returning id into v_tag;
      insert into trading.trade_tags (trade_id, tag_id) values (v_trade, v_tag) on conflict do nothing;
    end loop;
  end loop;
  return v_entry;
end $$;
revoke execute on function trading.save_journal(jsonb) from public, anon, authenticated;
grant execute on function trading.save_journal(jsonb) to service_role;

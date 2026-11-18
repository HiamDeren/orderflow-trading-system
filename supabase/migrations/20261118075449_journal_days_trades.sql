-- 20261118075449 · journal_days_trades (đã áp trên production Singapore 2026-11-18)
-- Journal: một dòng / ngày trade (recap chữ + thuộc tính ngày) và các lệnh trong ngày.
-- Chỉ server (secret key, sau khi kiểm đăng nhập chủ sở hữu) đọc ghi: RLS bật, không policy, không grant anon / authenticated.

create table trading.journal_days (
  id              uuid        not null default gen_random_uuid() primary key,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  trade_date      date        not null,
  symbol          text        not null default 'NQ',
  day_type        text,
  result          text,
  open_type       text,
  bias_correct    text,
  context         text,
  session_story   text,
  plan_vs_actual  text,
  trade_review    text,
  orderflow       text,
  process_score   text,
  psychology      text,
  next_levels     text,
  lesson          text,
  constraint journal_days_trade_date_symbol_key unique (trade_date, symbol),
  constraint journal_days_day_type_check check (day_type is null or day_type in
    ('Normal day', 'Normal variation', 'Neutral day', 'Neutral extreme day', 'Double distribution day', 'Trending day', 'IDK')),
  constraint journal_days_result_check check (result is null or result in ('Win', 'Loss', 'Breakeven', 'No Trade')),
  constraint journal_days_open_type_check check (open_type is null or open_type in
    ('Open drive', 'Open test drive', 'Open rejection reverse', 'Open auction')),
  constraint journal_days_bias_correct_check check (bias_correct is null or bias_correct in ('Đúng', 'Sai', 'Một phần'))
);

comment on table  trading.journal_days is 'Journal mỗi ngày trade: thuộc tính ngày + các ô recap chữ. Một dòng / ngày / symbol. Chỉ server đọc ghi.';
comment on column trading.journal_days.trade_date     is 'Ngày phiên (giờ ET), khớp trade_plans.trade_date';
comment on column trading.journal_days.day_type       is 'Day type (TPO): Normal day … Trending day, IDK';
comment on column trading.journal_days.result         is 'Kết quả ngày: Win / Loss / Breakeven / No Trade';
comment on column trading.journal_days.open_type      is 'Open type: drive, test drive, rejection reverse, auction';
comment on column trading.journal_days.bias_correct   is 'Bias của plan đúng không: Đúng / Sai / Một phần';
comment on column trading.journal_days.context        is 'Context TPO của phiên';
comment on column trading.journal_days.session_story  is 'Diễn biến phiên';
comment on column trading.journal_days.plan_vs_actual is 'Plan so với thực tế';
comment on column trading.journal_days.trade_review   is 'Chấm từng lệnh';
comment on column trading.journal_days.orderflow      is 'Footprint · DOM · tape tại điểm vào';
comment on column trading.journal_days.process_score  is 'Điểm quy trình';
comment on column trading.journal_days.psychology     is 'Tâm lý và kỷ luật';
comment on column trading.journal_days.next_levels    is 'Level cho ngày mai';
comment on column trading.journal_days.lesson         is 'Bài học của ngày';

create table trading.journal_trades (
  id             uuid          not null default gen_random_uuid() primary key,
  created_at     timestamptz   not null default now(),
  day_id         uuid          not null references trading.journal_days (id) on delete cascade,
  seq            smallint      not null default 1,
  entry_time     time,
  side           text          not null,
  qty            smallint      not null default 1,
  level          text,
  trigger        text,
  r              numeric(6, 2),
  pnl            numeric(10, 2),
  fee            numeric(8, 2) not null default 0,
  followed_plan  text,
  mistake        text,
  constraint journal_trades_side_check check (side in ('Long', 'Short')),
  constraint journal_trades_qty_check check (qty > 0),
  constraint journal_trades_followed_plan_check check (followed_plan is null or followed_plan in ('Có', 'Một phần', 'Không'))
);

create index journal_trades_day_id_idx on trading.journal_trades (day_id);

comment on table  trading.journal_trades is 'Từng lệnh trong ngày (con của journal_days). Net = pnl − fee. Chỉ server đọc ghi.';
comment on column trading.journal_trades.entry_time    is 'Giờ vào lệnh (ET)';
comment on column trading.journal_trades.qty           is 'Số hợp đồng';
comment on column trading.journal_trades.level         is 'Level của plan nơi vào lệnh (pRTH VAL, HVN, VWAP...)';
comment on column trading.journal_trades.trigger       is 'Trigger orderflow (absorption, CVD lệch, imbalance...)';
comment on column trading.journal_trades.r             is 'Kết quả theo R';
comment on column trading.journal_trades.pnl           is 'PnL gross ($)';
comment on column trading.journal_trades.fee           is 'Phí ($)';
comment on column trading.journal_trades.followed_plan is 'Theo plan: Có / Một phần / Không';
comment on column trading.journal_trades.mistake       is 'Ghi chú lỗi (tag)';

alter table trading.journal_days enable row level security;
alter table trading.journal_trades enable row level security;
revoke all on table trading.journal_days, trading.journal_trades from public, anon, authenticated;
grant select, insert, update, delete on table trading.journal_days, trading.journal_trades to service_role;

create trigger journal_days_touch before update on trading.journal_days
for each row execute function util.touch_updated_at();

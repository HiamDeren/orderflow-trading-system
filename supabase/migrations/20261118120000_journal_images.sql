-- journal_images · ảnh chụp lệnh / chart gắn vào journal của một ngày (D43)
-- trade_days (1) ──1:n── journal_images. Ảnh nằm ở bucket private "trading": YYYY/MM/DD/journal/<id>.webp
-- trade_seq (tuỳ chọn) trỏ số thứ tự lệnh trong ngày (journal_trades.seq): save_journal xoá / ghi lại lệnh
-- nên không dùng khoá ngoại tới id của lệnh. Chỉ server (secret key) đọc ghi.

create table trading.journal_images (
  id          uuid        not null default gen_random_uuid() primary key,
  created_at  timestamptz not null default now(),
  trade_date  date        not null,
  day_id      uuid        not null references trading.trade_days (id) on delete restrict,
  path        text        not null,
  caption     text,
  trade_seq   smallint,
  width       integer,
  height      integer,
  bytes       integer,
  constraint journal_images_path_key unique (path),
  constraint journal_images_caption_len check (caption is null or char_length(caption) <= 300),
  constraint journal_images_trade_seq_check check (trade_seq is null or trade_seq between 1 and 50)
);
comment on table  trading.journal_images is 'Ảnh journal (chụp lệnh, chart) theo ngày phiên. File trong bucket trading, đường dẫn ở cột path.';
comment on column trading.journal_images.day_id is 'Khoá ngày (trade_days.id), trigger điền từ trade_date';
comment on column trading.journal_images.trade_seq is 'Số thứ tự lệnh trong ngày (journal_trades.seq), để trống nếu là ảnh chung của ngày';

create index journal_images_day_id_idx on trading.journal_images (day_id);
create index journal_images_trade_date_idx on trading.journal_images (trade_date, created_at);

create trigger journal_images_day before insert or update of trade_date on trading.journal_images
for each row execute function util.set_day_id();

alter table trading.journal_images enable row level security;
revoke all on table trading.journal_images from public, anon, authenticated;
grant select, insert, update, delete on table trading.journal_images to service_role;

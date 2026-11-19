-- desk_members · ai được vào dashboard ngoài chủ sở hữu (D48)
-- Người lạ đăng nhập Discord → thêm dòng 'pending' (kèm tên, avatar để nhận ra), bị từ chối cho tới khi chủ sở hữu duyệt.
-- Chủ sở hữu duyệt ở Profile → 'guest'; gỡ → 'blocked' (không tự tạo yêu cầu mới) hoặc xoá dòng.
-- Chủ sở hữu vẫn xác định bằng OWNER_DISCORD_ID (D38), không nằm trong bảng này. Chỉ server (secret key) đọc ghi.
-- Đặt ở schema trading vì schema này đã expose cho Data API (không phải sửa cấu hình dashboard).

create table trading.desk_members (
  discord_id    text        not null primary key,
  status        text        not null default 'pending',
  user_id       uuid,
  name          text,
  handle        text,
  avatar        text,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  approved_at   timestamptz,
  last_login_at timestamptz,
  constraint desk_members_discord_id_check check (discord_id ~ '^[0-9]{5,25}$'),
  constraint desk_members_status_check check (status in ('pending', 'guest', 'blocked')),
  constraint desk_members_name_len check (name is null or char_length(name) <= 100),
  constraint desk_members_handle_len check (handle is null or char_length(handle) <= 100),
  constraint desk_members_avatar_len check (avatar is null or char_length(avatar) <= 500),
  constraint desk_members_note_len check (note is null or char_length(note) <= 200)
);
comment on table  trading.desk_members is 'Khách của dashboard: pending (đã xin, chờ duyệt) / guest (được xem phần thị trường) / blocked. Chủ sở hữu không nằm ở đây.';
comment on column trading.desk_members.discord_id is 'Discord User ID (từ auth.identities, không lấy từ user_metadata)';
comment on column trading.desk_members.user_id is 'auth.users.id lần đăng nhập gần nhất với quyền khách, để xoá user khi gỡ quyền';
comment on column trading.desk_members.name is 'Tên hiển thị Discord lúc xin quyền / đăng nhập, chỉ để nhận ra người';

create index desk_members_status_idx on trading.desk_members (status, updated_at desc);

create or replace function trading.desk_members_touch() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'guest' and (tg_op = 'INSERT' or old.status is distinct from 'guest') then
    new.approved_at := now();
  end if;
  return new;
end;
$$;
revoke all on function trading.desk_members_touch() from public, anon, authenticated;

create trigger desk_members_touch before insert or update on trading.desk_members
for each row execute function trading.desk_members_touch();

alter table trading.desk_members enable row level security;
revoke all on table trading.desk_members from public, anon, authenticated;
grant select, insert, update, delete on table trading.desk_members to service_role;

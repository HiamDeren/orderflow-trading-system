-- access.members · ai được vào dashboard ngoài chủ sở hữu (D48)
-- Schema riêng "access" (quyền truy cập), tách khỏi "trading" (dữ liệu giao dịch) theo D25.
-- Người lạ đăng nhập Discord → thêm dòng 'pending' (kèm tên, avatar để nhận ra), bị từ chối cho tới khi chủ sở hữu duyệt.
-- Chủ sở hữu duyệt ở Profile → 'guest'; gỡ → 'blocked' (không tự tạo yêu cầu mới) hoặc xoá dòng.
-- Chủ sở hữu vẫn xác định bằng OWNER_DISCORD_ID (D38), không nằm trong bảng này. Chỉ server (secret key) đọc ghi.
-- Cần thêm "access" vào Exposed schemas của Data API (Dashboard → Integrations → Data API → Settings) để server gọi qua REST.

create schema if not exists access;
comment on schema access is 'Quyền truy cập dashboard (khách, sau này: vai trò, lời mời). Chỉ service_role.';
revoke all on schema access from public, anon, authenticated;
grant usage on schema access to service_role;

create table access.members (
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
  constraint members_discord_id_check check (discord_id ~ '^[0-9]{5,25}$'),
  constraint members_status_check check (status in ('pending', 'guest', 'blocked')),
  constraint members_name_len check (name is null or char_length(name) <= 100),
  constraint members_handle_len check (handle is null or char_length(handle) <= 100),
  constraint members_avatar_len check (avatar is null or char_length(avatar) <= 500),
  constraint members_note_len check (note is null or char_length(note) <= 200)
);
comment on table  access.members is 'Khách của dashboard: pending (đã xin, chờ duyệt) / guest (được xem phần thị trường) / blocked. Chủ sở hữu không nằm ở đây.';
comment on column access.members.discord_id is 'Discord User ID (từ auth.identities, không lấy từ user_metadata)';
comment on column access.members.user_id is 'auth.users.id lần đăng nhập gần nhất với quyền khách, để xoá user khi gỡ quyền (không khoá ngoại sang schema auth)';
comment on column access.members.name is 'Tên hiển thị Discord lúc xin quyền / đăng nhập, chỉ để nhận ra người';

create index members_status_idx on access.members (status, updated_at desc);

create or replace function access.members_touch() returns trigger
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
revoke all on function access.members_touch() from public, anon, authenticated;

create trigger members_touch before insert or update on access.members
for each row execute function access.members_touch();

alter table access.members enable row level security;
revoke all on table access.members from public, anon, authenticated;
grant select, insert, update, delete on table access.members to service_role;

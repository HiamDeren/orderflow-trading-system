-- Bảng lưu plan gửi từ indicator "Deren · Plan Sender".
-- Chạy trong Supabase: SQL Editor → New query → dán → Run.

create table if not exists public.plans (
  id          bigint generated always as identity primary key,
  trade_date  date        not null,
  symbol      text        not null default 'NQ',
  price       numeric,
  payload     jsonb       not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (trade_date, symbol)
);

-- Bật RLS và KHÔNG tạo policy nào: chỉ secret / service key (dùng trong Vercel) đọc ghi được.
-- Key publishable / anon không đọc được bảng này.
alter table public.plans enable row level security;

-- Tự cập nhật updated_at khi gửi lại plan cùng ngày.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists plans_touch on public.plans;
create trigger plans_touch before update on public.plans
for each row execute function public.touch_updated_at();

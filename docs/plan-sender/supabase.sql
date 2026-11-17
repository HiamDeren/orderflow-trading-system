-- Bảng lưu plan gửi từ indicator "Deren · Plan Sender".
-- Chạy trong Supabase: SQL Editor → New query → dán → Run.

create table if not exists public.trade_plans (
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
alter table public.trade_plans enable row level security;

-- Tự cập nhật updated_at khi gửi lại plan cùng ngày.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trade_plans_touch on public.trade_plans;
create trigger trade_plans_touch before update on public.trade_plans
for each row execute function public.touch_updated_at();

-- ---------- Bước 3: ảnh plan + Discord (17/11/2026) ----------
alter table public.trade_plans
  add column if not exists image_path text,   -- đường dẫn ảnh trong bucket trade-plans
  add column if not exists plan_text  text,   -- plan chữ (giống khung plan trên web)
  add column if not exists summary    jsonb;  -- bias, setup, target... để lọc / thống kê sau này

-- Bucket private, chỉ PNG, tối đa 5 MB. Không tạo policy: chỉ secret key (Vercel) đọc / ghi được.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-plans', 'trade-plans', false, 5242880, array['image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter function public.touch_updated_at() set search_path = '';

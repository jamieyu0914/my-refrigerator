-- my-refrigerator v1 schema
-- Tables: categories, profiles, foods, shopping_items, recipes, promotions
-- Conventions: snake_case columns, uuid PKs, per-user tables carry user_id + RLS
-- (see .claude/skills/database/SKILL.md)

create extension if not exists pgcrypto;

-- ============================================================
-- categories: shared lookup table used by foods & promotions
-- ============================================================
create table categories (
  code text primary key,
  label text not null,
  sort_order integer not null default 0
);

insert into categories (code, label, sort_order) values
  ('蔬果', '蔬果', 1),
  ('肉類', '肉類', 2),
  ('乳製品', '乳製品', 3),
  ('飲品', '飲品', 4),
  ('其他', '其他', 5);

alter table categories enable row level security;

create policy "categories are readable by authenticated users"
  on categories for select
  to authenticated
  using (true);

-- ============================================================
-- profiles: 1:1 extension of auth.users (display name etc.)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- foods: 我的冰箱
-- ============================================================
create table foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category_code text not null references categories (code),
  quantity integer not null default 1 check (quantity >= 0),
  expiry_date date,
  added_at timestamptz not null default now()
);

create index foods_user_expiry_idx on foods (user_id, expiry_date);
create index foods_user_category_idx on foods (user_id, category_code);

alter table foods enable row level security;

create policy "users manage own foods"
  on foods for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- shopping_items: 採買清單
-- ============================================================
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  quantity integer not null default 1 check (quantity >= 0),
  checked boolean not null default false,
  added_at timestamptz not null default now()
);

create index shopping_items_user_checked_idx on shopping_items (user_id, checked);

alter table shopping_items enable row level security;

create policy "users manage own shopping items"
  on shopping_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- recipes: 食譜（私有，is_favorite 取代 favorite_recipes join table）
-- ============================================================
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  ingredients jsonb not null default '[]'::jsonb,
  instructions text not null,
  image_url text,
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index recipes_user_favorite_idx on recipes (user_id, is_favorite);

alter table recipes enable row level security;

create policy "users manage own recipes"
  on recipes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- promotions: 特價食材（個人記錄，category 對齊 foods 的分類）
-- ============================================================
create table promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category_code text not null references categories (code),
  original_price numeric(10, 2),
  discount_price numeric(10, 2) not null,
  store text,
  valid_from date,
  valid_until date,
  image_url text,
  created_at timestamptz not null default now()
);

create index promotions_user_category_idx on promotions (user_id, category_code);

alter table promotions enable row level security;

create policy "users manage own promotions"
  on promotions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

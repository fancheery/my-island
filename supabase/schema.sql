-- ============================================================
-- 我的岛 · Supabase 数据库初始化
-- 在 Supabase 控制台 → SQL Editor → 新建查询，整段粘贴并运行。
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- entries ----------
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'diary',           -- diary | letter | capsule | bottle | thought
  entry_date date not null,
  body text not null default '',
  weather text,                                  -- 晴 | 有雾 | 下雨 | 起风 | 夜
  image_paths text[] not null default '{}',
  ai_visible boolean not null default true,      -- v0.2 回声使用
  sealed_until timestamptz,                      -- v0.4 时间胶囊
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx
  on public.entries (user_id, entry_date desc);

alter table public.entries enable row level security;

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries
  for select using (auth.uid() = user_id);

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own" on public.entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own" on public.entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries
  for delete using (auth.uid() = user_id);

-- ---------- 存储：图片 ----------
insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do nothing;

drop policy if exists "images_read_own" on storage.objects;
create policy "images_read_own" on storage.objects
  for select using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "images_insert_own" on storage.objects;
create policy "images_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "images_delete_own" on storage.objects;
create policy "images_delete_own" on storage.objects
  for delete using (
    bucket_id = 'images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------- 设置（预留） ----------
create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system',
  ai_memory_enabled boolean not null default true,
  boundaries text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own" on public.settings
  for select using (auth.uid() = user_id);

drop policy if exists "settings_insert_own" on public.settings;
create policy "settings_insert_own" on public.settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "settings_update_own" on public.settings;
create policy "settings_update_own" on public.settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

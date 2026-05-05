-- =============================================
-- HIVON BLOG - Complete Database Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null default 'viewer' check (role in ('viewer', 'author', 'admin')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. POSTS TABLE
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  image_url text,
  author_id uuid references public.users(id) on delete cascade not null,
  summary text,
  slug text not null unique,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. COMMENTS TABLE
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  comment_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. AUTO-CREATE USER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. ENABLE ROW LEVEL SECURITY
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- 6. RLS POLICIES — USERS
create policy "Users can read all profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- 7. RLS POLICIES — POSTS
create policy "Anyone can read published posts" on public.posts for select using (published = true);
create policy "Authors can insert posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors can update own posts" on public.posts for update using (auth.uid() = author_id);
create policy "Authors can delete own posts" on public.posts for delete using (auth.uid() = author_id);

-- 8. RLS POLICIES — COMMENTS
create policy "Anyone can read comments" on public.comments for select using (true);
create policy "Authenticated users can insert comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- 9. INDEXES for performance
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_slug_idx on public.posts(slug);
create index if not exists posts_published_idx on public.posts(published);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists comments_user_id_idx on public.comments(user_id);

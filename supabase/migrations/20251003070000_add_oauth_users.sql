create table if not exists public.oauth_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  name text,
  picture text,
  provider text not null,
  provider_sub text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_oauth_users_user_id on public.oauth_users(user_id);
create unique index if not exists uniq_oauth_provider_sub on public.oauth_users(provider, provider_sub);



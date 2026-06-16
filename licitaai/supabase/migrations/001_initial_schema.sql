create extension if not exists "uuid-ossp";

create table plans (
  id text primary key,
  name text not null,
  monthly_price_usd int not null,
  monthly_fit_scores int not null default 20,
  monthly_alerts int not null default 15
);

insert into plans values
  ('starter',  'Starter',  29,  20,  15),
  ('pro',      'Pro',      79,  100, 60),
  ('business', 'Business', 179, -1,  -1);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  company_name text not null,
  country_code text not null default 'MX',
  plan_id text references plans(id) default 'starter',
  credits_used_this_month int not null default 0,
  whatsapp_enabled boolean not null default false,
  email_enabled boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table user_filters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  sectors text[] not null default '{}',
  states text[] not null default '{}',
  min_amount bigint not null default 0,
  max_amount bigint not null default 999999999,
  keywords text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table licitaciones (
  id uuid primary key default uuid_generate_v4(),
  portal_id text not null,
  country_code text not null default 'MX',
  title text not null,
  agency text,
  sector text,
  state text,
  amount bigint,
  deadline timestamptz,
  pdf_url text,
  found_at timestamptz not null default now(),
  unique(portal_id, country_code)
);

create table fit_scores (
  id uuid primary key default uuid_generate_v4(),
  licitacion_id uuid not null references licitaciones(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  analysis jsonb,
  score_source text not null default 'title_only',
  status text not null default 'calculado',
  created_at timestamptz not null default now(),
  unique(licitacion_id, user_id)
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  licitacion_ids uuid[] not null,
  channel text not null,
  sent_at timestamptz not null default now(),
  confirmed boolean not null default false
);

alter table plans enable row level security;
alter table public.users enable row level security;
alter table user_filters enable row level security;
alter table fit_scores enable row level security;
alter table notifications enable row level security;
alter table licitaciones enable row level security;

create policy "ver propio perfil" on public.users for select using (auth.uid() = id);
create policy "actualizar propio perfil" on public.users for update using (auth.uid() = id);
create policy "ver propios filtros" on user_filters for select using (auth.uid() = user_id);
create policy "crear propios filtros" on user_filters for insert with check (auth.uid() = user_id);
create policy "actualizar propios filtros" on user_filters for update using (auth.uid() = user_id);
create policy "planes públicos" on plans for select using (true);
create policy "ver propios scores" on fit_scores for select using (auth.uid() = user_id);
create policy "actualizar propios scores" on fit_scores for update using (auth.uid() = user_id);
-- insert via service role only (backend worker); no client-side insert policy needed
create policy "ver licitaciones autenticado" on licitaciones for select using (auth.role() = 'authenticated');
create policy "ver propias notificaciones" on notifications for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, company_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'company_name', 'Mi Empresa'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

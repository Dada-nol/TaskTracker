# Configuration Supabase

## 1. Créer un projet Supabase
Va sur https://supabase.com → New project.

## 2. Créer les tables (SQL Editor)

```sql
-- Table profil utilisateur
create table user_profile (
  id uuid primary key,
  xp_total integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now()
);

-- Table catégories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profile(id) on delete cascade,
  name text not null,
  level integer not null default 1,
  xp integer not null default 0,
  xp_to_next_level integer not null default 500,
  daily_point_limit integer not null default 6,
  points_used_today integer not null default 0,
  streak integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

-- Table tâches / défis
create table tasks (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  title text not null,
  difficulty text not null check (difficulty in ('easy', 'normal', 'hard')),
  type text not null check (type in ('recurring', 'goal')),
  point_cost integer not null default 1,
  deadline date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 3. Désactiver RLS (pour l'instant, pas d'auth)

```sql
alter table user_profile disable row level security;
alter table categories disable row level security;
alter table tasks disable row level security;
```

## 4. Récupérer les clés

Dans ton projet Supabase → Settings → API :
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 5. Créer `.env.local` à la racine du projet

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 6. Lancer

```bash
npm run dev
```

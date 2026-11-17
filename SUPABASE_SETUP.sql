-- ============================================================================
-- ARCHIVO: SUPABASE_SETUP.sql
-- INSTRUCCIONES PARA EL DISEÑADOR (CERO ASUNCIONES):
-- 1. Entrá a https://supabase.com y creá un proyecto gratis.
-- 2. En el menú lateral izquierdo de Supabase, entrá a "SQL Editor".
-- 3. Hacé clic en "+ New query", copiá TODO este archivo, pegalo ahí y tocá "Run".
-- 4. Luego andá a "Project Settings" -> "API" y copiá tu "Project URL" y tu
--    llave pública "anon public" en tu archivo .env (o en Environment Variables de Vercel):
--    VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
--    VITE_SUPABASE_ANON_KEY=tu-llave-anon-publica
-- ============================================================================

create table if not exists public.banquetes_comunidad (
  id uuid primary key default gen_random_uuid(),
  banquete_name text not null,
  author_name text not null,
  total_score integer not null default 0,
  rank_title text not null default 'Banquete Renguero',
  opener_title text not null default 'Sin Apertura',
  closer_title text not null default 'Sin Cierre',
  albums_count integer not null default 1,
  badges_count integer not null default 0,
  song_ids text[] not null default '{}',
  date_label text not null default 'Necochea 2026',
  created_at timestamptz not null default now()
);

-- Índice para ordenar rápidamente el Ranking Global por mayor puntaje
create index if not exists idx_banquetes_comunidad_score
  on public.banquetes_comunidad (total_score desc, created_at desc);

-- Activar Row Level Security (Seguridad a nivel de filas de Supabase)
alter table public.banquetes_comunidad enable row level security;

-- Política 1: Cualquier visitante puede VER el Ranking Global y los Setlists para batallar
drop policy if exists "Lectura publica de banquetes" on public.banquetes_comunidad;
create policy "Lectura publica de banquetes"
  on public.banquetes_comunidad
  for select
  to anon, authenticated
  using (true);

-- Política 2: Cualquier visitante puede PUBLICAR su Banquete en el Ranking Global
drop policy if exists "Publicacion publica de banquetes" on public.banquetes_comunidad;
create policy "Publicacion publica de banquetes"
  on public.banquetes_comunidad
  for insert
  to anon, authenticated
  with check (
    char_length(banquete_name) >= 2
    and char_length(banquete_name) <= 80
    and char_length(author_name) >= 2
    and char_length(author_name) <= 60
    and total_score >= 0
    and total_score <= 10000
  );

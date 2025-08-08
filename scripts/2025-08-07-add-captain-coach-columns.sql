-- Agrega campos de capitán y coach a la tabla teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS captain_name text,
  ADD COLUMN IF NOT EXISTS captain_phone text,
  ADD COLUMN IF NOT EXISTS coach_name text,
  ADD COLUMN IF NOT EXISTS coach_phone text,
  ADD COLUMN IF NOT EXISTS coach_photo_url text;

-- Opcional: índices simples para búsqueda futura
CREATE INDEX IF NOT EXISTS idx_teams_captain_name ON public.teams ((lower(captain_name)));
CREATE INDEX IF NOT EXISTS idx_teams_coach_name ON public.teams ((lower(coach_name)));

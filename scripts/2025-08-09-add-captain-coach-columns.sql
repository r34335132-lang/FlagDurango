-- Agrega columnas de capitán y coach si no existen
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS captain_name TEXT,
  ADD COLUMN IF NOT EXISTS captain_phone TEXT,
  ADD COLUMN IF NOT EXISTS captain_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS coach_name TEXT,
  ADD COLUMN IF NOT EXISTS coach_phone TEXT,
  ADD COLUMN IF NOT EXISTS coach_photo_url TEXT;

-- Índices opcionales (búsqueda por nombre de coach/capitán)
CREATE INDEX IF NOT EXISTS idx_teams_captain_name ON teams (captain_name);
CREATE INDEX IF NOT EXISTS idx_teams_coach_name ON teams (coach_name);

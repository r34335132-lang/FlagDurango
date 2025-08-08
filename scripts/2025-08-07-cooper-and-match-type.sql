-- 1) Add match_type to games (Flag: jornada, semifinal, final, amistoso)
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'jornada';

-- Constrain to valid types for Flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'games_match_type_check'
  ) THEN
    ALTER TABLE games
      ADD CONSTRAINT games_match_type_check
      CHECK (match_type IN ('jornada','semifinal','final','amistoso'));
  END IF;
END $$;

-- 2) Opcional: Asegurar que la categoría "femenil-cooper" sea aceptada.
-- Si tu columna teams.category es TEXT, no hace falta constraint.
-- Si ya tienes un CHECK de categorías, puedes actualizarlo manualmente para incluir 'femenil-cooper'.
-- Este script no cambia constraints de category para evitar romper datos en tu base actual.

-- 3) MVPs (ligeros): MVPs semanales/temporada (ligado a player_id)
CREATE TABLE IF NOT EXISTS mvps (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season VARCHAR(10) NOT NULL DEFAULT '2025',
  category TEXT NOT NULL,
  week_number INTEGER,
  mvp_type TEXT NOT NULL DEFAULT 'weekly' CHECK (mvp_type IN ('weekly','season','game')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

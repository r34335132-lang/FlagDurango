-- Extensiones y estructura para nuevas características

-- 1) Tipo de partido (Flag): jornada, semifinal, final, amistoso
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'jornada';

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

-- 2) Ampliar teams con campos institucionales y foto de capitán
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS is_institutional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS coordinator_name TEXT,
  ADD COLUMN IF NOT EXISTS coordinator_phone TEXT,
  ADD COLUMN IF NOT EXISTS captain_photo_url TEXT;

-- 3) Ampliar users con foto
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 4) MVPs
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

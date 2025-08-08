-- Create system_config table to store feature flags and global settings
CREATE TABLE IF NOT EXISTS system_config (
  config_key TEXT PRIMARY KEY,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed defaults if not present
INSERT INTO system_config (config_key, config_value, description)
VALUES 
  ('season_started', 'false', 'Temporada en curso'),
  ('registration_deadline', '2025-09-15', 'Fecha límite para inscripciones (YYYY-MM-DD)'),
  ('wildbrowl_enabled', 'false', 'Activa el torneo WildBrowl 1v1')
ON CONFLICT (config_key) DO NOTHING;

-- Ensure players table has a photo_url to display player images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE players
      ADD COLUMN photo_url VARCHAR(500);
  END IF;
END $$;

-- WildBrowl tournament tables
CREATE TABLE IF NOT EXISTS wildbrowl_tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  entry_fee NUMERIC(10,2) NOT NULL DEFAULT 100,
  max_participants INTEGER NOT NULL DEFAULT 32,
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','finished')),
  start_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wildbrowl_participants (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES wildbrowl_tournaments(id) ON DELETE CASCADE,
  player_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  category VARCHAR(30) NOT NULL CHECK (category IN ('femenil','varonil')),
  photo_url VARCHAR(500),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','cancelled','refunded')),
  bracket_position INTEGER,
  eliminated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wb_participants_tournament ON wildbrowl_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_wb_participants_category ON wildbrowl_participants(category);

CREATE TABLE IF NOT EXISTS wildbrowl_matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES wildbrowl_tournaments(id) ON DELETE CASCADE,
  participant1_id INTEGER REFERENCES wildbrowl_participants(id) ON DELETE SET NULL,
  participant2_id INTEGER REFERENCES wildbrowl_participants(id) ON DELETE SET NULL,
  winner_id INTEGER REFERENCES wildbrowl_participants(id) ON DELETE SET NULL,
  round_label VARCHAR(50) DEFAULT 'Round of 32',
  stage VARCHAR(30) DEFAULT 'regular' CHECK (stage IN ('regular','quarterfinal','semifinal','final','third_place')),
  match_date TIMESTAMP,
  venue VARCHAR(120),
  field VARCHAR(120),
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','finished')),
  score_p1 INTEGER DEFAULT 0,
  score_p2 INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add playoffs support to 11v11/5v5 games (stage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'stage'
  ) THEN
    ALTER TABLE games
      ADD COLUMN stage VARCHAR(30) DEFAULT 'regular';
  END IF;
END $$;

ALTER TABLE games
  ADD CONSTRAINT games_stage_check
  CHECK (stage IN ('regular','quarterfinal','semifinal','final','third_place'));

-- MVPs (weekly or by game/season)
CREATE TABLE IF NOT EXISTS individual_mvps (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,
  mvp_type VARCHAR(50) NOT NULL CHECK (mvp_type IN ('game','weekly','season')),
  category VARCHAR(50) NOT NULL,
  week_number INTEGER,
  season VARCHAR(10) DEFAULT '2025',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create one published tournament if none
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM wildbrowl_tournaments WHERE status='published') THEN
    INSERT INTO wildbrowl_tournaments (name, description, entry_fee, max_participants, status, start_date)
    VALUES ('WildBrowl 2025', 'Torneo individual 1v1', 100, 32, 'published', '2025-10-01');
  END IF;
END $$;

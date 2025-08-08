-- 1) Ensure games has a 'stage' to support playoffs/semifinal/final
ALTER TABLE IF EXISTS games
  ADD COLUMN IF NOT EXISTS stage VARCHAR(30) DEFAULT 'regular';

-- Optional: constrain stage to known values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'games_stage_check'
      AND table_name = 'games'
  ) THEN
    ALTER TABLE games
      ADD CONSTRAINT games_stage_check
      CHECK (stage IN ('regular','quarterfinal','semifinal','final','third_place'));
  END IF;
END $$;

-- 2) Add photo_url to wildbrowl_participants so images can be shown
ALTER TABLE IF EXISTS wildbrowl_participants
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- 3) Create wildbrowl_matches table (scheduling 1v1)
CREATE TABLE IF NOT EXISTS wildbrowl_matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES wildbrowl_tournaments(id) ON DELETE CASCADE,
  participant1_id INTEGER REFERENCES wildbrowl_participants(id),
  participant2_id INTEGER REFERENCES wildbrowl_participants(id),
  winner_id INTEGER REFERENCES wildbrowl_participants(id),
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

CREATE INDEX IF NOT EXISTS idx_wb_matches_tournament ON wildbrowl_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_wb_matches_stage ON wildbrowl_matches(stage);

-- 4) Fix type mismatch between players.id and *_player_id columns safely
-- This script aligns player_stats.player_id and individual_mvps.player_id to the type of players.id
DO $fix$
DECLARE
  players_type TEXT;
  ps_type TEXT;
  im_type TEXT;
BEGIN
  -- Detect players.id type
  SELECT data_type INTO players_type
  FROM information_schema.columns
  WHERE table_name = 'players' AND column_name = 'id';

  IF players_type IS NULL THEN
    RAISE NOTICE 'Table players or column players.id not found. Skipping FK alignment.';
    RETURN;
  END IF;

  -- Ensure tables exist before modifying
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_stats') THEN
    CREATE TABLE player_stats (
      id SERIAL PRIMARY KEY,
      player_id UUID,
      game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
      touchdowns INTEGER DEFAULT 0,
      interceptions INTEGER DEFAULT 0,
      sacks INTEGER DEFAULT 0,
      rushing_yards INTEGER DEFAULT 0,
      passing_yards INTEGER DEFAULT 0,
      receiving_yards INTEGER DEFAULT 0,
      flags_pulled INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'individual_mvps') THEN
    CREATE TABLE individual_mvps (
      id SERIAL PRIMARY KEY,
      player_id UUID,
      game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
      mvp_type VARCHAR(50) NOT NULL CHECK (mvp_type IN ('game','weekly','season')),
      category VARCHAR(50) NOT NULL,
      week_number INTEGER,
      season VARCHAR(10) DEFAULT '2025',
      stats JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;

  -- Get current column types
  SELECT data_type INTO ps_type
  FROM information_schema.columns
  WHERE table_name = 'player_stats' AND column_name = 'player_id';

  SELECT data_type INTO im_type
  FROM information_schema.columns
  WHERE table_name = 'individual_mvps' AND column_name = 'player_id';

  -- Drop existing FKs if present
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'player_stats' AND constraint_name = 'player_stats_player_id_fkey'
  ) THEN
    ALTER TABLE player_stats DROP CONSTRAINT player_stats_player_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'individual_mvps' AND constraint_name = 'individual_mvps_player_id_fkey'
  ) THEN
    ALTER TABLE individual_mvps DROP CONSTRAINT individual_mvps_player_id_fkey;
  END IF;

  -- Align player_stats.player_id type
  IF players_type = 'uuid' AND ps_type <> 'uuid' THEN
    -- Convert to UUID, null any incompatible values
    ALTER TABLE player_stats
      ALTER COLUMN player_id TYPE UUID USING NULL::uuid;
  ELSIF players_type = 'integer' AND ps_type <> 'integer' THEN
    -- Convert to integer, null any incompatible values
    ALTER TABLE player_stats
      ALTER COLUMN player_id TYPE INTEGER USING NULL::integer;
  END IF;

  -- Align individual_mvps.player_id type
  IF players_type = 'uuid' AND im_type <> 'uuid' THEN
    ALTER TABLE individual_mvps
      ALTER COLUMN player_id TYPE UUID USING NULL::uuid;
  ELSIF players_type = 'integer' AND im_type <> 'integer' THEN
    ALTER TABLE individual_mvps
      ALTER COLUMN player_id TYPE INTEGER USING NULL::integer;
  END IF;

  -- Re-add FKs
  ALTER TABLE player_stats
    ADD CONSTRAINT player_stats_player_id_fkey
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

  ALTER TABLE individual_mvps
    ADD CONSTRAINT individual_mvps_player_id_fkey
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

  RAISE NOTICE 'Aligned player_id types to % and re-created FKs.', players_type;
END
$fix$;

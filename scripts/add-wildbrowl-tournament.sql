-- Crear tabla para el torneo WildBrowl 1v1
CREATE TABLE IF NOT EXISTS wildbrowl_tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entry_fee DECIMAL(10,2) DEFAULT 100.00,
    max_participants INTEGER DEFAULT 32,
    status VARCHAR(50) DEFAULT 'registration_open',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para participantes del WildBrowl
CREATE TABLE IF NOT EXISTS wildbrowl_participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES wildbrowl_tournaments(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    category VARCHAR(50) NOT NULL CHECK (category IN ('femenil', 'varonil')),
    payment_status VARCHAR(50) DEFAULT 'pending',
    bracket_position INTEGER,
    eliminated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para los enfrentamientos del WildBrowl
CREATE TABLE IF NOT EXISTS wildbrowl_matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES wildbrowl_tournaments(id) ON DELETE CASCADE,
    participant1_id INTEGER REFERENCES wildbrowl_participants(id),
    participant2_id INTEGER REFERENCES wildbrowl_participants(id),
    winner_id INTEGER REFERENCES wildbrowl_participants(id),
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    score_p1 INTEGER DEFAULT 0,
    score_p2 INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    match_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arreglar el constraint que ya existe
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_category_check;

-- Agregar categoría Cooper a las categorías existentes
ALTER TABLE teams 
ADD CONSTRAINT teams_category_check 
CHECK (category IN ('varonil-gold', 'varonil-silver', 'femenil-gold', 'femenil-silver', 'mixto-gold', 'mixto-silver', 'femenil-cooper'));

-- Crear tabla para MVPs individuales
CREATE TABLE IF NOT EXISTS individual_mvps (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    mvp_type VARCHAR(50) NOT NULL CHECK (mvp_type IN ('game', 'weekly', 'season')),
    category VARCHAR(50) NOT NULL,
    week_number INTEGER,
    season VARCHAR(10) DEFAULT '2025',
    stats JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para estadísticas individuales de jugadores
CREATE TABLE IF NOT EXISTS player_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
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

-- Agregar campos para imágenes a las tablas existentes
ALTER TABLE teams ADD COLUMN IF NOT EXISTS captain_photo_url VARCHAR(500);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_educational BOOLEAN DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS educational_coordinator VARCHAR(255);

ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- Crear tabla para permisos de entrenadores/capitanes
CREATE TABLE IF NOT EXISTS coach_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    can_manage_players BOOLEAN DEFAULT TRUE,
    can_upload_logo BOOLEAN DEFAULT TRUE,
    can_upload_photos BOOLEAN DEFAULT FALSE,
    can_view_stats BOOLEAN DEFAULT TRUE,
    approved_by_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar torneo WildBrowl de ejemplo
INSERT INTO wildbrowl_tournaments (name, description, entry_fee, max_participants, status, start_date)
VALUES ('WildBrowl 2025', 'Torneo individual 1v1 - Categorías Femenil y Varonil', 100.00, 32, 'registration_open', '2025-02-01');

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_wildbrowl_participants_tournament ON wildbrowl_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_wildbrowl_participants_category ON wildbrowl_participants(category);
CREATE INDEX IF NOT EXISTS idx_wildbrowl_matches_tournament ON wildbrowl_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_individual_mvps_player ON individual_mvps(player_id);
CREATE INDEX IF NOT EXISTS idx_individual_mvps_type ON individual_mvps(mvp_type);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_game ON player_stats(game_id);

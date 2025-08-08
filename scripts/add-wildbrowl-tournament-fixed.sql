-- Crear tabla para el torneo WildBrowl 1v1
CREATE TABLE IF NOT EXISTS wildbrowl_tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entry_fee DECIMAL(10,2) DEFAULT 100.00,
    max_participants INTEGER DEFAULT 32,
    status VARCHAR(50) DEFAULT 'disabled',
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

-- Crear tabla para configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arreglar el constraint de teams si existe
DO $$ 
BEGIN
    -- Verificar si la tabla teams existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        -- Eliminar constraint existente si existe
        ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_category_check;
        
        -- Agregar nuevo constraint con categoría Cooper
        ALTER TABLE teams 
        ADD CONSTRAINT teams_category_check 
        CHECK (category IN ('varonil-gold', 'varonil-silver', 'femenil-gold', 'femenil-silver', 'mixto-gold', 'mixto-silver', 'femenil-cooper'));
        
        -- Agregar campos adicionales a teams
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS captain_photo_url VARCHAR(500);
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_educational BOOLEAN DEFAULT FALSE;
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS educational_coordinator VARCHAR(255);
    END IF;
END $$;

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

-- Solo crear tablas que dependen de games si games existe
DO $$ 
DECLARE
    players_id_type TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'games') THEN
        -- Verificar el tipo de datos de players.id
        SELECT data_type INTO players_id_type
        FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'id';
        
        -- Crear tabla para MVPs individuales
        CREATE TABLE IF NOT EXISTS individual_mvps (
            id SERIAL PRIMARY KEY,
            player_id UUID, -- Usar UUID por defecto
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
            player_id UUID, -- Usar UUID por defecto
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
        
        -- Solo agregar foreign keys si la tabla players existe
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
            -- Ajustar tipo de columna según el tipo de players.id
            IF players_id_type = 'integer' THEN
                ALTER TABLE individual_mvps ALTER COLUMN player_id TYPE INTEGER;
                ALTER TABLE player_stats ALTER COLUMN player_id TYPE INTEGER;
            END IF;
            
            -- Agregar foreign keys
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'individual_mvps_player_id_fkey' 
                AND table_name = 'individual_mvps'
            ) THEN
                ALTER TABLE individual_mvps 
                ADD CONSTRAINT individual_mvps_player_id_fkey 
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
            END IF;
            
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'player_stats_player_id_fkey' 
                AND table_name = 'player_stats'
            ) THEN
                ALTER TABLE player_stats 
                ADD CONSTRAINT player_stats_player_id_fkey 
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
            END IF;
        END IF;
        
        RAISE NOTICE 'Tables individual_mvps and player_stats created successfully with player_id type: %', COALESCE(players_id_type, 'UUID');
    ELSE
        RAISE NOTICE 'Table games does not exist, skipping individual_mvps and player_stats creation';
    END IF;
END $$;

-- Agregar columna photo_url a players si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
        ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
        RAISE NOTICE 'Added photo_url column to players table';
    ELSE
        RAISE NOTICE 'Table players does not exist, skipping photo_url addition';
    END IF;
END $$;

-- Insertar configuraciones del sistema
INSERT INTO system_config (config_key, config_value, description) 
VALUES 
    ('wildbrowl_enabled', 'false', 'Habilitar/deshabilitar el torneo WildBrowl'),
    ('season_started', 'false', 'Indica si la temporada ya comenzó'),
    ('registration_deadline', '2025-09-15', 'Fecha límite de inscripciones'),
    ('season_start_date', '2025-09-21', 'Fecha de inicio de temporada')
ON CONFLICT (config_key) DO NOTHING;

-- Insertar torneo WildBrowl deshabilitado por defecto
INSERT INTO wildbrowl_tournaments (name, description, entry_fee, max_participants, status, start_date)
VALUES ('WildBrowl 2025', 'Torneo individual 1v1 - Categorías Femenil y Varonil', 100.00, 32, 'disabled', '2025-02-01')
ON CONFLICT DO NOTHING;

-- Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_wildbrowl_participants_tournament ON wildbrowl_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_wildbrowl_participants_category ON wildbrowl_participants(category);
CREATE INDEX IF NOT EXISTS idx_wildbrowl_matches_tournament ON wildbrowl_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Crear índices solo si las tablas existen
DO $$ 
BEGIN
    -- Índices para individual_mvps
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'individual_mvps') THEN
        CREATE INDEX IF NOT EXISTS idx_individual_mvps_type ON individual_mvps(mvp_type);
        CREATE INDEX IF NOT EXISTS idx_individual_mvps_category ON individual_mvps(category);
        CREATE INDEX IF NOT EXISTS idx_individual_mvps_season ON individual_mvps(season);
        CREATE INDEX IF NOT EXISTS idx_individual_mvps_player ON individual_mvps(player_id);
        CREATE INDEX IF NOT EXISTS idx_individual_mvps_game ON individual_mvps(game_id);
        
        RAISE NOTICE 'Created indexes for individual_mvps table';
    END IF;
    
    -- Índices para player_stats
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_stats') THEN
        CREATE INDEX IF NOT EXISTS idx_player_stats_game ON player_stats(game_id);
        CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id);
        
        RAISE NOTICE 'Created indexes for player_stats table';
    END IF;
END $$;

-- Crear índices para coach_permissions
CREATE INDEX IF NOT EXISTS idx_coach_permissions_user ON coach_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_permissions_team ON coach_permissions(team_id);

-- Mensaje final
DO $$ 
BEGIN
    RAISE NOTICE 'WildBrowl tournament system setup completed successfully!';
    RAISE NOTICE 'System configuration table created with default values';
    RAISE NOTICE 'WildBrowl is disabled by default - enable from admin dashboard';
END $$;

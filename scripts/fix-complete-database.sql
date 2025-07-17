-- Este script consolida todas las correcciones y adiciones de estructura de la base de datos.
-- Está diseñado para ser idempotente, lo que significa que puedes ejecutarlo varias veces sin problemas.

-- Paso 0: Crear el tipo ENUM 'team_type_enum' si no existe y añadir valores.
-- Esto debe hacerse antes de modificar la columna 'type' en 'teams'.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_type_enum') THEN
        CREATE TYPE team_type_enum AS ENUM ('particular', 'club', 'escuela');
    END IF;
END $$;

-- Añadir valores al ENUM si no existen (sin IF NOT EXISTS en ALTER TYPE ADD VALUE)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'team_type_enum'::regtype AND enumlabel = 'particular') THEN
        ALTER TYPE team_type_enum ADD VALUE 'particular';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'team_type_enum'::regtype AND enumlabel = 'club') THEN
        ALTER TYPE team_type_enum ADD VALUE 'club';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'team_type_enum'::regtype AND enumlabel = 'escuela') THEN
        ALTER TYPE team_type_enum ADD VALUE 'escuela';
    END IF;
END $$;


-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL, -- 'admin', 'staff', 'referee', 'user'
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asegurar columnas y propiedades para 'users'
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20);
UPDATE users SET status = 'active' WHERE status IS NULL;
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE users ALTER COLUMN status SET NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;


-- Tabla de Equipos
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    captain_name VARCHAR(100) NOT NULL,
    captain_phone VARCHAR(20) NOT NULL,
    captain_email VARCHAR(100),
    coach_name VARCHAR(100),
    logo_url TEXT,
    type team_type_enum DEFAULT 'particular' NOT NULL, -- Usar el tipo ENUM
    color1 VARCHAR(7) DEFAULT '#c666b9' NOT NULL,
    color2 VARCHAR(7) DEFAULT '#e16c1c' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asegurar columnas y propiedades para 'teams'
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_name VARCHAR(100);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS type VARCHAR(20); -- Añadir como VARCHAR temporalmente si no existe
-- Convertir la columna 'type' al tipo ENUM si aún no lo es
ALTER TABLE teams ALTER COLUMN type TYPE team_type_enum USING type::text::team_type_enum;
UPDATE teams SET type = 'particular' WHERE type IS NULL;
ALTER TABLE teams ALTER COLUMN type SET DEFAULT 'particular';
ALTER TABLE teams ALTER COLUMN type SET NOT NULL;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS color1 VARCHAR(7);
UPDATE teams SET color1 = '#c666b9' WHERE color1 IS NULL;
ALTER TABLE teams ALTER COLUMN color1 SET DEFAULT '#c666b9';
ALTER TABLE teams ALTER COLUMN color1 SET NOT NULL;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS color2 VARCHAR(7);
UPDATE teams SET color2 = '#e16c1c' WHERE color2 IS NULL;
ALTER TABLE teams ALTER COLUMN color2 SET DEFAULT '#e16c1c';
ALTER TABLE teams ALTER COLUMN color2 SET NOT NULL;


-- Tabla de Staff (incluye árbitros y paramédicos)
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Enlaza con la tabla de usuarios si tiene acceso al sistema
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'coordinador', 'asistente', 'arbitro', 'paramedico', 'seguridad', 'limpieza', 'marketing'
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    hourly_rate NUMERIC(10, 2),
    department VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asegurar columnas y propiedades para 'staff'
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email VARCHAR(100);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_email_key') THEN
        ALTER TABLE staff ADD CONSTRAINT staff_email_key UNIQUE (email);
    END IF;
END $$;


-- Tabla de Jugadores
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    jersey_number INTEGER NOT NULL,
    position VARCHAR(50),
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, jersey_number) -- Un jugador solo puede tener un número de jersey por equipo
);

-- Asegurar columnas y propiedades para 'players'
ALTER TABLE players ADD COLUMN IF NOT EXISTS status VARCHAR(20);
UPDATE players SET status = 'active' WHERE status IS NULL;
ALTER TABLE players ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE players ALTER COLUMN status SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_team_id_jersey_number_key') THEN
        ALTER TABLE players ADD CONSTRAINT players_team_id_jersey_number_key UNIQUE (team_id, jersey_number);
    END IF;
END $$;


-- Tabla de Sedes (Venues)
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Tabla de Campos (Fields)
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Campo 1', 'Cancha Principal'
    field_type VARCHAR(50), -- 'natural_grass', 'artificial_turf', 'indoor'
    dimensions VARCHAR(50), -- e.g., '100x50m'
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(venue_id, name) -- Un campo debe ser único dentro de una sede
);


-- Tabla de Partidos
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- Debe coincidir con la categoría de los equipos
    referee1_id INTEGER REFERENCES staff(id) ON DELETE SET NULL, -- Rol 'arbitro'
    referee2_id INTEGER REFERENCES staff(id) ON DELETE SET NULL, -- Opcional
    status VARCHAR(20) DEFAULT 'scheduled' NOT NULL, -- 'scheduled', 'live', 'finished', 'cancelled', 'postponed'
    week_number INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_teams_different CHECK (home_team_id <> away_team_id)
);

-- Asegurar columna field_id en 'games'
ALTER TABLE games ADD COLUMN IF NOT EXISTS field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL;


-- Tabla de Estadísticas de Equipo (por temporada)
CREATE TABLE IF NOT EXISTS team_stats (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    games_played INTEGER DEFAULT 0 NOT NULL,
    games_won INTEGER DEFAULT 0 NOT NULL,
    games_lost INTEGER DEFAULT 0 NOT NULL,
    games_tied INTEGER DEFAULT 0 NOT NULL,
    points_for INTEGER DEFAULT 0 NOT NULL,
    points_against INTEGER DEFAULT 0 NOT NULL,
    point_difference INTEGER DEFAULT 0 NOT NULL,
    win_percentage NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, season)
);

-- Asegurar columnas y propiedades para 'team_stats'
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_played INTEGER;
UPDATE team_stats SET games_played = 0 WHERE games_played IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_played SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_played SET NOT NULL;

ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_won INTEGER;
UPDATE team_stats SET games_won = 0 WHERE games_won IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_won SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_won SET NOT NULL;

ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_lost INTEGER;
UPDATE team_stats SET games_lost = 0 WHERE games_lost IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_lost SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_lost SET NOT NULL;

ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_tied INTEGER;
UPDATE team_stats SET games_tied = 0 WHERE games_tied IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_tied SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_tied SET NOT NULL;

ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS points_for INTEGER;
UPDATE team_stats SET points_for = 0 WHERE points_for IS NULL;
ALTER TABLE team_stats ALTER COLUMN points_for SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN points_for SET NOT NULL;

ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS points_against INTEGER;
UPDATE team_stats SET points_against = 0 WHERE points_against IS NULL;
ALTER TABLE team_stats ALTER COLUMN points_against SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN points_against SET NOT NULL;

ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS point_difference INTEGER;
UPDATE team_stats SET point_difference = 0 WHERE point_difference IS NULL;
ALTER TABLE team_stats ALTER COLUMN point_difference SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN point_difference SET NOT NULL;

ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS win_percentage NUMERIC(5, 2);
UPDATE team_stats SET win_percentage = 0.00 WHERE win_percentage IS NULL;
ALTER TABLE team_stats ALTER COLUMN win_percentage SET DEFAULT 0.00;
ALTER TABLE team_stats ALTER COLUMN win_percentage SET NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_stats_team_id_season_key') THEN
        ALTER TABLE team_stats ADD CONSTRAINT team_stats_team_id_season_key UNIQUE (team_id, season);
    END IF;
END $$;


-- Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'team_registration', 'referee_payment', 'staff_payment', 'fine', 'penalty', 'paramedic_payment'
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'paid', 'overdue', 'cancelled'
    description TEXT,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    referee_id INTEGER REFERENCES staff(id) ON DELETE SET NULL, -- Si el pago es a un árbitro
    staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL, -- Si el pago es a otro miembro del staff
    beneficiary_name VARCHAR(100), -- Nombre del beneficiario si no es un equipo o staff registrado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asegurar columna beneficiary_name en 'payments'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(100);


-- Función para actualizar `updated_at` automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para `updated_at` (crear solo si no existen)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_teams_updated_at') THEN
        CREATE TRIGGER update_teams_updated_at
        BEFORE UPDATE ON teams
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_players_updated_at') THEN
        CREATE TRIGGER update_players_updated_at
        BEFORE UPDATE ON players
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_staff_updated_at') THEN
        CREATE TRIGGER update_staff_updated_at
        BEFORE UPDATE ON staff
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_venues_updated_at') THEN
        CREATE TRIGGER update_venues_updated_at
        BEFORE UPDATE ON venues
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fields_updated_at') THEN
        CREATE TRIGGER update_fields_updated_at
        BEFORE UPDATE ON fields
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_games_updated_at') THEN
        CREATE TRIGGER update_games_updated_at
        BEFORE UPDATE ON games
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_stats_updated_at') THEN
        CREATE TRIGGER update_team_stats_updated_at
        BEFORE UPDATE ON team_stats
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at
        BEFORE UPDATE ON payments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;


-- Función para calcular y actualizar las estadísticas del equipo
CREATE OR REPLACE FUNCTION calculate_team_stats()
RETURNS TRIGGER AS $$
DECLARE
    home_team_id_val INT;
    away_team_id_val INT;
    home_score_val INT;
    away_score_val INT;
    current_season INT := EXTRACT(YEAR FROM NOW()); -- Asume la temporada actual como el año actual
BEGIN
    -- Determinar si es un INSERT o UPDATE y obtener los valores relevantes
    IF TG_OP = 'INSERT' THEN
        home_team_id_val := NEW.home_team_id;
        away_team_id_val := NEW.away_team_id;
        home_score_val := NEW.home_score;
        away_score_val := NEW.away_score;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo recalcular si los scores o el estado cambian a 'finished'
        IF OLD.home_score IS NOT DISTINCT FROM NEW.home_score OR
           OLD.away_score IS NOT DISTINCT FROM NEW.away_score OR
           OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'finished' THEN
            home_team_id_val := NEW.home_team_id;
            away_team_id_val := NEW.away_team_id;
            home_score_val := NEW.home_score;
            away_score_val := NEW.away_score;
        ELSE
            RETURN NEW; -- No hay cambios relevantes para las estadísticas
        END IF;
    ELSE
        RETURN NEW; -- No aplica para DELETE
    END IF;

    -- Actualizar estadísticas para el equipo local
    INSERT INTO team_stats (team_id, season, games_played, games_won, games_lost, games_tied, points_for, points_against, point_difference, win_percentage)
    VALUES (home_team_id_val, current_season, 0, 0, 0, 0, 0, 0, 0, 0.00)
    ON CONFLICT (team_id, season) DO UPDATE SET updated_at = NOW();

    UPDATE team_stats
    SET
        games_played = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_won = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_lost = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score < away_score) OR (away_team_id = team_stats.team_id AND away_score < home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_tied = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND home_score = away_score AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_for = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score ELSE away_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_against = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN away_score ELSE home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        point_difference = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score - away_score ELSE away_score - home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        win_percentage = CASE
            WHEN (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season) = 0 THEN 0.00
            ELSE (SELECT (COUNT(CASE WHEN (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) THEN 1 END) * 100.0) / COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season)
        END
    WHERE team_id = home_team_id_val AND season = current_season;

    -- Actualizar estadísticas para el equipo visitante
    INSERT INTO team_stats (team_id, season, games_played, games_won, games_lost, games_tied, points_for, points_against, point_difference, win_percentage)
    VALUES (away_team_id_val, current_season, 0, 0, 0, 0, 0, 0, 0, 0.00)
    ON CONFLICT (team_id, season) DO UPDATE SET updated_at = NOW();

    UPDATE team_stats
    SET
        games_played = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_won = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_lost = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score < away_score) OR (away_team_id = team_stats.team_id AND away_score < home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_tied = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND home_score = away_score AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_for = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score ELSE away_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_against = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN away_score ELSE home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        point_difference = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score - away_score ELSE away_score - home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        win_percentage = CASE
            WHEN (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season) = 0 THEN 0.00
            ELSE (SELECT (COUNT(CASE WHEN (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) THEN 1 END) * 100.0) / COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season)
        END
    WHERE team_id = away_team_id_val AND season = current_season;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función después de INSERT o UPDATE en la tabla 'games'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_team_stats') THEN
        CREATE TRIGGER trg_update_team_stats
        AFTER INSERT OR UPDATE OF home_score, away_score, status ON games
        FOR EACH ROW
        WHEN (NEW.status = 'finished') -- Solo cuando el partido está finalizado
        EXECUTE FUNCTION calculate_team_stats();
    END IF;
END $$;

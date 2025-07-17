-- Este script asegura que las tablas y columnas necesarias existan y tengan las propiedades correctas.
-- Es idempotente, lo que significa que puedes ejecutarlo varias veces sin problemas.

-- Asegurar que la tabla 'users' exista y tenga las columnas básicas
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Añadir columnas a 'users' si no existen
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Asegurar valores por defecto y NOT NULL para columnas existentes en 'users'
UPDATE users SET status = 'active' WHERE status IS NULL;
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE users ALTER COLUMN status SET NOT NULL;

UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;

UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;

-- Asegurar que la tabla 'staff' exista y tenga la columna user_id
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Enlaza con la tabla de usuarios
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    hourly_rate NUMERIC(10, 2),
    department VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Añadir user_id a 'staff' si no existe
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Asegurar que la tabla 'players' exista y tenga las columnas necesarias
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
    UNIQUE(team_id, jersey_number)
);

-- Añadir columnas a 'players' si no existen
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS position VARCHAR(50);
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Asegurar valores por defecto y NOT NULL para columnas existentes en 'players'
UPDATE players SET status = 'active' WHERE status IS NULL;
ALTER TABLE players ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE players ALTER COLUMN status SET NOT NULL;

UPDATE players SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE players ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE players ALTER COLUMN created_at SET NOT NULL;

UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
ALTER TABLE players ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE players ALTER COLUMN updated_at SET NOT NULL;

-- Asegurar la restricción UNIQUE para (team_id, jersey_number) en 'players'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'players_team_id_jersey_number_key') THEN
        ALTER TABLE players ADD CONSTRAINT players_team_id_jersey_number_key UNIQUE (team_id, jersey_number);
    END IF;
END $$;

-- Asegurar que la tabla 'fields' exista y tenga la columna venue_id
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50),
    dimensions VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(venue_id, name)
);

-- Añadir columnas a 'fields' si no existen
ALTER TABLE fields ADD COLUMN IF NOT EXISTS venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS dimensions VARCHAR(50);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Asegurar valores por defecto y NOT NULL para columnas existentes en 'fields'
UPDATE fields SET status = 'active' WHERE status IS NULL;
ALTER TABLE fields ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE fields ALTER COLUMN status SET NOT NULL;

UPDATE fields SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE fields ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE fields ALTER COLUMN created_at SET NOT NULL;

UPDATE fields SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
ALTER TABLE fields ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE fields ALTER COLUMN updated_at SET NOT NULL;

-- Asegurar la restricción UNIQUE para (venue_id, name) en 'fields'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fields_venue_id_name_key') THEN
        ALTER TABLE fields ADD CONSTRAINT fields_venue_id_name_key UNIQUE (venue_id, name);
    END IF;
END $$;

-- Asegurar que la tabla 'team_stats' exista y tenga las columnas necesarias
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

-- Añadir columnas a 'team_stats' si no existen
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS season INTEGER;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_lost INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS games_tied INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS points_for INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS points_against INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS point_difference INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS win_percentage NUMERIC(5, 2) DEFAULT 0.00 NOT NULL;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Asegurar valores por defecto y NOT NULL para columnas existentes en 'team_stats'
UPDATE team_stats SET games_played = 0 WHERE games_played IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_played SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_played SET NOT NULL;

UPDATE team_stats SET games_won = 0 WHERE games_won IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_won SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_won SET NOT NULL;

UPDATE team_stats SET games_lost = 0 WHERE games_lost IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_lost SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_lost SET NOT NULL;

UPDATE team_stats SET games_tied = 0 WHERE games_tied IS NULL;
ALTER TABLE team_stats ALTER COLUMN games_tied SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN games_tied SET NOT NULL;

UPDATE team_stats SET points_for = 0 WHERE points_for IS NULL;
ALTER TABLE team_stats ALTER COLUMN points_for SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN points_for SET NOT NULL;

UPDATE team_stats SET points_against = 0 WHERE points_against IS NULL;
ALTER TABLE team_stats ALTER COLUMN points_against SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN points_against SET NOT NULL;

UPDATE team_stats SET point_difference = 0 WHERE point_difference IS NULL;
ALTER TABLE team_stats ALTER COLUMN point_difference SET DEFAULT 0;
ALTER TABLE team_stats ALTER COLUMN point_difference SET NOT NULL;

UPDATE team_stats SET win_percentage = 0.00 WHERE win_percentage IS NULL;
ALTER TABLE team_stats ALTER COLUMN win_percentage SET DEFAULT 0.00;
ALTER TABLE team_stats ALTER COLUMN win_percentage SET NOT NULL;

UPDATE team_stats SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
ALTER TABLE team_stats ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE team_stats ALTER COLUMN created_at SET NOT NULL;

UPDATE team_stats SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
ALTER TABLE team_stats ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE team_stats ALTER COLUMN updated_at SET NOT NULL;

-- Asegurar la restricción UNIQUE para (team_id, season) en 'team_stats'
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_stats_team_id_season_key') THEN
        ALTER TABLE team_stats ADD CONSTRAINT team_stats_team_id_season_key UNIQUE (team_id, season);
    END IF;
END $$;

-- Asegurar que la tabla 'games' exista y tenga la columna field_id
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
    category VARCHAR(50) NOT NULL,
    referee1_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    referee2_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
    week_number INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_teams_different CHECK (home_team_id <> away_team_id)
);

-- Añadir field_id a 'games' si no existe
ALTER TABLE games ADD COLUMN IF NOT EXISTS field_id INTEGER REFERENCES fields(id) ON DELETE SET NULL;

-- Asegurar que la tabla 'payments' exista y tenga las columnas necesarias
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    description TEXT,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    referee_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    beneficiary_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Añadir beneficiary_name a 'payments' si no existe
ALTER TABLE payments ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(100);

-- Crear o reemplazar la función para actualizar 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear o reemplazar triggers para todas las tablas
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

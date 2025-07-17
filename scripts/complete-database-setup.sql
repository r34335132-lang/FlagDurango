-- Eliminar tablas existentes si existen
DROP TABLE IF EXISTS game_stats CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS referees CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS fields CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de sedes
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50) DEFAULT 'Durango',
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de campos
CREATE TABLE fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    venue_id INTEGER REFERENCES venues(id),
    surface_type VARCHAR(50) DEFAULT 'natural',
    capacity INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de equipos
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    logo_url TEXT,
    color1 VARCHAR(7) DEFAULT '#1e40af',
    color2 VARCHAR(7) DEFAULT '#fbbf24',
    status VARCHAR(20) DEFAULT 'active',
    season INTEGER DEFAULT 2025,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de jugadores
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    position VARCHAR(20),
    jersey_number INTEGER,
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, jersey_number)
);

-- Crear tabla de árbitros
CREATE TABLE referees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    certification_level VARCHAR(20) DEFAULT 'basico',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de partidos
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    game_date DATE NOT NULL,
    game_time TIME NOT NULL,
    venue VARCHAR(100),
    field VARCHAR(50),
    category VARCHAR(50) NOT NULL,
    referee1 VARCHAR(100),
    referee2 VARCHAR(100),
    mvp VARCHAR(100),
    status VARCHAR(20) DEFAULT 'programado',
    season INTEGER DEFAULT 2025,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de noticias
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    author VARCHAR(100) DEFAULT 'Liga Flag Durango',
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de estadísticas de equipos
CREATE TABLE team_stats (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    team_category VARCHAR(50) NOT NULL,
    season INTEGER DEFAULT 2025,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_tied INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, season)
);

-- Insertar usuario administrador por defecto
INSERT INTO users (username, email, password_hash, role, status) VALUES 
('admin', 'admin@ligaflagdurango.com', '$2b$10$rQJ5qzXvHKGHvJ5qzXvHKGHvJ5qzXvHKGHvJ5qzXvHKGHvJ5qzXvHK', 'admin', 'active');

-- Insertar sedes por defecto
INSERT INTO venues (name, address, city, phone) VALUES 
('Estadio Municipal', 'Av. 20 de Noviembre 123', 'Durango', '618-123-4567'),
('Campo Norte', 'Blvd. Dolores del Río 456', 'Durango', '618-234-5678'),
('Complejo Sur', 'Av. Universidad 789', 'Durango', '618-345-6789'),
('Unidad Central', 'Calle Constitución 321', 'Durango', '618-456-7890');

-- Insertar campos por defecto
INSERT INTO fields (name, venue_id, surface_type, capacity) VALUES 
('Campo A', 1, 'natural', 150),
('Campo B', 1, 'natural', 150),
('Campo C', 1, 'artificial', 200),
('Campo D', 2, 'natural', 120),
('Campo E', 2, 'natural', 120),
('Campo F', 2, 'artificial', 180),
('Campo G', 3, 'natural', 100),
('Campo H', 3, 'natural', 100),
('Campo I', 3, 'artificial', 160),
('Campo J', 4, 'natural', 130),
('Campo K', 4, 'natural', 130),
('Campo L', 4, 'artificial', 170);

-- Crear función para actualizar estadísticas automáticamente
CREATE OR REPLACE FUNCTION update_team_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar estadísticas del equipo local
    INSERT INTO team_stats (team_id, team_name, team_category, season, games_played, games_won, games_lost, games_tied, points_for, points_against, points)
    SELECT 
        t.id,
        t.name,
        t.category,
        NEW.season,
        1,
        CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
        CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
        CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
        NEW.home_score,
        NEW.away_score,
        CASE 
            WHEN NEW.home_score > NEW.away_score THEN 3
            WHEN NEW.home_score = NEW.away_score THEN 1
            ELSE 0
        END
    FROM teams t
    WHERE t.name = NEW.home_team
    ON CONFLICT (team_id, season) DO UPDATE SET
        games_played = team_stats.games_played + 1,
        games_won = team_stats.games_won + CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
        games_lost = team_stats.games_lost + CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
        games_tied = team_stats.games_tied + CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
        points_for = team_stats.points_for + NEW.home_score,
        points_against = team_stats.points_against + NEW.away_score,
        points = team_stats.points + CASE 
            WHEN NEW.home_score > NEW.away_score THEN 3
            WHEN NEW.home_score = NEW.away_score THEN 1
            ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP;

    -- Actualizar estadísticas del equipo visitante
    INSERT INTO team_stats (team_id, team_name, team_category, season, games_played, games_won, games_lost, games_tied, points_for, points_against, points)
    SELECT 
        t.id,
        t.name,
        t.category,
        NEW.season,
        1,
        CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
        CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
        CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
        NEW.away_score,
        NEW.home_score,
        CASE 
            WHEN NEW.away_score > NEW.home_score THEN 3
            WHEN NEW.away_score = NEW.home_score THEN 1
            ELSE 0
        END
    FROM teams t
    WHERE t.name = NEW.away_team
    ON CONFLICT (team_id, season) DO UPDATE SET
        games_played = team_stats.games_played + 1,
        games_won = team_stats.games_won + CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
        games_lost = team_stats.games_lost + CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
        games_tied = team_stats.games_tied + CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
        points_for = team_stats.points_for + NEW.away_score,
        points_against = team_stats.points_against + NEW.home_score,
        points = team_stats.points + CASE 
            WHEN NEW.away_score > NEW.home_score THEN 3
            WHEN NEW.away_score = NEW.home_score THEN 1
            ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar estadísticas cuando se actualiza un juego
CREATE TRIGGER update_stats_trigger
    AFTER UPDATE OF home_score, away_score ON games
    FOR EACH ROW
    WHEN (NEW.status = 'finalizado' AND (OLD.home_score IS DISTINCT FROM NEW.home_score OR OLD.away_score IS DISTINCT FROM NEW.away_score))
    EXECUTE FUNCTION update_team_stats();

-- Insertar algunos datos de ejemplo
INSERT INTO teams (name, category, contact_name, contact_phone, contact_email, color1, color2) VALUES 
('Águilas Doradas', 'varonil-gold', 'Juan Pérez', '618-111-1111', 'juan@aguilas.com', '#FFD700', '#8B4513'),
('Lobos Plateados', 'varonil-silver', 'María García', '618-222-2222', 'maria@lobos.com', '#C0C0C0', '#000080'),
('Panteras Rosas', 'femenil-gold', 'Ana López', '618-333-3333', 'ana@panteras.com', '#FF69B4', '#800080'),
('Tigres Mixtos', 'mixto-silver', 'Carlos Ruiz', '618-444-4444', 'carlos@tigres.com', '#FF8C00', '#000000');

INSERT INTO referees (name, phone, email, certification_level) VALUES 
('Roberto Martínez', '618-555-1111', 'roberto@arbitros.com', 'avanzado'),
('Laura Sánchez', '618-555-2222', 'laura@arbitros.com', 'intermedio'),
('Miguel Torres', '618-555-3333', 'miguel@arbitros.com', 'basico'),
('Carmen Flores', '618-555-4444', 'carmen@arbitros.com', 'avanzado');

INSERT INTO players (name, team_id, position, jersey_number, birth_date, phone) VALUES 
('Diego Hernández', 1, 'QB', 12, '1995-03-15', '618-666-1111'),
('Luis Morales', 1, 'RB', 21, '1996-07-22', '618-666-2222'),
('Sofia Ramírez', 3, 'QB', 7, '1997-11-08', '618-666-3333'),
('Andrea Vega', 3, 'WR', 15, '1998-05-12', '618-666-4444');

INSERT INTO news (title, content, image_url, author) VALUES 
('Inicia la Temporada 2025', 'La Liga Flag Durango da inicio oficial a la temporada 2025 con grandes expectativas y nuevos equipos participantes.', 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800', 'Liga Flag Durango'),
('Nuevos Campos Disponibles', 'Se han habilitado nuevos campos de juego para brindar mejor experiencia a todos los equipos participantes.', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800', 'Administración');

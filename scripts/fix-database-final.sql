-- Eliminar todas las tablas existentes para evitar conflictos
DROP TABLE IF EXISTS team_stats CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS referees CASCADE;
DROP TABLE IF EXISTS fields CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'staff', 'referee')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de campos
CREATE TABLE fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    venue_id INTEGER REFERENCES venues(id),
    surface_type VARCHAR(30) DEFAULT 'artificial',
    capacity INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de equipos
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('femenil-silver', 'femenil-gold', 'varonil-silver', 'varonil-gold', 'mixto-silver', 'mixto-gold')),
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    logo_url TEXT,
    color1 VARCHAR(7) DEFAULT '#1e40af',
    color2 VARCHAR(7) DEFAULT '#fbbf24',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    season INTEGER DEFAULT 2025,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category, season)
);

-- Crear tabla de jugadores
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    position VARCHAR(20),
    jersey_number INTEGER CHECK (jersey_number BETWEEN 1 AND 99),
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, jersey_number)
);

-- Crear tabla de árbitros
CREATE TABLE referees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    certification_level VARCHAR(20) DEFAULT 'basico' CHECK (certification_level IN ('basico', 'intermedio', 'avanzado')),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    category VARCHAR(30) NOT NULL,
    referee1 VARCHAR(100),
    referee2 VARCHAR(100),
    mvp VARCHAR(100),
    status VARCHAR(20) DEFAULT 'programado' CHECK (status IN ('programado', 'en_vivo', 'finalizado', 'cancelado')),
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
    author VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de estadísticas de equipos
CREATE TABLE team_stats (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_category VARCHAR(30) NOT NULL,
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
    UNIQUE(team_name, team_category, season)
);

-- Insertar usuario administrador
INSERT INTO users (username, email, password_hash, role, status) VALUES 
('admin', 'admin@ligaflagdurango.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

-- Insertar sedes
INSERT INTO venues (name, address, city, phone) VALUES 
('Unidad Deportiva Revolución', 'Av. Universidad s/n', 'Durango', '618-123-4567'),
('Campo Durango FC', 'Blvd. Dolores del Río 123', 'Durango', '618-234-5678'),
('Deportivo Municipal', 'Calle 20 de Noviembre 456', 'Durango', '618-345-6789'),
('Centro Deportivo Norte', 'Av. Las Torres 789', 'Durango', '618-456-7890');

-- Insertar campos
INSERT INTO fields (name, venue_id, surface_type, capacity) VALUES 
('Campo A', 1, 'artificial', 800),
('Campo B', 1, 'artificial', 800),
('Campo C', 1, 'natural', 600),
('Campo D', 2, 'artificial', 1000),
('Campo E', 2, 'artificial', 1000),
('Campo F', 2, 'natural', 800),
('Campo G', 3, 'artificial', 600),
('Campo H', 3, 'artificial', 600),
('Campo I', 3, 'natural', 500),
('Campo J', 4, 'artificial', 700),
('Campo K', 4, 'artificial', 700),
('Campo L', 4, 'natural', 500);

-- Insertar equipos de ejemplo
INSERT INTO teams (name, category, contact_name, contact_phone, contact_email, color1, color2) VALUES 
('Águilas Doradas', 'varonil-gold', 'Juan Pérez', '618-111-1111', 'aguilas@email.com', '#FFD700', '#8B4513'),
('Lobos Plateados', 'varonil-silver', 'María García', '618-222-2222', 'lobos@email.com', '#C0C0C0', '#000000'),
('Panteras Rosas', 'femenil-gold', 'Ana López', '618-333-3333', 'panteras@email.com', '#FF69B4', '#000000'),
('Tigres Azules', 'femenil-silver', 'Carlos Ruiz', '618-444-4444', 'tigres@email.com', '#0000FF', '#FFFFFF'),
('Halcones Unidos', 'mixto-gold', 'Luis Martín', '618-555-5555', 'halcones@email.com', '#008000', '#FFFF00'),
('Coyotes Salvajes', 'mixto-silver', 'Elena Torres', '618-666-6666', 'coyotes@email.com', '#8B4513', '#FFA500');

-- Insertar árbitros de ejemplo
INSERT INTO referees (name, phone, email, certification_level) VALUES 
('Roberto Sánchez', '618-777-7777', 'roberto@arbitros.com', 'avanzado'),
('Miguel Hernández', '618-888-8888', 'miguel@arbitros.com', 'intermedio'),
('Fernando Castro', '618-999-9999', 'fernando@arbitros.com', 'avanzado'),
('Diego Morales', '618-101-0101', 'diego@arbitros.com', 'basico'),
('Alejandro Vega', '618-202-0202', 'alejandro@arbitros.com', 'intermedio');

-- Insertar partidos de ejemplo
INSERT INTO games (home_team, away_team, game_date, game_time, venue, field, category, referee1, referee2, status) VALUES 
('Águilas Doradas', 'Halcones Unidos', '2025-01-20', '10:00', 'Unidad Deportiva Revolución', 'Campo A', 'varonil-gold', 'Roberto Sánchez', 'Miguel Hernández', 'programado'),
('Lobos Plateados', 'Coyotes Salvajes', '2025-01-20', '12:00', 'Campo Durango FC', 'Campo D', 'varonil-silver', 'Fernando Castro', 'Diego Morales', 'programado'),
('Panteras Rosas', 'Tigres Azules', '2025-01-21', '16:00', 'Deportivo Municipal', 'Campo G', 'femenil-gold', 'Alejandro Vega', 'Roberto Sánchez', 'programado');

-- Insertar estadísticas iniciales
INSERT INTO team_stats (team_name, team_category, games_played, games_won, games_lost, games_tied, points_for, points_against, points) VALUES 
('Águilas Doradas', 'varonil-gold', 0, 0, 0, 0, 0, 0, 0),
('Lobos Plateados', 'varonil-silver', 0, 0, 0, 0, 0, 0, 0),
('Panteras Rosas', 'femenil-gold', 0, 0, 0, 0, 0, 0, 0),
('Tigres Azules', 'femenil-silver', 0, 0, 0, 0, 0, 0, 0),
('Halcones Unidos', 'mixto-gold', 0, 0, 0, 0, 0, 0, 0),
('Coyotes Salvajes', 'mixto-silver', 0, 0, 0, 0, 0, 0, 0);

-- Insertar noticias de ejemplo
INSERT INTO news (title, content, image_url, author) VALUES 
('¡Bienvenidos a la Liga Flag Durango 2025!', 'Estamos emocionados de anunciar el inicio de la temporada 2025 de la Liga Flag Durango. Este año contaremos con 6 categorías diferentes y más de 20 equipos participantes.', 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800', 'Liga Flag Durango'),
('Nuevas Reglas para la Temporada 2025', 'Se han implementado nuevas reglas para mejorar la competencia y la seguridad de todos los jugadores. Conoce todos los detalles en nuestro reglamento oficial.', 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800', 'Comité Técnico');

-- Función para actualizar estadísticas automáticamente
CREATE OR REPLACE FUNCTION update_team_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el juego está finalizado
    IF NEW.status = 'finalizado' THEN
        -- Actualizar estadísticas del equipo local
        INSERT INTO team_stats (team_name, team_category, season, games_played, games_won, games_lost, games_tied, points_for, points_against, points)
        VALUES (NEW.home_team, NEW.category, NEW.season, 1, 
                CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
                CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
                CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
                NEW.home_score, NEW.away_score,
                CASE WHEN NEW.home_score > NEW.away_score THEN 3
                     WHEN NEW.home_score = NEW.away_score THEN 1
                     ELSE 0 END)
        ON CONFLICT (team_name, team_category, season) 
        DO UPDATE SET
            games_played = team_stats.games_played + 1,
            games_won = team_stats.games_won + CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
            games_lost = team_stats.games_lost + CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
            games_tied = team_stats.games_tied + CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
            points_for = team_stats.points_for + NEW.home_score,
            points_against = team_stats.points_against + NEW.away_score,
            points = team_stats.points + CASE WHEN NEW.home_score > NEW.away_score THEN 3
                                              WHEN NEW.home_score = NEW.away_score THEN 1
                                              ELSE 0 END,
            updated_at = CURRENT_TIMESTAMP;

        -- Actualizar estadísticas del equipo visitante
        INSERT INTO team_stats (team_name, team_category, season, games_played, games_won, games_lost, games_tied, points_for, points_against, points)
        VALUES (NEW.away_team, NEW.category, NEW.season, 1,
                CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
                CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
                CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
                NEW.away_score, NEW.home_score,
                CASE WHEN NEW.away_score > NEW.home_score THEN 3
                     WHEN NEW.away_score = NEW.home_score THEN 1
                     ELSE 0 END)
        ON CONFLICT (team_name, team_category, season)
        DO UPDATE SET
            games_played = team_stats.games_played + 1,
            games_won = team_stats.games_won + CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
            games_lost = team_stats.games_lost + CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
            games_tied = team_stats.games_tied + CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
            points_for = team_stats.points_for + NEW.away_score,
            points_against = team_stats.points_against + NEW.home_score,
            points = team_stats.points + CASE WHEN NEW.away_score > NEW.home_score THEN 3
                                              WHEN NEW.away_score = NEW.home_score THEN 1
                                              ELSE 0 END,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar estadísticas
DROP TRIGGER IF EXISTS update_stats_trigger ON games;
CREATE TRIGGER update_stats_trigger
    AFTER UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_team_stats();

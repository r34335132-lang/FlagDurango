-- Primero, eliminamos las tablas si existen para empezar limpio
DROP TABLE IF EXISTS game_stats CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS referees CASCADE;
DROP TABLE IF EXISTS fields CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de venues (sedes)
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de fields (campos)
CREATE TABLE fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    venue_id INTEGER REFERENCES venues(id),
    surface_type VARCHAR(50),
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de referees (árbitros)
CREATE TABLE referees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    certification_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de staff (personal)
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    position VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de teams (equipos)
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) CHECK (category IN ('masculine', 'feminine', 'mixed')),
    logo_url TEXT,
    coach_name VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de players (jugadores)
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    position VARCHAR(50),
    jersey_number INTEGER,
    email VARCHAR(100),
    phone VARCHAR(20),
    birth_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de games (juegos)
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    field_id INTEGER REFERENCES fields(id),
    referee_id INTEGER REFERENCES referees(id),
    game_date TIMESTAMP,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de payments (pagos)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    staff_id INTEGER REFERENCES staff(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50),
    description TEXT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Crear tabla de player_stats (estadísticas de jugadores)
CREATE TABLE player_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    game_id INTEGER REFERENCES games(id),
    touchdowns INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    sacks INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de game_stats (estadísticas de juegos)
CREATE TABLE game_stats (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    team_id INTEGER REFERENCES teams(id),
    total_yards INTEGER DEFAULT 0,
    first_downs INTEGER DEFAULT 0,
    penalties INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo
INSERT INTO venues (name, address, city, state, postal_code) VALUES
('Estadio Central', 'Av. Principal 123', 'Durango', 'Durango', '34000'),
('Campo Norte', 'Calle Norte 456', 'Durango', 'Durango', '34100');

INSERT INTO fields (name, venue_id, surface_type, capacity) VALUES
('Campo A', 1, 'Césped artificial', 500),
('Campo B', 1, 'Césped natural', 300),
('Campo Norte 1', 2, 'Césped artificial', 400);

INSERT INTO referees (name, email, phone, certification_level) VALUES
('Juan Pérez', 'juan@email.com', '618-123-4567', 'Nivel 1'),
('María García', 'maria@email.com', '618-234-5678', 'Nivel 2');

INSERT INTO staff (name, email, phone, position) VALUES
('Carlos Admin', 'admin@liga.com', '618-345-6789', 'Administrador'),
('Ana Coordinadora', 'ana@liga.com', '618-456-7890', 'Coordinadora');

INSERT INTO teams (name, category, coach_name, contact_email, contact_phone) VALUES
('Águilas Durango', 'masculine', 'Roberto Coach', 'aguilas@email.com', '618-567-8901'),
('Leonas FC', 'feminine', 'Patricia Coach', 'leonas@email.com', '618-678-9012'),
('Mixtos Unidos', 'mixed', 'Luis Coach', 'mixtos@email.com', '618-789-0123');

INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@liga.com', '$2b$10$example', 'admin'),
('user1', 'user1@liga.com', '$2b$10$example', 'user');

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_payments_team ON payments(team_id);
CREATE INDEX idx_player_stats_player ON player_stats(player_id);
CREATE INDEX idx_player_stats_game ON player_stats(game_id);

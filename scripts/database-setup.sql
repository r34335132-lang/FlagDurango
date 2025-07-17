-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sedes
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) DEFAULT 'Durango',
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de campos
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE,
    surface_type VARCHAR(20) DEFAULT 'artificial',
    capacity INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de jugadores
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    position VARCHAR(50),
    jersey_number INTEGER,
    birth_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, jersey_number)
);

-- Tabla de árbitros
CREATE TABLE IF NOT EXISTS referees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    certification_level VARCHAR(20) DEFAULT 'basico',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de partidos
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    game_date DATE NOT NULL,
    game_time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    field VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    referee1 VARCHAR(100),
    referee2 VARCHAR(100),
    mvp VARCHAR(100),
    status VARCHAR(20) DEFAULT 'programado',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de noticias
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    author VARCHAR(100) DEFAULT 'Liga Flag Durango',
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estadísticas de equipos
CREATE TABLE IF NOT EXISTS team_stats (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_tied INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario admin por defecto
INSERT INTO users (username, email, password_hash, role, status) 
VALUES ('admin', 'admin@ligaflagdurango.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insertar sedes
INSERT INTO venues (name, address, city, phone) VALUES
('Estadio Municipal Durango', 'Av. 20 de Noviembre 123', 'Durango', '618-123-4567'),
('Campo Deportivo Norte', 'Calle Constitución 456', 'Durango', '618-234-5678'),
('Complejo Deportivo Sur', 'Blvd. Dolores del Río 789', 'Durango', '618-345-6789'),
('Unidad Deportiva Central', 'Av. Universidad 321', 'Durango', '618-456-7890')
ON CONFLICT DO NOTHING;

-- Insertar campos para cada sede
INSERT INTO fields (name, venue_id, surface_type, capacity) VALUES
-- Estadio Municipal Durango
('Campo A', 1, 'cesped_natural', 300),
('Campo B', 1, 'sintetico', 250),
('Campo C', 1, 'sintetico', 200),
-- Campo Deportivo Norte
('Campo D', 2, 'cesped_natural', 200),
('Campo E', 2, 'sintetico', 150),
('Campo F', 2, 'sintetico', 150),
-- Complejo Deportivo Sur
('Campo G', 3, 'cesped_natural', 250),
('Campo H', 3, 'sintetico', 200),
('Campo I', 3, 'sintetico', 180),
-- Unidad Deportiva Central
('Campo J', 4, 'cesped_natural', 300),
('Campo K', 4, 'sintetico', 220),
('Campo L', 4, 'sintetico', 200)
ON CONFLICT DO NOTHING;

-- Insertar árbitros
INSERT INTO referees (name, phone, email, certification_level) VALUES
('Roberto Sánchez', '618-111-1111', 'roberto.sanchez@email.com', 'avanzado'),
('Carmen Morales', '618-222-2222', 'carmen.morales@email.com', 'avanzado'),
('Miguel Torres', '618-333-3333', 'miguel.torres@email.com', 'intermedio'),
('Ana Rodríguez', '618-444-4444', 'ana.rodriguez@email.com', 'intermedio'),
('Luis Hernández', '618-555-5555', 'luis.hernandez@email.com', 'basico'),
('Patricia Gómez', '618-666-6666', 'patricia.gomez@email.com', 'basico')
ON CONFLICT DO NOTHING;

-- Insertar equipos de ejemplo
INSERT INTO teams (name, category, contact_name, contact_phone, contact_email, logo_url, color1, color2) VALUES
('Águilas Doradas', 'varonil-gold', 'Juan Pérez', '618-123-4567', 'juan@aguilas.com', 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=100&h=100&fit=crop&crop=center', '#FFD700', '#8B4513'),
('Lobos Plateados', 'varonil-silver', 'María García', '618-234-5678', 'maria@lobos.com', 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=100&h=100&fit=crop&crop=center', '#C0C0C0', '#2F4F4F'),
('Panteras Rosa', 'femenil-gold', 'Ana López', '618-345-6789', 'ana@panteras.com', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=100&h=100&fit=crop&crop=center', '#FF69B4', '#000000'),
('Tigres Azules', 'mixto-silver', 'Carlos Ruiz', '618-456-7890', 'carlos@tigres.com', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop&crop=center', '#4169E1', '#FFD700'),
('Halcones Rojos', 'varonil-silver', 'Luis Martín', '618-567-8901', 'luis@halcones.com', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center', '#DC143C', '#FFFFFF'),
('Leonas Doradas', 'femenil-gold', 'Sofia Hernández', '618-678-9012', 'sofia@leonas.com', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop&crop=center', '#FFD700', '#8B0000')
ON CONFLICT DO NOTHING;

-- Insertar jugadores de ejemplo
INSERT INTO players (name, team_id, position, jersey_number, birth_date, phone, email) VALUES
-- Águilas Doradas
('Miguel Ángel Rodríguez', 1, 'QB', 1, '1995-03-15', '618-100-0001', 'miguel@aguilas.com'),
('Fernando López', 1, 'RB', 2, '1996-07-22', '618-100-0002', 'fernando@aguilas.com'),
('Carlos Mendoza', 1, 'WR', 3, '1994-11-08', '618-100-0003', 'carlos@aguilas.com'),
-- Lobos Plateados
('Alejandro Ruiz', 2, 'QB', 1, '1993-05-12', '618-200-0001', 'alejandro@lobos.com'),
('Diego Morales', 2, 'RB', 2, '1997-09-18', '618-200-0002', 'diego@lobos.com'),
('Raúl Jiménez', 2, 'WR', 3, '1995-12-03', '618-200-0003', 'raul@lobos.com'),
-- Panteras Rosa
('Ana Sofía García', 3, 'QB', 1, '1996-02-14', '618-300-0001', 'anasofia@panteras.com'),
('Lucía Fernández', 3, 'RB', 2, '1998-06-25', '618-300-0002', 'lucia@panteras.com'),
('Isabella Torres', 3, 'WR', 3, '1997-10-30', '618-300-0003', 'isabella@panteras.com')
ON CONFLICT DO NOTHING;

-- Insertar partidos de ejemplo
INSERT INTO games (home_team, away_team, game_date, game_time, venue, field, category, referee1, referee2, status) VALUES
('Águilas Doradas', 'Lobos Plateados', '2025-01-25', '10:00', 'Estadio Municipal Durango', 'Campo A', 'varonil-gold', 'Roberto Sánchez', 'Miguel Torres', 'programado'),
('Panteras Rosa', 'Leonas Doradas', '2025-01-25', '12:00', 'Estadio Municipal Durango', 'Campo B', 'femenil-gold', 'Carmen Morales', 'Ana Rodríguez', 'programado'),
('Tigres Azules', 'Halcones Rojos', '2025-01-26', '14:00', 'Campo Deportivo Norte', 'Campo D', 'mixto-silver', 'Luis Hernández', 'Patricia Gómez', 'programado'),
('Lobos Plateados', 'Halcones Rojos', '2025-01-20', '16:00', 'Complejo Deportivo Sur', 'Campo G', 'varonil-silver', 'Roberto Sánchez', 'Miguel Torres', 'finalizado'),
('Águilas Doradas', 'Tigres Azules', '2025-01-21', '18:00', 'Unidad Deportiva Central', 'Campo J', 'varonil-gold', 'Carmen Morales', 'Ana Rodríguez', 'finalizado')
ON CONFLICT DO NOTHING;

-- Actualizar algunos partidos finalizados con marcadores y MVP
UPDATE games SET home_score = 21, away_score = 14, mvp = 'Alejandro Ruiz' WHERE home_team = 'Lobos Plateados' AND away_team = 'Halcones Rojos';
UPDATE games SET home_score = 28, away_score = 7, mvp = 'Miguel Ángel Rodríguez' WHERE home_team = 'Águilas Doradas' AND away_team = 'Tigres Azules';

-- Insertar noticias de ejemplo
INSERT INTO news (title, content, image_url, author) VALUES
('¡Inicia la Temporada 2025 de la Liga Flag Durango!', 'Con gran emoción anunciamos el inicio de la temporada 2025 de nuestra liga. Este año contamos con 6 equipos registrados en diferentes categorías, prometiendo partidos llenos de emoción y competencia sana. Los partidos comenzarán el próximo fin de semana en nuestras 4 sedes principales con 12 campos disponibles.', 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=400&fit=crop&crop=center', 'Liga Flag Durango'),
('Nuevas Reglas para la Temporada 2025', 'Se han implementado nuevas reglas para mejorar la experiencia de juego y garantizar la seguridad de todos los participantes. Entre los cambios más importantes se incluyen modificaciones en el tiempo de juego, nuevas regulaciones para el equipamiento y la implementación del sistema MVP. Todos los equipos han sido notificados de estos cambios.', 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&h=400&fit=crop&crop=center', 'Comité Técnico'),
('Águilas Doradas Domina en su Primer Partido', 'En un emocionante encuentro, las Águilas Doradas demostraron su poderío ofensivo al vencer 28-7 a los Tigres Azules. El quarterback Miguel Ángel Rodríguez fue nombrado MVP del partido tras completar 15 de 20 pases para 3 touchdowns. El equipo mostró una excelente coordinación y estrategia que los posiciona como uno de los favoritos para el campeonato de este año.', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=400&fit=crop&crop=center', 'Reportero Deportivo'),
('Nuevos Árbitros Certificados se Unen a la Liga', 'La Liga Flag Durango se complace en anunciar la incorporación de 6 árbitros certificados para la temporada 2025. Cada partido contará con 2 árbitros para garantizar un juego justo y seguro. Los nuevos árbitros han completado su certificación y están listos para oficiar en todas las categorías.', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop&crop=center', 'Administración')
ON CONFLICT DO NOTHING;

-- Insertar estadísticas iniciales para los equipos
INSERT INTO team_stats (team_id, games_played, games_won, games_lost, games_tied, points_for, points_against, points) VALUES
(1, 1, 1, 0, 0, 28, 7, 3),  -- Águilas Doradas
(2, 1, 1, 0, 0, 21, 14, 3), -- Lobos Plateados
(3, 0, 0, 0, 0, 0, 0, 0),   -- Panteras Rosa
(4, 1, 0, 1, 0, 7, 28, 0),  -- Tigres Azules
(5, 1, 0, 1, 0, 14, 21, 0), -- Halcones Rojos
(6, 0, 0, 0, 0, 0, 0, 0)    -- Leonas Doradas
ON CONFLICT DO NOTHING;

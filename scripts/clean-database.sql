-- Script para limpiar completamente la base de datos y empezar de cero
-- CUIDADO: Esto eliminará TODOS los datos excepto el super_admin

-- Eliminar datos en orden correcto (respetando foreign keys)
DELETE FROM payments;
DELETE FROM players;
DELETE FROM games;
DELETE FROM staff WHERE id != 1; -- Mantener super_admin
DELETE FROM referees;
DELETE FROM teams;
DELETE FROM news;
DELETE FROM stats;

-- Eliminar usuarios excepto super_admin
DELETE FROM users WHERE role != 'super_admin';

-- Reiniciar secuencias para que los IDs empiecen desde 1
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE players_id_seq RESTART WITH 2; -- Empezar en 2 para evitar conflictos
ALTER SEQUENCE games_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE staff_id_seq RESTART WITH 2; -- Empezar en 2 porque el 1 es super_admin
ALTER SEQUENCE referees_id_seq RESTART WITH 1;
ALTER SEQUENCE news_id_seq RESTART WITH 1;
ALTER SEQUENCE stats_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 2; -- Empezar en 2 porque el 1 es super_admin

-- Insertar datos básicos de venues y fields si no existen
INSERT INTO venues (name, address, city, phone) VALUES
('Estadio Principal', 'Av. Universidad 123', 'Durango', '618-123-4567'),
('Campo Norte', 'Blvd. Dolores del Rio 456', 'Durango', '618-234-5678'),
('Complejo Deportivo Sur', 'Calle 20 de Noviembre 789', 'Durango', '618-345-6789')
ON CONFLICT (name) DO NOTHING;

INSERT INTO fields (name, venue_id, surface_type, capacity) VALUES
('Campo A', 1, 'natural', 500),
('Campo B', 1, 'artificial', 300),
('Campo Norte 1', 2, 'natural', 400),
('Campo Sur Principal', 3, 'artificial', 600),
('Campo Sur Secundario', 3, 'natural', 250)
ON CONFLICT (name, venue_id) DO NOTHING;

-- Insertar estadísticas iniciales
INSERT INTO stats (total_teams, total_players, total_games, active_season) VALUES
(0, 0, 0, 2025)
ON CONFLICT (active_season) DO UPDATE SET
total_teams = 0,
total_players = 0,
total_games = 0;

-- Verificar que el super_admin sigue existiendo
SELECT 'Super admin preserved:' as status, username, role FROM users WHERE role = 'super_admin';

-- Mostrar resumen
SELECT 
  'Database cleaned successfully' as status,
  (SELECT COUNT(*) FROM teams) as teams_count,
  (SELECT COUNT(*) FROM players) as players_count,
  (SELECT COUNT(*) FROM games) as games_count,
  (SELECT COUNT(*) FROM payments) as payments_count,
  (SELECT COUNT(*) FROM staff) as staff_count,
  (SELECT COUNT(*) FROM referees) as referees_count,
  (SELECT COUNT(*) FROM users) as users_count;

-- Datos iniciales para Liga Flag Durango
USE liga_flag_durango;

-- Insertar roles del sistema
INSERT INTO roles (name, display_name, permissions) VALUES
('super_admin', 'Super Administrador', '["*"]'),
('admin', 'Administrador', '["games.*", "teams.*", "players.*", "payments.*", "referees.*", "staff.*", "gallery.*", "reports.*"]'),
('staff', 'Staff', '["games.view", "games.edit", "teams.view", "players.view", "payments.view", "gallery.view"]'),
('referee', 'Árbitro', '["games.view", "games.edit_score"]');

-- Insertar usuario super admin por defecto
INSERT INTO users (username, email, password_hash, role_id) VALUES
('admin', 'admin@ligaflagdurango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Insertar sedes
INSERT INTO venues (name, address, city, state, zip_code, contact_name, contact_phone) VALUES
('CCH Durango', 'Av. Universidad s/n, Col. Filadelfia, Durango, Dgo.', 'Durango', 'Durango', '34000', 'Juan Pérez', '618-123-4567'),
('Conade Durango', 'Blvd. José María Patoni 1000, Col. Benito Juárez, Durango, Dgo.', 'Durango', 'Durango', '34000', 'María García', '618-234-5678'),
('ITD Campus', 'Blvd. Felipe Pescador 1830 Ote., Nueva Vizcaya, Durango, Dgo.', 'Durango', 'Durango', '34000', 'Carlos Mendoza', '618-345-6789'),
('Polideportivo M.V.R', 'Av. 20 de Noviembre 500, Centro, Durango, Dgo.', 'Durango', 'Durango', '34000', 'Roberto Silva', '618-456-7890'),
('UAD Jardines', 'Av. Universidad 501, Jardines de Durango, Durango, Dgo.', 'Durango', 'Durango', '34000', 'Ana López Vega', '618-567-8901'),
('UIM Deportivo', 'Carretera Durango-Mazatlán Km 5.5, Durango, Dgo.', 'Durango', 'Durango', '34000', 'Pedro Sánchez', '618-678-9012'),
('Unidad Deportiva Durango', 'Calle Principal 123', 'Durango', 'Durango', '34000', 'Juan Pérez', '6181234567'),
('Complejo Deportivo Centenario', 'Avenida Siempre Viva 456', 'Durango', 'Durango', '34000', 'María García', '6187654321');

-- Insertar campos para cada sede
INSERT INTO fields (venue_id, name, field_type, dimensions) VALUES
(1, 'Campo A', 'A', '100x50 metros'),
(1, 'Campo B', 'B', '100x50 metros'),
(2, 'Campo A', 'A', '100x50 metros'),
(2, 'Campo B', 'B', '100x50 metros'),
(2, 'Campo C', 'C', '100x50 metros'),
(3, 'Campo A', 'A', '100x50 metros'),
(4, 'Campo A', 'A', '100x50 metros'),
(4, 'Campo B', 'B', '100x50 metros'),
(5, 'Campo A', 'A', '100x50 metros'),
(6, 'Campo A', 'A', '100x50 metros'),
(6, 'Campo B', 'B', '100x50 metros'),
((SELECT id FROM venues WHERE name = 'Unidad Deportiva Durango'), 'Campo Principal', 'natural_grass', '100x50m'),
((SELECT id FROM venues WHERE name = 'Unidad Deportiva Durango'), 'Campo Anexo 1', 'artificial_turf', '90x45m'),
((SELECT id FROM venues WHERE name = 'Complejo Deportivo Centenario'), 'Cancha A', 'natural_grass', '100x50m'),
((SELECT id FROM venues WHERE name = 'Complejo Deportivo Centenario'), 'Cancha B', 'artificial_turf', '90x45m');

-- Insertar equipos de ejemplo
INSERT INTO teams (name, category, captain_name, captain_phone, captain_email, coach_name, primary_color, secondary_color, status) VALUES
('Águilas Durango', 'femenil-gold', 'María García López', '618-123-4567', 'maria.garcia@email.com', 'Carlos Mendoza', '#ff69b4', '#ff1493', 'active'),
('Panteras FC', 'femenil-gold', 'Ana Rodríguez', '618-234-5678', 'ana.rodriguez@email.com', 'Luis Hernández', '#ff69b4', '#ff1493', 'active'),
('Lobos Unidos', 'varonil-gold', 'Juan Pérez Martín', '618-345-6789', 'juan.perez@email.com', 'Roberto Silva', '#3498db', '#2980b9', 'active'),
('Jaguares DGO', 'varonil-gold', 'Carlos Ruiz', '618-456-7890', 'carlos.ruiz@email.com', 'Miguel Torres', '#3498db', '#2980b9', 'active'),
('Titanes Mixto', 'mixto-silver', 'Ana López Vega', '618-567-8901', 'ana.lopez@email.com', 'Fernando Castro', '#ffa500', '#ff8c00', 'active'),
('Guerreros DGO', 'mixto-silver', 'Pedro Sánchez', '618-678-9012', 'pedro.sanchez@email.com', 'Alejandro Morales', '#ffa500', '#ff8c00', 'active'),
('Halcones Femenil', 'femenil-silver', 'Laura Martínez', '618-789-0123', 'laura.martinez@email.com', 'Diana Flores', '#ff69b4', '#ff1493', 'active'),
('Tigres Varonil', 'varonil-silver', 'Ricardo Gómez', '618-890-1234', 'ricardo.gomez@email.com', 'Sergio Ramírez', '#3498db', '#2980b9', 'active');

-- Insertar jugadores de ejemplo
INSERT INTO players (team_id, name, jersey_number, position, phone, email, status) VALUES
(1, 'María García López', 1, 'Quarterback', '618-123-4567', 'maria.garcia@email.com', 'active'),
(1, 'Carmen Ruiz', 7, 'Wide Receiver', '618-123-4568', 'carmen.ruiz@email.com', 'active'),
(1, 'Sofía Mendoza', 12, 'Running Back', '618-123-4569', 'sofia.mendoza@email.com', 'active'),
(2, 'Ana Rodríguez', 8, 'Quarterback', '618-234-5678', 'ana.rodriguez@email.com', 'active'),
(2, 'Lucía Torres', 15, 'Wide Receiver', '618-234-5679', 'lucia.torres@email.com', 'active'),
(3, 'Juan Pérez Martín', 10, 'Quarterback', '618-345-6789', 'juan.perez@email.com', 'active'),
(3, 'Miguel Hernández', 21, 'Running Back', '618-345-6790', 'miguel.hernandez@email.com', 'active'),
(3, 'Roberto Silva', 88, 'Wide Receiver', '618-345-6791', 'roberto.silva@email.com', 'active'),
(4, 'Carlos Ruiz', 9, 'Quarterback', '618-456-7890', 'carlos.ruiz@email.com', 'active'),
(4, 'Diego Morales', 22, 'Running Back', '618-456-7891', 'diego.morales@email.com', 'active');

-- Insertar árbitros
INSERT INTO referees (name, phone, email, certification_level, experience_years, hourly_rate, status) VALUES
('Juan Pérez Árbitro', '618-111-2222', 'juan.arbitro@email.com', 'Profesional', 8, 500.00, 'active'),
('María González Ref', '618-222-3333', 'maria.ref@email.com', 'Avanzado', 5, 400.00, 'active'),
('Carlos Ruiz Oficial', '618-333-4444', 'carlos.oficial@email.com', 'Intermedio', 3, 350.00, 'active'),
('Ana López Referee', '618-444-5555', 'ana.referee@email.com', 'Profesional', 6, 450.00, 'active');

-- Insertar staff
INSERT INTO staff (name, role, phone, email, hourly_rate, department, hire_date, status) VALUES
('Carlos Administrador', 'coordinador', '618-111-1111', 'carlos.admin@liga.com', 200.00, 'administracion', '2024-01-15', 'active'),
('Ana Asistente', 'asistente', '618-222-2222', 'ana.asistente@liga.com', 150.00, 'administracion', '2024-02-01', 'active'),
('Luis Seguridad', 'seguridad', '618-333-3333', 'luis.seguridad@liga.com', 120.00, 'seguridad', '2024-01-20', 'active'),
('María Marketing', 'marketing', '618-444-4444', 'maria.marketing@liga.com', 180.00, 'marketing', '2024-03-01', 'active');

-- Insertar paramédicos
INSERT INTO paramedics (name, phone, email, license_number, hourly_rate, status) VALUES
('Dr. Roberto Médico', '618-555-6666', 'roberto.medico@email.com', 'MED-12345', 300.00, 'active'),
('Enf. Carmen Salud', '618-666-7777', 'carmen.salud@email.com', 'ENF-67890', 200.00, 'active'),
('Dr. Fernando Cruz', '618-777-8888', 'fernando.cruz@email.com', 'MED-54321', 320.00, 'active');

-- Insertar partidos de ejemplo
INSERT INTO games (home_team_id, away_team_id, venue_id, field_id, referee_id, game_date, game_time, week_number, category, status) VALUES
(1, 2, 1, 1, 1, '2025-01-20', '18:00:00', 1, 'femenil-gold', 'scheduled'),
(3, 4, 2, 3, 2, '2025-01-20', '19:30:00', 1, 'varonil-gold', 'scheduled'),
(5, 6, 3, 6, 3, '2025-01-21', '20:00:00', 1, 'mixto-silver', 'scheduled'),
(7, 1, 4, 7, 4, '2025-01-19', '18:00:00', 1, 'femenil-silver', 'finished'),
(8, 3, 5, 9, 1, '2025-01-19', '19:30:00', 1, 'varonil-silver', 'finished');

-- Actualizar algunos partidos con resultados
UPDATE games SET home_score = 21, away_score = 14, status = 'finished', mvp_player_id = 6 WHERE id = 4;
UPDATE games SET home_score = 28, away_score = 7, status = 'finished', mvp_player_id = 8 WHERE id = 5;

-- Insertar pagos de ejemplo
INSERT INTO payments (type, team_id, amount, payment_method, payment_date, status, description) VALUES
('team_registration', 1, 2000.00, 'transfer', '2025-01-10', 'paid', 'Registro equipo Águilas Durango'),
('team_registration', 2, 2000.00, 'cash', '2025-01-12', 'paid', 'Registro equipo Panteras FC'),
('team_registration', 3, 2000.00, 'transfer', '2025-01-15', 'pending', 'Registro equipo Lobos Unidos'),
('referee_payment', NULL, 500.00, 'cash', '2025-01-19', 'paid', 'Pago arbitraje jornada 1');

INSERT INTO payments (type, referee_id, amount, payment_method, payment_date, status, description) VALUES
('referee_payment', 1, 500.00, 'cash', '2025-01-19', 'paid', 'Arbitraje partido Halcones vs Águilas'),
('referee_payment', 2, 500.00, 'transfer', '2025-01-19', 'paid', 'Arbitraje partido Tigres vs Lobos');

INSERT INTO payments (type, staff_id, amount, payment_method, payment_date, status, description) VALUES
('staff_payment', 1, 800.00, 'transfer', '2025-01-15', 'paid', 'Pago coordinación jornada 1'),
('staff_payment', 2, 600.00, 'transfer', '2025-01-15', 'paid', 'Pago asistencia jornada 1');

-- Insertar estadísticas de equipos
INSERT INTO team_stats (team_id, season, games_played, wins, losses, ties, points_for, points_against) VALUES
(1, '2025', 1, 0, 1, 0, 14, 21),
(2, '2025', 0, 0, 0, 0, 0, 0),
(3, '2025', 1, 1, 0, 0, 28, 7),
(4, '2025', 1, 0, 1, 0, 7, 28),
(5, '2025', 0, 0, 0, 0, 0, 0),
(6, '2025', 0, 0, 0, 0, 0, 0),
(7, '2025', 1, 1, 0, 0, 21, 14),
(8, '2025', 1, 0, 1, 0, 7, 28);

-- Insertar configuración del sistema
INSERT INTO system_config (config_key, config_value, description) VALUES
('league_name', 'Liga Flag Durango', 'Nombre oficial de la liga'),
('current_season', '2025', 'Temporada actual'),
('registration_fee', '2000.00', 'Cuota de registro por equipo'),
('referee_rate', '500.00', 'Tarifa estándar por partido para árbitros'),
('max_players_per_team', '20', 'Número máximo de jugadores por equipo'),
('game_duration', '40', 'Duración del partido en minutos'),
('contact_email', 'contacto@ligaflagdurango.com', 'Email de contacto principal'),
('contact_phone', '+52 618 123 4567', 'Teléfono de contacto principal');

-- Insertar noticias de ejemplo
INSERT INTO news (title, slug, content, excerpt, category, author_id, status, published_at) VALUES
('Inicia la Temporada 2025 de la Liga Flag Durango', 'inicia-temporada-2025', 
'La Liga Flag Durango da inicio oficial a su temporada 2025 con la participación de más de 100 equipos en 6 categorías diferentes...', 
'La temporada 2025 arranca con gran expectativa y la participación récord de equipos.', 
'general', 1, 'published', '2025-01-15 10:00:00'),

('Nuevas Sedes se Suman a la Liga', 'nuevas-sedes-liga', 
'Este año contamos con nuevas instalaciones deportivas que se han sumado como sedes oficiales para los partidos de la liga...', 
'UAD Jardines y UIM Deportivo se integran como nuevas sedes oficiales.', 
'instalaciones', 1, 'published', '2025-01-10 14:30:00'),

('Reglamento Actualizado para la Temporada 2025', 'reglamento-actualizado-2025', 
'Se han realizado importantes actualizaciones al reglamento oficial de la liga para mejorar la experiencia de juego...', 
'Conoce las nuevas reglas y modificaciones para esta temporada.', 
'reglamento', 1, 'published', '2025-01-05 09:00:00');

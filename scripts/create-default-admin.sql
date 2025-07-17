-- Crear usuario administrador por defecto
-- Ejecutar este script después de crear las tablas

-- Insertar roles si no existen
INSERT INTO roles (name, display_name, permissions) VALUES
('super_admin', 'Super Administrador', '["*"]'),
('admin', 'Administrador', '["games.*", "teams.*", "players.*", "payments.*", "referees.*", "staff.*", "gallery.*", "reports.*"]'),
('staff', 'Staff', '["games.view", "games.edit", "teams.view", "players.view", "payments.view", "gallery.view"]'),
('referee', 'Árbitro', '["games.view", "games.edit_score"]')
ON CONFLICT (name) DO NOTHING;

-- Insertar usuario admin por defecto
-- Usuario: admin
-- Contraseña: admin123
INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES
('admin', 'admin@ligaflagdurango.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active', NOW())
ON CONFLICT (username) DO NOTHING;

-- Insertar usuario staff
-- Usuario: staff
-- Contraseña: staff123
INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES
('staff', 'staff@ligaflagdurango.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'active', NOW())
ON CONFLICT (username) DO NOTHING;

-- Insertar usuario referee
-- Usuario: referee  
-- Contraseña: ref123
INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES
('referee', 'referee@ligaflagdurango.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'referee', 'active', NOW())
ON CONFLICT (username) DO NOTHING;

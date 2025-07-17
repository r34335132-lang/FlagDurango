-- Insertar usuarios de prueba
INSERT INTO users (username, email, password_hash, role) VALUES
('testuser1', 'user1@example.com', 'hashed_password_1', 'user'),
('testadmin', 'admin@example.com', 'hashed_password_admin', 'admin'),
('teststaff', 'staff@example.com', 'hashed_password_staff', 'staff'),
('testreferee', 'referee@example.com', 'hashed_password_referee', 'referee')
ON CONFLICT (email) DO NOTHING;

-- NOTA: En un entorno real, 'hashed_password_...' serían hashes de contraseñas seguros.

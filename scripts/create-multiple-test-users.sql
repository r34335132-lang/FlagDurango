-- Limpiar usuarios de prueba existentes
DELETE FROM users WHERE username IN ('admin', 'staff', 'referee', 'testuser');

-- Crear usuario admin
INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'admin',
  'admin@ligaflagdurango.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'admin',
  'active',
  NOW(),
  NOW()
);

-- Crear usuario staff
INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'staff',
  'staff@ligaflagdurango.com',
  '$2b$10$K7L/gT7fGzVWNqkqtQlOhOxLVW8qVKp9fGzVWNqkqtQlOhOxLVW8q', -- staff123
  'staff',
  'active',
  NOW(),
  NOW()
);

-- Crear usuario referee
INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'referee',
  'referee@ligaflagdurango.com',
  '$2b$10$H8M/hU8gH0WOqrlruRmPiPyMWX9rWLr0gH0WOqrlruRmPiPyMWX9r', -- ref123
  'referee',
  'active',
  NOW(),
  NOW()
);

-- Crear usuario normal de prueba
INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'testuser',
  'test@ligaflagdurango.com',
  '$2b$10$J9N/jV9iJ1XPssmsvSnQjQzNXY0sXMs1iJ1XPssmsvSnQjQzNXY0s', -- test123
  'user',
  'active',
  NOW(),
  NOW()
);

-- Verificar todos los usuarios creados
SELECT id, username, email, role, status, created_at 
FROM users 
WHERE username IN ('admin', 'staff', 'referee', 'testuser')
ORDER BY role, username;

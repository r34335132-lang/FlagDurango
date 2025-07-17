-- Eliminar usuario admin existente si existe
DELETE FROM users WHERE username = 'admin' OR email = 'admin@ligaflagdurango.com';

-- Crear usuario admin con contraseña hasheada correctamente
-- Contraseña: admin123
-- Hash generado con bcrypt rounds=10
INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'admin',
  'admin@ligaflagdurango.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'active',
  NOW(),
  NOW()
);

-- Verificar que se creó correctamente
SELECT id, username, email, role, status, created_at 
FROM users 
WHERE username = 'admin';

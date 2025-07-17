-- Actualizar el usuario existente (ID 9) para que tenga las credenciales correctas
UPDATE users 
SET 
  username = 'admin',
  password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  role = 'admin',
  status = 'active',
  updated_at = NOW()
WHERE id = 9;

-- Verificar que se actualizó correctamente
SELECT id, username, email, role, status, created_at 
FROM users 
WHERE id = 9;

-- También crear un usuario admin limpio por si acaso
INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'admin',
  'admin@ligaflagdurango.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Mostrar todos los usuarios admin
SELECT id, username, email, role, status 
FROM users 
WHERE role = 'admin';

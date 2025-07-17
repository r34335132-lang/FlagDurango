-- Opción 1: Cambiar un usuario específico por username
UPDATE users 
SET role = 'admin' 
WHERE username = 'nombre_del_usuario';

-- Opción 2: Cambiar un usuario específico por email
UPDATE users 
SET role = 'admin' 
WHERE email = 'email@ejemplo.com';

-- Opción 3: Ver todos los usuarios actuales para identificar cuál cambiar
SELECT id, username, email, role, status, created_at 
FROM users 
ORDER BY created_at DESC;

-- Opción 4: Cambiar por ID específico (reemplaza el 123 con el ID real)
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE id = 123;

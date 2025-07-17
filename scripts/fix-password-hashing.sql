-- Script para arreglar el problema de hashing de contraseñas
-- Este script actualiza las contraseñas existentes con hashes correctos

-- Actualizar contraseña del admin existente
UPDATE users 
SET password_hash = '$2b$10$K7L/8Y1t85jzrT8/OjVnNe.P1NiAx/NYLVQ6Zb7S6jzrT8OjVnNe2'
WHERE username = 'admin';

-- Si no existe el usuario admin, crearlo
INSERT INTO users (username, email, password_hash, role, status, created_at) 
SELECT 'admin', 'admin@ligaflagdurango.com', '$2b$10$K7L/8Y1t85jzrT8/OjVnNe.P1NiAx/NYLVQ6Zb7S6jzrT8OjVnNe2', 'admin', 'active', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Verificar el resultado
SELECT username, email, role, status, 
       CASE 
         WHEN password_hash IS NOT NULL THEN 'Hash presente' 
         ELSE 'Sin hash' 
       END as password_status
FROM users 
WHERE username = 'admin';

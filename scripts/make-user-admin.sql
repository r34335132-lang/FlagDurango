-- Cambia el correo abajo por el tuyo para convertirte en admin.
UPDATE users
SET role = 'admin'
WHERE email = 'TU_CORREO_AQUI@dominio.com';

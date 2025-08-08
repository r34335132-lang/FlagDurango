-- Crear un árbitro de prueba directamente en la base de datos
INSERT INTO referees (
    name, 
    phone, 
    email, 
    license_number, 
    certification_level, 
    experience_level, 
    hourly_rate, 
    status, 
    user_id
) VALUES (
    'Juan Pérez', 
    '6181234567', 
    'juan.perez@test.com', 
    'REF001', 
    'junior', 
    NULL, -- experience_level como NULL para evitar problemas
    150.00, 
    'active', 
    NULL
);

-- Verificar que se creó correctamente
SELECT * FROM referees WHERE name = 'Juan Pérez';

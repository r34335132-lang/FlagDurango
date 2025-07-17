-- Función para crear un usuario y un staff asociado
CREATE OR REPLACE FUNCTION create_user_and_staff(
    p_username VARCHAR,
    p_email VARCHAR,
    p_password_hash TEXT,
    p_user_role VARCHAR,
    p_staff_name VARCHAR,
    p_staff_role VARCHAR,
    p_staff_phone VARCHAR,
    p_staff_email VARCHAR,
    p_hourly_rate NUMERIC DEFAULT NULL,
    p_department VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Insertar en la tabla de usuarios
    INSERT INTO users (username, email, password_hash, role)
    VALUES (p_username, p_email, p_password_hash, p_user_role)
    RETURNING id INTO new_user_id;

    -- Insertar en la tabla de staff, enlazando con el nuevo usuario
    INSERT INTO staff (user_id, name, role, phone, email, hourly_rate, department)
    VALUES (new_user_id, p_staff_name, p_staff_role, p_staff_phone, p_staff_email, p_hourly_rate, p_department);

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT create_user_and_staff(
--     'nuevoarbitro',
--     'arbitro@example.com',
--     'hashed_password_arbitro',
--     'referee',
--     'Carlos Árbitro',
--     'arbitro',
--     '6189876543',
--     'arbitro@example.com'
-- );

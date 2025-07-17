-- Agregar las columnas faltantes a la tabla teams
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS captain_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS captain_phone VARCHAR(20);

-- Crear función para eliminar staff
CREATE OR REPLACE FUNCTION delete_staff_member(staff_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    staff_user_id INTEGER;
BEGIN
    -- Obtener el user_id del staff
    SELECT user_id INTO staff_user_id FROM staff WHERE id = staff_id;
    
    -- Eliminar el staff
    DELETE FROM staff WHERE id = staff_id;
    
    -- Si tenía usuario asociado, eliminarlo también
    IF staff_user_id IS NOT NULL THEN
        DELETE FROM users WHERE id = staff_user_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Crear función para eliminar árbitro
CREATE OR REPLACE FUNCTION delete_referee(referee_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    referee_user_id INTEGER;
BEGIN
    -- Obtener el user_id del árbitro
    SELECT user_id INTO referee_user_id FROM referees WHERE id = referee_id;
    
    -- Eliminar el árbitro
    DELETE FROM referees WHERE id = referee_id;
    
    -- Si tenía usuario asociado, eliminarlo también
    IF referee_user_id IS NOT NULL THEN
        DELETE FROM users WHERE id = referee_user_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Crear función para eliminar jugador
CREATE OR REPLACE FUNCTION delete_player(player_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM players WHERE id = player_id;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Crear función para eliminar equipo (solo si no tiene jugadores)
CREATE OR REPLACE FUNCTION delete_team(team_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    player_count INTEGER;
BEGIN
    -- Verificar si el equipo tiene jugadores
    SELECT COUNT(*) INTO player_count FROM players WHERE team_id = team_id;
    
    IF player_count > 0 THEN
        RAISE EXCEPTION 'No se puede eliminar el equipo porque tiene jugadores registrados';
    END IF;
    
    -- Eliminar el equipo
    DELETE FROM teams WHERE id = team_id;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Crear función para eliminar pago
CREATE OR REPLACE FUNCTION delete_payment(payment_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM payments WHERE id = payment_id;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

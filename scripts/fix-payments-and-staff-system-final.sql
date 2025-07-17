-- Corregir la función de daily_receipts para evitar ambigüedad
DROP FUNCTION IF EXISTS update_daily_receipt();

CREATE OR REPLACE FUNCTION update_daily_receipt()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
BEGIN
    -- Usar una variable local para evitar ambigüedad
    target_date := CURRENT_DATE;
    
    IF TG_OP = 'INSERT' AND NEW.status = 'paid' THEN
        INSERT INTO daily_receipts (receipt_date, total_received)
        VALUES (target_date, NEW.amount)
        ON CONFLICT (receipt_date) 
        DO UPDATE SET 
            total_received = daily_receipts.total_received + NEW.amount,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asegurar que la tabla referees tenga todas las columnas necesarias
ALTER TABLE referees ADD COLUMN IF NOT EXISTS license_number VARCHAR(50);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) DEFAULT 'junior';
ALTER TABLE referees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0;

-- Asegurar que la tabla staff tenga las columnas de permisos
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_edit_games BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_edit_scores BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_manage_payments BOOLEAN DEFAULT false;

-- Función para crear usuarios automáticamente
CREATE OR REPLACE FUNCTION create_user_for_staff()
RETURNS TRIGGER AS $$
DECLARE
    new_username VARCHAR(50);
    new_password VARCHAR(100);
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        -- Generar username basado en el nombre
        new_username := LOWER(REPLACE(SPLIT_PART(NEW.name, ' ', 1), ' ', '')) || '_' || NEW.id;
        new_password := '$2b$10$' || encode(digest('password123', 'sha256'), 'hex');
        
        -- Insertar usuario
        INSERT INTO users (username, email, password, role, status, created_at)
        VALUES (new_username, NEW.email, new_password, NEW.role, 'active', CURRENT_TIMESTAMP);
        
        -- Actualizar el staff con el user_id
        UPDATE staff SET user_id = (SELECT id FROM users WHERE username = new_username) WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para staff
DROP TRIGGER IF EXISTS create_staff_user ON staff;
CREATE TRIGGER create_staff_user
    AFTER INSERT ON staff
    FOR EACH ROW
    EXECUTE FUNCTION create_user_for_staff();

-- Función similar para referees
CREATE OR REPLACE FUNCTION create_user_for_referee()
RETURNS TRIGGER AS $$
DECLARE
    new_username VARCHAR(50);
    new_password VARCHAR(100);
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        new_username := LOWER(REPLACE(SPLIT_PART(NEW.name, ' ', 1), ' ', '')) || '_ref_' || NEW.id;
        new_password := '$2b$10$' || encode(digest('password123', 'sha256'), 'hex');
        
        INSERT INTO users (username, email, password, role, status, created_at)
        VALUES (new_username, NEW.email, new_password, 'referee', 'active', CURRENT_TIMESTAMP);
        
        UPDATE referees SET user_id = (SELECT id FROM users WHERE username = new_username) WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para referees
DROP TRIGGER IF EXISTS create_referee_user ON referees;
CREATE TRIGGER create_referee_user
    AFTER INSERT ON referees
    FOR EACH ROW
    EXECUTE FUNCTION create_user_for_referee();

-- Recrear el trigger de daily_receipts
DROP TRIGGER IF EXISTS update_daily_receipt_trigger ON payments;
CREATE TRIGGER update_daily_receipt_trigger
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_receipt();

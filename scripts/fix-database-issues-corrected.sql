-- Script para corregir todos los problemas de la base de datos
-- Ejecuta este script en tu panel de Supabase

-- 1. Corregir tabla users - añadir password_hash
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
UPDATE users SET password_hash = 'temp_password' WHERE password_hash IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- 2. Corregir tabla fields - añadir dimensions y asegurar relaciones
ALTER TABLE fields ADD COLUMN IF NOT EXISTS dimensions VARCHAR(50);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS field_type VARCHAR(50);
UPDATE fields SET dimensions = '100x50m' WHERE dimensions IS NULL;
UPDATE fields SET field_type = 'artificial_turf' WHERE field_type IS NULL;

-- 3. Corregir tabla team_stats - añadir win_percentage
ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS win_percentage NUMERIC(5, 2) DEFAULT 0.00;
UPDATE team_stats SET win_percentage = 0.00 WHERE win_percentage IS NULL;
ALTER TABLE team_stats ALTER COLUMN win_percentage SET NOT NULL;

-- 4. Asegurar que la tabla games tenga las columnas correctas
ALTER TABLE games ADD COLUMN IF NOT EXISTS field_id INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS referee_id INTEGER;

-- Eliminar constraint existente si existe para recrearla correctamente
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'games_field_id_fkey') THEN
        ALTER TABLE games DROP CONSTRAINT games_field_id_fkey;
    END IF;
END $$;

-- Crear la relación entre games y fields
ALTER TABLE games ADD CONSTRAINT games_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id);

-- 5. Corregir tabla payments - asegurar relaciones con staff
-- Eliminar constraints existentes si existen
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_referee_id_fkey') THEN
        ALTER TABLE payments DROP CONSTRAINT payments_referee_id_fkey;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_staff_id_fkey') THEN
        ALTER TABLE payments DROP CONSTRAINT payments_staff_id_fkey;
    END IF;
END $$;

-- Recrear las foreign keys correctamente
ALTER TABLE payments ADD CONSTRAINT payments_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES staff(id);
ALTER TABLE payments ADD CONSTRAINT payments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id);

-- 6. Corregir tabla venues - aumentar tamaño de zip_code
ALTER TABLE venues ALTER COLUMN zip_code TYPE VARCHAR(20);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS city VARCHAR(50);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 7. Tabla staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department VARCHAR(50);

-- 8. Insertar datos de ejemplo si las tablas están vacías
-- Insertar venues de ejemplo
INSERT INTO venues (name, address, city, state, zip_code, status) 
SELECT 'Estadio Municipal', 'Av. Principal 123', 'Durango', 'Durango', '34000', 'active'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Estadio Municipal');

INSERT INTO venues (name, address, city, state, zip_code, status) 
SELECT 'Campo Deportivo Norte', 'Calle Norte 456', 'Durango', 'Durango', '34100', 'active'
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Campo Deportivo Norte');

-- Insertar fields de ejemplo
INSERT INTO fields (venue_id, name, field_type, dimensions, status)
SELECT 1, 'Campo 1', 'artificial_turf', '100x50m', 'active'
WHERE NOT EXISTS (SELECT 1 FROM fields WHERE name = 'Campo 1');

INSERT INTO fields (venue_id, name, field_type, dimensions, status)
SELECT 1, 'Campo 2', 'natural_grass', '100x50m', 'active'
WHERE NOT EXISTS (SELECT 1 FROM fields WHERE name = 'Campo 2');

INSERT INTO fields (venue_id, name, field_type, dimensions, status)
SELECT 2, 'Campo Principal', 'artificial_turf', '100x50m', 'active'
WHERE NOT EXISTS (SELECT 1 FROM fields WHERE name = 'Campo Principal');

-- Insertar staff/referees de ejemplo
INSERT INTO staff (name, role, phone, email, status)
SELECT 'Juan Pérez', 'arbitro', '618-123-4567', 'juan.perez@email.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'juan.perez@email.com');

INSERT INTO staff (name, role, phone, email, status)
SELECT 'María González', 'arbitro', '618-234-5678', 'maria.gonzalez@email.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'maria.gonzalez@email.com');

INSERT INTO staff (name, role, phone, email, status)
SELECT 'Carlos Rodríguez', 'paramedico', '618-345-6789', 'carlos.rodriguez@email.com', 'active'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'carlos.rodriguez@email.com');

-- 9. Crear usuario admin de ejemplo
INSERT INTO users (username, email, password_hash, role, status)
SELECT 'admin', 'admin@ligaflagdurango.com', 'admin123', 'admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ligaflagdurango.com');

-- 10. Actualizar datos existentes para evitar errores
UPDATE venues SET zip_code = '34000' WHERE zip_code IS NULL OR LENGTH(zip_code) > 20;
UPDATE fields SET dimensions = '100x50m' WHERE dimensions IS NULL;
UPDATE fields SET field_type = 'artificial_turf' WHERE field_type IS NULL;

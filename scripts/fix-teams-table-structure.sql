-- Este script asegura que el tipo ENUM 'team_type_enum' exista y contenga los valores necesarios,
-- y que la columna 'type' en la tabla 'teams' use este ENUM correctamente.

-- Paso 1: Crear el tipo ENUM 'team_type_enum' si no existe.
-- Si ya existe, esta parte no hará nada.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_type_enum') THEN
        CREATE TYPE team_type_enum AS ENUM ('particular', 'club', 'escuela');
    END IF;
END $$;

-- Paso 2: Añadir los valores 'particular', 'club' y 'escuela' al ENUM si no existen.
-- Esto es idempotente, pero requiere una comprobación explícita para evitar errores de "value already exists".
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'team_type_enum'::regtype AND enumlabel = 'particular') THEN
        ALTER TYPE team_type_enum ADD VALUE 'particular';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'team_type_enum'::regtype AND enumlabel = 'club') THEN
        ALTER TYPE team_type_enum ADD VALUE 'club';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'team_type_enum'::regtype AND enumlabel = 'escuela') THEN
        ALTER TYPE team_type_enum ADD VALUE 'escuela';
    END IF;
END $$;

-- Paso 3: Asegurar que la columna 'type' en la tabla 'teams' use el tipo 'team_type_enum'.
-- Si la columna ya es de este tipo, o si los datos existentes son compatibles, esto funcionará.
-- Si hay datos no compatibles, necesitarías limpiarlos o transformarlos primero.
-- Primero, añadir la columna si no existe (como VARCHAR temporalmente si es necesario para la conversión)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS type VARCHAR(20);
-- Luego, cambiar el tipo de la columna a team_type_enum
ALTER TABLE teams ALTER COLUMN type TYPE team_type_enum USING type::text::team_type_enum;

-- Paso 4: Asegurar que la columna 'type' tenga un valor por defecto y sea NOT NULL.
-- Primero, actualiza cualquier fila existente donde 'type' sea NULL a 'particular'.
UPDATE teams SET type = 'particular' WHERE type IS NULL;
-- Luego, establece el valor por defecto y la restricción NOT NULL.
ALTER TABLE teams ALTER COLUMN type SET DEFAULT 'particular';
ALTER TABLE teams ALTER COLUMN type SET NOT NULL;

-- Paso 5: Asegurar que las columnas 'coach_name', 'logo_url', 'color1', 'color2' existan
-- y tengan sus valores por defecto y restricciones NOT NULL si es necesario.
-- Estas operaciones son idempotentes.

-- Añadir coach_name si no existe (por defecto es nullable)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_name VARCHAR(100);

-- Paso 5.1: Asegurar que la columna 'coach' (si existe y es NOT NULL) sea nullable.
-- Esto es necesario si hay una columna 'coach' preexistente que no permite nulos.
ALTER TABLE teams ALTER COLUMN coach DROP NOT NULL;

-- Añadir logo_url si no existe (por defecto es nullable)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Añadir color1 si no existe, establecer valor por defecto y NOT NULL
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color1 VARCHAR(7);
UPDATE teams SET color1 = '#c666b9' WHERE color1 IS NULL;
ALTER TABLE teams ALTER COLUMN color1 SET DEFAULT '#c666b9';
ALTER TABLE teams ALTER COLUMN color1 SET NOT NULL;

-- Añadir color2 si no existe, establecer valor por defecto y NOT NULL
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color2 VARCHAR(7);
UPDATE teams SET color2 = '#e16c1c' WHERE color2 IS NULL;
ALTER TABLE teams ALTER COLUMN color2 SET DEFAULT '#e16c1c';
ALTER TABLE teams ALTER COLUMN color2 SET NOT NULL;

-- Verificar la estructura final de la tabla para confirmar los cambios
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

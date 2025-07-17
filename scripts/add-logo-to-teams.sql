-- Añadir la columna 'logo_url' a la tabla 'teams' si no existe
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Opcional: Si quieres establecer un valor por defecto para las filas existentes
-- UPDATE teams SET logo_url = 'https://example.com/default_logo.png' WHERE logo_url IS NULL;

-- Verificar la estructura de la tabla para confirmar el cambio
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'teams' AND column_name = 'logo_url';

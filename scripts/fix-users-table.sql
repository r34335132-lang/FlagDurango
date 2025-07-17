-- Añadir la columna 'status' a la tabla 'users' si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' NOT NULL;

-- Actualizar el valor de 'status' para los usuarios existentes que puedan tenerlo NULL
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Añadir la columna 'updated_at' a la tabla 'users' si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Actualizar el valor de 'updated_at' para los usuarios existentes que puedan tenerlo NULL
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- Asegurar que 'created_at' tenga un valor por defecto si no lo tiene
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Asegurar que 'updated_at' tenga un valor por defecto si no lo tiene
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Crear o reemplazar la función para actualizar 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear o reemplazar el trigger para 'users'
CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Verificar la estructura final de la tabla para confirmar los cambios
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

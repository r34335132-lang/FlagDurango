-- Verificar y corregir la columna type en payments
-- El error indica que la columna 'type' no existe, probablemente se llama 'payment_type'

-- Primero verificar la estructura actual de la tabla payments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Si la columna se llama 'payment_type', agregar un alias 'type' o renombrar
DO $$
BEGIN
    -- Verificar si existe la columna 'type'
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'type'
    ) THEN
        -- Verificar si existe 'payment_type'
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'payment_type'
        ) THEN
            -- Renombrar payment_type a type
            ALTER TABLE payments RENAME COLUMN payment_type TO type;
            RAISE NOTICE 'Columna payment_type renombrada a type';
        ELSE
            -- Crear la columna type si no existe ninguna
            ALTER TABLE payments ADD COLUMN type VARCHAR(50) DEFAULT 'team_registration';
            RAISE NOTICE 'Columna type creada';
        END IF;
    END IF;
    
    -- Asegurar que la columna tenga los constraints correctos
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
    ALTER TABLE payments ADD CONSTRAINT payments_type_check 
        CHECK (type IN ('team_registration', 'referee_payment', 'field_rental', 'other'));
    
    -- Actualizar valores NULL o inválidos
    UPDATE payments 
    SET type = 'team_registration' 
    WHERE type IS NULL OR type NOT IN ('team_registration', 'referee_payment', 'field_rental', 'other');
    
    RAISE NOTICE 'Columna type configurada correctamente';
END $$;

-- Verificar el resultado
SELECT 'Payments table structure after fix:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Mostrar algunos registros de ejemplo
SELECT id, type, amount, description, status 
FROM payments 
LIMIT 5;

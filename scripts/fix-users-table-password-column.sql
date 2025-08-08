-- Verificar la estructura actual de la tabla users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- Si la columna se llama 'password' cambiarla a 'password_hash'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users RENAME COLUMN password TO password_hash;
        RAISE NOTICE 'Columna password renombrada a password_hash';
    ELSE
        RAISE NOTICE 'La columna password_hash ya existe o no se encontró la columna password';
    END IF;
END $$;

-- Verificar la estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

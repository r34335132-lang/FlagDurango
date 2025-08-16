-- Agregar columna paid a la tabla teams si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'paid'
    ) THEN
        ALTER TABLE teams ADD COLUMN paid BOOLEAN DEFAULT FALSE;
        
        -- Actualizar equipos existentes como no pagados
        UPDATE teams SET paid = FALSE WHERE paid IS NULL;
        
        -- Agregar comentario a la columna
        COMMENT ON COLUMN teams.paid IS 'Indica si el equipo ha pagado la inscripción';
        
        RAISE NOTICE 'Columna "paid" agregada exitosamente a la tabla teams';
    ELSE
        RAISE NOTICE 'La columna "paid" ya existe en la tabla teams';
    END IF;
END $$;

-- Verificar la estructura de la tabla teams
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'teams' 
ORDER BY ordinal_position;

-- Mostrar algunos equipos para verificar
SELECT id, name, category, paid 
FROM teams 
LIMIT 5;

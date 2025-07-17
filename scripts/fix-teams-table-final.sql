-- Arreglar la tabla teams para que contact_name sea opcional
ALTER TABLE teams ALTER COLUMN contact_name DROP NOT NULL;

-- Actualizar registros existentes que puedan tener problemas
UPDATE teams SET contact_name = captain_name WHERE contact_name IS NULL AND captain_name IS NOT NULL;
UPDATE teams SET contact_name = 'Sin contacto' WHERE contact_name IS NULL;

-- Verificar la estructura
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams' 
ORDER BY ordinal_position;

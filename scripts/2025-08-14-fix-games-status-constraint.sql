-- Corregir el constraint de status en la tabla games
-- Primero eliminamos el constraint existente
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;

-- Agregamos el nuevo constraint con los valores correctos
ALTER TABLE games ADD CONSTRAINT games_status_check 
CHECK (status IN ('programado', 'en_vivo', 'finalizado'));

-- Actualizar cualquier registro que tenga "en vivo" a "en_vivo"
UPDATE games SET status = 'en_vivo' WHERE status = 'en vivo';

-- Verificar los datos actuales
SELECT DISTINCT status FROM games;

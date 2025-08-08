-- Verificar estructura de tablas y constraints existentes

-- Verificar estructura de la tabla payments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla staff
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla referees
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'referees' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla news
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'news' 
ORDER BY ordinal_position;

-- Verificar constraints existentes
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'payments'::regclass;

SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'staff'::regclass;

SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'referees'::regclass;

-- Verificar datos existentes para evitar conflictos
SELECT DISTINCT payment_type FROM payments LIMIT 10;
SELECT DISTINCT role FROM staff LIMIT 10;
SELECT DISTINCT certification_level FROM referees LIMIT 10;
SELECT DISTINCT experience_level FROM referees LIMIT 10;

-- Verificar estructura de la tabla referees
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'referees' 
ORDER BY ordinal_position;

-- Verificar estructura de la tabla staff
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

-- Verificar datos actuales en referees
SELECT 
    id,
    name,
    email,
    certification_level,
    experience_level,
    user_id
FROM referees;

-- Verificar datos en users
SELECT 
    id,
    username,
    email,
    role,
    status
FROM users
WHERE role IN ('referee', 'staff');

-- Verificar datos en staff
SELECT 
    id,
    name,
    email,
    role,
    user_id
FROM staff;

-- Verificar constraint existentes
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'referees'::regclass;

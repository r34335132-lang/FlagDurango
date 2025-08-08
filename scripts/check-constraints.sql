-- Verificar constraints de la base de datos
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.constraint_type = 'CHECK'
    AND tc.table_name IN ('payments', 'staff', 'referees')
ORDER BY tc.table_name, tc.constraint_name;

-- Verificar valores únicos existentes en payments
SELECT DISTINCT payment_type FROM payments;

-- Verificar valores únicos existentes en staff  
SELECT DISTINCT role FROM staff;

-- Verificar valores únicos existentes en referees
SELECT DISTINCT experience_level FROM referees;

-- Ver estructura completa de las tablas
\d payments
\d staff  
\d referees

-- Verificar las restricciones de la tabla referees
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'referees' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

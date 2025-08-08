-- Verificar la estructura de la tabla payments
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'payments'
ORDER BY 
  ordinal_position;

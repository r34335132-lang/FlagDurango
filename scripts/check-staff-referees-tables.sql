-- Verificar la estructura de las tablas staff y referees

-- Tabla staff
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'staff'
ORDER BY 
  ordinal_position;

-- Tabla referees
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'referees'
ORDER BY 
  ordinal_position;

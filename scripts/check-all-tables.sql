-- Verificar la estructura de todas las tablas relevantes

-- Tabla users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'users'
ORDER BY 
  ordinal_position;

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

-- Tabla payments
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

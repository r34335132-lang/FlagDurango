-- Agregar columnas faltantes si no existen
ALTER TABLE referees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE referees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Actualizar datos existentes en referees para que cumplan con los constraints
UPDATE referees 
SET 
    certification_level = COALESCE(certification_level, 'junior'),
    experience_level = COALESCE(experience_level, 'junior'),
    status = COALESCE(status, 'active')
WHERE certification_level IS NULL 
   OR experience_level IS NULL 
   OR status IS NULL;

-- Actualizar datos existentes en staff
UPDATE staff 
SET 
    role = COALESCE(role, 'staff'),
    status = COALESCE(status, 'active')
WHERE role IS NULL 
   OR status IS NULL;

-- Eliminar constraints existentes si existen
ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_certification_level_check;
ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_experience_level_check;
ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_status_check;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Crear constraints para referees
ALTER TABLE referees 
ADD CONSTRAINT referees_certification_level_check 
CHECK (certification_level IN ('junior', 'senior', 'expert', 'master'));

ALTER TABLE referees 
ADD CONSTRAINT referees_experience_level_check 
CHECK (experience_level IN ('junior', 'senior', 'expert', 'master'));

ALTER TABLE referees 
ADD CONSTRAINT referees_status_check 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Crear constraints para staff
ALTER TABLE staff 
ADD CONSTRAINT staff_role_check 
CHECK (role IN ('admin', 'staff', 'coordinator'));

ALTER TABLE staff 
ADD CONSTRAINT staff_status_check 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Actualizar payments para que tenga valores válidos
UPDATE payments 
SET type = 'team_registration' 
WHERE type IS NULL OR type NOT IN ('team_registration', 'referee_payment', 'field_rental', 'other');

UPDATE payments 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'completed', 'cancelled', 'refunded');

-- Crear constraints para payments
ALTER TABLE payments 
ADD CONSTRAINT payments_type_check 
CHECK (type IN ('team_registration', 'referee_payment', 'field_rental', 'other'));

ALTER TABLE payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));

-- Crear tabla news si no existe
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_referees_email ON referees(email);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_referees_user_id ON referees(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);

-- Verificar que todo esté correcto
SELECT 'Referees count: ' || COUNT(*) as result FROM referees
UNION ALL
SELECT 'Staff count: ' || COUNT(*) FROM staff
UNION ALL
SELECT 'Users count: ' || COUNT(*) FROM users
UNION ALL
SELECT 'News table exists: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news') THEN 'YES' ELSE 'NO' END;

-- Mostrar estructura final
SELECT 'referees columns:' as info, column_name, data_type FROM information_schema.columns WHERE table_name = 'referees'
UNION ALL
SELECT 'staff columns:', column_name, data_type FROM information_schema.columns WHERE table_name = 'staff'
ORDER BY info, column_name;

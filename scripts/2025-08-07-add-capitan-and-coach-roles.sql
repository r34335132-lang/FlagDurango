-- Agrega roles 'capitan' y 'coach' según tu esquema actual.
-- Soporta dos escenarios:
-- 1) role es un ENUM (por ejemplo, user_role)
-- 2) role es TEXT con CHECK (users_role_check)

-- Caso ENUM: agrega valores si faltan
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'user_role'
  ) THEN
    -- Agregar 'capitan' si no existe
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'capitan'
    ) THEN
      ALTER TYPE user_role ADD VALUE 'capitan';
    END IF;

    -- Agregar 'coach' si no existe
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'coach'
    ) THEN
      ALTER TYPE user_role ADD VALUE 'coach';
    END IF;
  END IF;
END
$$;

-- Caso CHECK: rehacer el constraint para incluir nuevos roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'users_role_check'
      AND table_name = 'users'
      AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_role_check;
  END IF;

  -- Crea el nuevo CHECK con valores permitidos (ajústalos si tu esquema tiene otros)
  ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (lower(role) IN ('admin','coach','capitan','user','staff','referee'));
END
$$;

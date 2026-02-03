-- Agrega el rol 'player' a la tabla users

-- Caso CHECK: rehacer el constraint para incluir el rol player
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

  -- Crea el nuevo CHECK con valores permitidos incluyendo 'player'
  ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (lower(role) IN ('admin','coach','capitan','user','staff','referee','player'));
END
$$;

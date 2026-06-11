-- Safe enum value additions for Role type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' AND e.enumlabel = 'reporter') THEN
    ALTER TYPE "Role" ADD VALUE 'reporter';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' AND e.enumlabel = 'kontributor') THEN
    ALTER TYPE "Role" ADD VALUE 'kontributor';
  END IF;
END
$$;

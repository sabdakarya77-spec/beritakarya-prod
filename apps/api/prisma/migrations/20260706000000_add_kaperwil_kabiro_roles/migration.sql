-- Safe enum value additions for Role type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' AND e.enumlabel = 'kaperwil') THEN
    ALTER TYPE "Role" ADD VALUE 'kaperwil';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' AND e.enumlabel = 'kabiro') THEN
    ALTER TYPE "Role" ADD VALUE 'kabiro';
  END IF;
END
$$;

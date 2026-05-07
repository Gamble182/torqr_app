-- ============================================================================
-- RLS DENY-ALL HARDENING + AUTO-ENFORCEMENT
-- ============================================================================
--
-- Purpose
--   Closes the PostgREST API attack surface by enabling Row Level Security
--   with a deny-all RESTRICTIVE policy on every table in the public schema.
--   Adds an event trigger so future CREATE TABLE statements inherit the same
--   protection automatically.
--
-- Architecture context
--   Torqr uses Prisma + NextAuth, NOT Supabase Auth.
--   - Prisma connects as `postgres` (table owner) → bypasses RLS by default.
--   - The Supabase service role key (used only for storage in src/lib/supabase.ts)
--     has the BYPASSRLS attribute → unaffected.
--   - The `anon` and `authenticated` PostgREST roles, reachable via the public
--     project URL with the (public-by-design) anon key, are the threat surface
--     this migration shuts down.
--
-- Idempotency
--   Every step is safe to re-run. Functions use CREATE OR REPLACE; the policy
--   creator drops the existing policy first; the event trigger is recreated.
--
-- See also
--   docs/superpowers/specs/2026-04-22-company-multi-user-architecture.md
--   docs/superpowers/specs/2026-04-21-multi-tenancy-design.md (re-evaluation triggers)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 1 — Per-table helper: enable RLS + apply deny_all policy (idempotent)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_rls_deny_all(target_schema text, target_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  qualified_name text;
BEGIN
  -- Only operate on actual tables (relkind = 'r'). Views, materialized views,
  -- foreign tables, and partitioned children are skipped.
  IF NOT EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = target_schema
       AND c.relname = target_table
       AND c.relkind = 'r'
  ) THEN
    RETURN;
  END IF;

  qualified_name := format('%I.%I', target_schema, target_table);

  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', qualified_name);

  -- Drop-then-create keeps the function idempotent and lets us tighten the
  -- policy definition in a future migration without rewriting state.
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', 'deny_all', qualified_name);

  -- RESTRICTIVE policy with USING (false): no row is ever visible to roles
  -- that do not bypass RLS (anon, authenticated). Owner roles (postgres)
  -- bypass RLS unless FORCE ROW LEVEL SECURITY is set, which we deliberately
  -- do NOT set — Prisma queries must continue to work.
  EXECUTE format(
    'CREATE POLICY %I ON %s AS RESTRICTIVE FOR ALL TO PUBLIC USING (false) WITH CHECK (false)',
    'deny_all', qualified_name
  );
END;
$fn$;

COMMENT ON FUNCTION public.apply_rls_deny_all(text, text) IS
  'Idempotently enables RLS and installs the deny_all RESTRICTIVE policy on a '
  'table. Postgres owner roles (Prisma) bypass RLS, so application queries are '
  'unaffected. Used by the bulk helper and the apply_rls_to_new_table event '
  'trigger.';


-- ----------------------------------------------------------------------------
-- STEP 2 — Bulk helper: apply deny_all to every table in public (idempotent)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_rls_deny_all_to_all_public_tables()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  rec record;
  applied_count integer := 0;
BEGIN
  FOR rec IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
  LOOP
    PERFORM public.apply_rls_deny_all('public', rec.relname);
    applied_count := applied_count + 1;
  END LOOP;
  RETURN applied_count;
END;
$fn$;

COMMENT ON FUNCTION public.apply_rls_deny_all_to_all_public_tables() IS
  'Applies deny_all RLS to every public.* table. Safe to call repeatedly. '
  'Recommended fallback after schema changes if the apply_rls_to_new_table '
  'event trigger is unavailable on this Postgres instance.';


-- ----------------------------------------------------------------------------
-- STEP 3 — Apply protection to every existing public table
-- ----------------------------------------------------------------------------

SELECT public.apply_rls_deny_all_to_all_public_tables();


-- ----------------------------------------------------------------------------
-- STEP 4 — Event trigger: auto-protect future CREATE TABLE in public
-- ----------------------------------------------------------------------------
--
-- The event trigger fires at ddl_command_end after CREATE TABLE statements,
-- inspects the affected objects, and applies the deny_all policy when the
-- new table sits in the public schema. This means future Prisma migrations
-- that add tables are PostgREST-safe by default — no manual follow-up.
--
-- If the role running this migration lacks the privilege to create event
-- triggers, the DO block swallows the error and emits a NOTICE so the user
-- can fall back to the manual bulk helper. The critical RLS state from
-- Steps 1–3 is preserved either way.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_public_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $fn$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
     WHERE command_tag = 'CREATE TABLE'
  LOOP
    IF obj.schema_name = 'public' THEN
      -- object_identity is "schema.table"; pull the unqualified table name.
      PERFORM public.apply_rls_deny_all(
        'public',
        split_part(obj.object_identity, '.', 2)
      );
    END IF;
  END LOOP;
END;
$fn$;

COMMENT ON FUNCTION public.handle_new_public_table() IS
  'Event trigger handler. Applies deny_all RLS to any newly created public.* '
  'table so PostgREST exposure is blocked the moment a table exists.';

DO $do$
BEGIN
  -- Idempotent recreate. DROP+CREATE inside a single DO block keeps the
  -- migration replay-safe.
  EXECUTE 'DROP EVENT TRIGGER IF EXISTS apply_rls_to_new_table';
  EXECUTE $sql$
    CREATE EVENT TRIGGER apply_rls_to_new_table
      ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE')
      EXECUTE FUNCTION public.handle_new_public_table()
  $sql$;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE
      'Could not create event trigger apply_rls_to_new_table (insufficient '
      'privilege). After every future migration that adds a table, manually '
      'run: SELECT public.apply_rls_deny_all_to_all_public_tables();';
END;
$do$;


-- ----------------------------------------------------------------------------
-- STEP 5 — Self-verification: fail the migration if any table is unprotected
-- ----------------------------------------------------------------------------

DO $do$
DECLARE
  unprotected_count integer;
  unprotected_list  text;
BEGIN
  SELECT COUNT(*),
         COALESCE(string_agg(c.relname, ', '), '')
    INTO unprotected_count, unprotected_list
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND NOT c.relrowsecurity;

  IF unprotected_count > 0 THEN
    RAISE EXCEPTION
      'RLS hardening verification failed: % public table(s) still have RLS '
      'disabled: %', unprotected_count, unprotected_list;
  END IF;
END;
$do$;

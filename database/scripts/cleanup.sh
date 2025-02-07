#!/bin/bash
## IMPORTANT: ONLY TO BE USED IN DEVELOPMENTAL ENVIRONMENT
## FOR CREATING AND REFINING THE DATABASE SCHEMA AS WELL AS POPULATING IT WITH MOCK DATA

# Load environment variables from .env file
set -a
source .env
set +a

# Log function
log_message() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a migration.log
}

log_message "Starting database cleanup..."

# Drop everything
PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'

-- Drop all tables, views, functions etc.
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop triggers
  FOR r IN (SELECT DISTINCT trigger_name, event_object_table 
            FROM information_schema.triggers
            WHERE trigger_schema = 'public') 
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || 
            ' ON ' || quote_ident(r.event_object_table) || ' CASCADE';
  END LOOP;

  -- Drop functions
  FOR r IN (SELECT proname, oid 
            FROM pg_proc 
            WHERE pronamespace = 'public'::regnamespace) 
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' ||
            pg_get_function_identity_arguments(r.oid) || ') CASCADE';
  END LOOP;

  -- Drop tables and views
  FOR r IN (SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;

  -- Drop views
  FOR r IN (SELECT viewname 
            FROM pg_views 
            WHERE schemaname = 'public') 
  LOOP
    EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
  END LOOP;

  -- Drop types
  FOR r IN (SELECT typname 
            FROM pg_type 
            WHERE typnamespace = 'public'::regnamespace 
            AND typtype = 'c') 
  LOOP
    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
  END LOOP;
END $$;
EOF

log_message "Database cleanup completed!"

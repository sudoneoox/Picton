#!/bin/bash
## IMPORTANT: utility script to make migrating to database easy

# Load environment variables from .env file
set -a
source .env
set +a

# Log function
log_message() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a migration.log
}

# Directories to process after root SQL files
# NOTE: not needed unless we plan on organizing our migrations
# migration_dirs=(
#   "../additional_features"
#   "../core_tables"
#   "../user_content"
#   "../last"
# )

# Execute SQL function
execute_sql() {
  local file=$1
  log_message "Executing: $file"
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$file"
  
  if [ $? -ne 0 ]; then
    log_message "Failed to execute: $file"
    exit 1
  fi
}

# First execute all SQL files in parent directory
log_message "Processing root SQL files..."
for sql_file in $(find ../ -maxdepth 1 -name "[0-9]*.sql" | sort); do
  execute_sql "$sql_file"
done

# Then process directories in order
# NOTE: not needed for right now
# for dir in "${migration_dirs[@]}"; do
#   if [ -d "$dir" ]; then
#     log_message "Processing directory: $dir"
#     for sql_file in $(find "$dir" -name "*.sql" | sort); do
#       execute_sql "$sql_file"
#     done
#   fi
# done

log_message "All migrations completed!"

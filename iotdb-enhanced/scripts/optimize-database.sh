#!/bin/bash
#
# IoTDB Enhanced - Database Optimization Script
#
# Optimizes PostgreSQL database for better performance
# Run weekly via cron: 0 3 * * 0 /path/to/scripts/optimize-database.sh
#
# Usage:
#   ./optimize-database.sh [options]
#
# Options:
#   --dry-run       Show what would be optimized without doing it
#   --analyze-only  Only run ANALYZE, skip VACUUM
#   --vacuum-only   Only run VACUUM, skip ANALYZE
#   --verbose       Show detailed output
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/var/log/iotdb-enhanced"
LOG_FILE="$LOG_DIR/database-optimization.log"

# Database configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-iotdb_enhanced}"
DB_USER="${POSTGRES_USER:-postgres}"

# Parse command line arguments
DRY_RUN=false
ANALYZE_ONLY=false
VACUUM_ONLY=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --analyze-only)
      ANALYZE_ONLY=true
      shift
      ;;
    --vacuum-only)
      VACUUM_ONLY=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# ============================================================================
# Logging Functions
# ============================================================================

log() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

log_verbose() {
  if [ "$VERBOSE" = true ]; then
    log "$1"
  fi
}

log_error() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] ERROR: $message" | tee -a "$LOG_FILE" >&2
}

log_success() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] ✅ $message" | tee -a "$LOG_FILE"
}

# ============================================================================
# Database Functions
# ============================================================================

# Run SQL command
run_sql() {
  local sql="$1"
  if [ "$DRY_RUN" = true ]; then
    log_verbose "[DRY RUN] Would execute: $sql"
    return 0
  fi

  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" \
    -U "$DB_USER" -d "$DB_NAME" -t -c "$sql" 2>&1 | tee -a "$LOG_FILE"
}

# Check table sizes
check_table_sizes() {
  log "Checking table sizes..."

  local sql="
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC;
  "

  run_sql "$sql"
}

# Check index usage
check_index_usage() {
  log "Checking index usage..."

  local sql="
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    ORDER BY idx_scan ASC;
  "

  run_sql "$sql"
}

# Check missing indexes
check_missing_indexes() {
  log "Checking for potentially missing indexes..."

  local sql="
    SELECT
      schemaname,
      tablename,
      attname as column_name,
      n_distinct,
      correlation
    FROM pg_stats
    WHERE schemaname = 'public'
      AND n_distinct > 100
    ORDER BY n_distinct DESC;
  "

  run_sql "$sql"
}

# Vacuum and analyze tables
vacuum_analyze_tables() {
  log "Running VACUUM ANALYZE on all tables..."

  local sql="VACUUM ANALYZE;"
  run_sql "$sql"
  log_success "VACUUM ANALYZE completed"
}

# Analyze tables only
analyze_tables() {
  log "Running ANALYZE on all tables..."

  local sql="ANALYZE;"
  run_sql "$sql"
  log_success "ANALYZE completed"
}

# Vacuum tables only
vacuum_tables() {
  log "Running VACUUM on all tables..."

  local sql="VACUUM;"
  run_sql "$sql"
  log_success "VACUUM completed"
}

# Reindex database
reindex_database() {
  log "Reindexing database (this may take a while)..."

  local sql="REINDEX DATABASE $DB_NAME;"
  run_sql "$sql"
  log_success "Database reindexed"
}

# Clean up old data
cleanup_old_data() {
  log "Cleaning up old data..."

  # Clean up expired sessions
  local sql_sessions="
    DELETE FROM sessions
    WHERE expires_at < NOW();
  "
  run_sql "$sql_sessions"

  # Clean up old audit logs (older than 90 days)
  local sql_audit="
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
  "
  run_sql "$sql_audit"

  log_success "Old data cleaned up"
}

# Create missing indexes
create_missing_indexes() {
  log "Creating recommended indexes..."

  local indexes=(
    "CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_logs(user_id);"
    "CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_logs(action);"
    "CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_logs(created_at);"
    "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);"
    "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);"
    "CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);"
    "CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);"
    "CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);"
    "CREATE INDEX IF NOT EXISTS idx_forecasts_model_id ON forecasts(model_id);"
    "CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);"
  )

  for index_sql in "${indexes[@]}"; do
    if [ "$DRY_RUN" = true ]; then
      log_verbose "[DRY RUN] Would create index: $index_sql"
    else
      run_sql "$index_sql" || log "Failed to create index (may already exist)"
    fi
  done

  log_success "Indexes created/verified"
}

# Update table statistics
update_statistics() {
  log "Updating table statistics..."

  local tables=(
    "users"
    "sessions"
    "audit_logs"
    "api_keys"
    "alerts"
    "datasets"
    "timeseries"
    "forecasts"
  )

  for table in "${tables[@]}"; do
    local sql="ANALYZE $table;"
    run_sql "$sql"
    log_verbose "Statistics updated for: $table"
  done

  log_success "Table statistics updated"
}

# ============================================================================
# Report Generation
# ============================================================================

generate_optimization_report() {
  local report_file="$LOG_DIR/database-optimization-report-$(date +%Y%m%d_%H%M%S).txt"

  log "Generating optimization report..."

  cat > "$report_file" <<EOF
========================================================================
IoTDB Enhanced Database Optimization Report
========================================================================
Date: $(date)
Server: $(hostname)
Database: $DB_NAME

Table Sizes
------------------------------------------------------------------------
EOF

  check_table_sizes >> "$report_file"

  echo "" >> "$report_file"
  echo "Index Usage" >> "$report_file"
  echo "------------------------------------------------------------------------" >> "$report_file"

  check_index_usage >> "$report_file"

  echo "" >> "$report_file"
  echo "Database Statistics" >> "$report_file"
  echo "------------------------------------------------------------------------" >> "$report_file"

  local stats_sql="
    SELECT
      pg_database.datname,
      pg_size_pretty(pg_database_size(pg_database.datname)) AS size,
      (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) AS connections
    FROM pg_database
    WHERE datname = '$DB_NAME';
  "
  run_sql "$stats_sql" >> "$report_file"

  echo "" >> "$report_file"
  echo "========================================================================" >> "$report_file"

  log "Report saved to: $report_file"
}

# ============================================================================
# Main Optimization Routine
# ============================================================================

main() {
  log "=========================================="
  log "  Database Optimization Started"
  log "=========================================="
  log "Database: $DB_NAME"
  log "Host: $DB_HOST:$DB_PORT"
  log "Dry Run: $DRY_RUN"

  # Create log directory
  mkdir -p "$LOG_DIR"

  local start_time=$(date +%s)
  local exit_code=0

  # Pre-optimization checks
  log "Running pre-optimization checks..."
  check_table_sizes

  # Create indexes
  create_missing_indexes || exit_code=$?

  # Run vacuum/analyze based on options
  if [ "$ANALYZE_ONLY" = true ]; then
    analyze_tables || exit_code=$?
  elif [ "$VACUUM_ONLY" = true ]; then
    vacuum_tables || exit_code=$?
  else
    vacuum_analyze_tables || exit_code=$?
  fi

  # Update statistics
  update_statistics || exit_code=$?

  # Cleanup old data
  cleanup_old_data || exit_code=$?

  # Optional: Reindex (monthly)
  if [ "$(date +%d)" = "01" ]; then
    log "First of month - running reindex..."
    reindex_database || true
  fi

  # Generate report
  generate_optimization_report

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log "=========================================="
  log "  Optimization Completed"
  log "=========================================="
  log "Duration: ${duration}s"
  log "Exit Code: $exit_code"

  if [ $exit_code -eq 0 ]; then
    log_success "Database optimization completed successfully!"
  else
    log_error "Some optimizations failed. Check logs for details."
  fi

  exit $exit_code
}

# ============================================================================
# Script Entry Point
# ============================================================================

main "$@"

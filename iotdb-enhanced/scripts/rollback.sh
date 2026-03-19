#!/bin/bash
#
# IoTDB Enhanced - Rollback Script
#
# Rolls back to the previous deployment version.
# Should be called from deploy-zero-downtime.sh or manually.
#
# Usage:
#   ./rollback.sh [options]
#
# Options:
#   --version VERSION  Rollback to specific version
#   --dry-run          Show what would be done without doing it
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/var/log/iotdb-enhanced"
LOG_FILE="$LOG_DIR/rollback.log"
BACKUP_DIR="/var/backups/iotdb-enhanced"
ROLLBACK_VERSION=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse command line arguments
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --version)
      ROLLBACK_VERSION="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
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

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

# ============================================================================
# Git Functions
# ============================================================================

get_current_commit() {
  git -C "$PROJECT_DIR" rev-parse HEAD
}

get_previous_commit() {
  git -C "$PROJECT_DIR" rev-parse HEAD~1
}

rollback_git() {
  local commit="$1"

  log_info "Rolling back git to commit: $commit"

  if [ "$DRY_RUN" = true ]; then
    log "[DRY RUN] Would rollback git to $commit"
    return 0
  fi

  cd "$PROJECT_DIR"

  # Reset to commit
  git reset --hard "$commit"

  # Checkout submodules if any
  git submodule update --init --recursive

  log_info "Git rollback completed"
}

# ============================================================================
# Database Functions
# ============================================================================

rollback_database() {
  log_info "Rolling back database..."

  if [ "$DRY_RUN" = true ]; then
    log "[DRY RUN] Would rollback database"
    return 0
  fi

  # Find most recent database backup
  local latest_backup=$(ls -t "$BACKUP_DIR/postgresql"/*.sql.gz 2>/dev/null | head -1)

  if [ -z "$latest_backup" ]; then
    log_warn "No database backup found, skipping database rollback"
    return 0
  fi

  log_info "Restoring database from: $latest_backup"

  # Restore database
  gunzip -c "$latest_backup" | \
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
      -h "${POSTGRES_HOST:-localhost}" \
      -U "${POSTGRES_USER:-postgres}" \
      -d "${POSTGRES_DB:-iotdb_enhanced}"

  log_info "Database rollback completed"
}

# ============================================================================
# Docker Functions
# ============================================================================

rollback_containers() {
  log_info "Rolling back containers..."

  if [ "$DRY_RUN" = true ]; then
    log "[DRY RUN] Would rollback containers"
    return 0
  fi

  cd "$PROJECT_DIR"

  # Pull previous Docker image (if tagged)
  if [ -n "$ROLLBACK_VERSION" ]; then
    docker pull ghcr.io/${GITHUB_REPOSITORY:-iotdb-enhanced}-backend:$ROLLBACK_VERSION
    docker pull ghcr.io/${GITHUB_REPOSITORY:-iotdb-enhanced}-frontend:$ROLLBACK_VERSION
  fi

  # Rebuild and restart containers
  docker-compose down
  docker-compose up -d

  log_info "Containers rolled back"
}

# ============================================================================
# Main Rollback Routine
# ============================================================================

main() {
  log "=========================================="
  log "  Rollback Started"
  log "=========================================="
  log "Rollback Version: ${ROLLBACK_VERSION:-latest}"

  # Create log directory
  mkdir -p "$LOG_DIR"

  # Save current commit for reference
  local current_commit=$(get_current_commit)
  log "Current commit: $current_commit"

  # Determine rollback target
  local rollback_target="$ROLLBACK_VERSION"
  if [ -z "$rollback_target" ]; then
    rollback_target=$(get_previous_commit)
  fi

  log "Rollback target: $rollback_target"

  local start_time=$(date +%s)
  local exit_code=0

  # Rollback git
  rollback_git "$rollback_target" || exit_code=$?

  # Rollback database (optional)
  read -p "Rollback database? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rollback_database || exit_code=$?
  fi

  # Rollback containers
  rollback_containers || exit_code=$?

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log "=========================================="
  log "  Rollback Completed"
  log "=========================================="
  log "Duration: ${duration}s"

  if [ $exit_code -eq 0 ]; then
    log_info "Rollback successful!"
    log_info "Previous commit: $current_commit"
    log_info "Current commit: $rollback_target"
  else
    log_error "Rollback failed. Check logs for details."
  fi

  exit $exit_code
}

main "$@"

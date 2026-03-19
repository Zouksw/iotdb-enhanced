#!/bin/bash
#
# IoTDB Enhanced - Zero-Downtime Deployment Script
#
# Performs blue-green deployment with zero downtime:
# 1. Start new containers
# 2. Health check new containers
# 3. Switch traffic to new containers
# 4. Stop old containers
#
# Usage:
#   ./deploy-zero-downtime.sh [options]
#
# Options:
#   --blue         Deploy to blue environment
#   --green        Deploy to green environment (default)
#   --force        Force deployment even if health check fails
#   --rollback     Rollback to previous version
#   --dry-run      Show what would be done without doing it
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/var/log/iotdb-enhanced"
LOG_FILE="$LOG_DIR/deployment.log"
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Deployment environments
BLUE_ENV="blue"
GREEN_ENV="green"
CURRENT_ENV=""
NEW_ENV=""

# Parse command line arguments
FORCE=false
DRY_RUN=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --blue)
      NEW_ENV="$BLUE_ENV"
      shift
      ;;
    --green)
      NEW_ENV="$GREEN_ENV"
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Auto-detect current environment if not specified
if [ -z "$NEW_ENV" ]; then
  if docker ps | grep -q "iotdb-backend-blue"; then
    CURRENT_ENV="$BLUE_ENV"
    NEW_ENV="$GREEN_ENV"
  elif docker ps | grep -q "iotdb-backend-green"; then
    CURRENT_ENV="$GREEN_ENV"
    NEW_ENV="$BLUE_ENV"
  else
    # No containers running, default to blue
    CURRENT_ENV=""
    NEW_ENV="$BLUE_ENV"
  fi
fi

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
# Docker Functions
# ============================================================================

get_container_status() {
  local container_name="$1"
  docker inspect -f '{{.State.Status}}' "$container_name" 2>/dev/null || echo "not-found"
}

is_container_healthy() {
  local container_name="$1"
  local status=$(get_container_status "$container_name")

  if [ "$status" != "running" ]; then
    return 1
  fi

  # Check health status if available
  local health=$(docker inspect -f '{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
  if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
    return 0
  fi

  return 1
}

start_containers() {
  local env="$1"

  log_info "Starting $env containers..."

  if [ "$DRY_RUN" = true ]; then
    log "[DRY RUN] Would start $env containers"
    return 0
  fi

  cd "$PROJECT_DIR"

  # Start backend
  docker-compose -p iotdb-$env up -d backend

  # Start frontend
  docker-compose -p iotdb-$env up -d frontend

  log_info "$env containers started"
}

stop_containers() {
  local env="$1"

  log_info "Stopping $env containers..."

  if [ "$DRY_RUN" = true ]; then
    log "[DRY RUN] Would stop $env containers"
    return 0
  fi

  cd "$PROJECT_DIR"

  # Stop and remove
  docker-compose -p iotdb-$env down

  log_info "$env containers stopped"
}

switch_traffic() {
  local from_env="$1"
  local to_env="$2"

  log_info "Switching traffic from $from_env to $to_env..."

  if [ "$DRY_RUN" = true ]; then
    log "[DRY RUN] Would switch traffic from $from_env to $to_env"
    return 0
  fi

  # Update nginx upstream configuration
  local nginx_conf="/etc/nginx/sites-available/iotdb-enhanced"

  if [ -f "$nginx_conf" ]; then
    # Update backend upstream
    sed -i "s/server iotdb-backend-$from_env/server iotdb-backend-$to_env/g" "$nginx_conf"

    # Test nginx configuration
    nginx -t

    # Reload nginx
    systemctl reload nginx

    log_info "Traffic switched successfully"
  else
    log_warn "Nginx configuration not found, skipping traffic switch"
  fi
}

# ============================================================================
# Health Check Functions
# ============================================================================

health_check() {
  local env="$1"
  local backend_url="http://localhost:300${env == "blue" ? "1" : "2"}${env}/api/health"
  local frontend_url="http://localhost:300${env == "blue" ? "1" : "2"}${env}"

  log_info "Running health checks for $env environment..."

  if [ "$DRY_RUN" = true ]; then
    log "[DRY RUN] Would run health checks for $env"
    return 0
  fi

  local elapsed=0
  local healthy=false

  while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
    # Check backend health
    if curl -f -s "$backend_url" > /dev/null 2>&1; then
      log_info "Backend health check passed"

      # Check frontend
      if curl -f -s "$frontend_url" > /dev/null 2>&1; then
        log_info "Frontend health check passed"
        healthy=true
        break
      fi
    fi

    log_warn "Health check failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
    sleep $HEALTH_CHECK_INTERVAL
    elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
  done

  if [ "$healthy" = false ]; then
    log_error "Health check timed out after ${HEALTH_CHECK_TIMEOUT}s"
    return 1
  fi

  return 0
}

# ============================================================================
# Deployment Functions
# ============================================================================

deploy() {
  log "=========================================="
  log "  Zero-Downtime Deployment Started"
  log "=========================================="
  log "Current Environment: $CURRENT_ENV"
  log "New Environment: $NEW_ENV"
  log "Dry Run: $DRY_RUN"

  local start_time=$(date +%s)
  local exit_code=0

  # Start new containers
  start_containers "$NEW_ENV" || exit_code=$?

  if [ $exit_code -ne 0 ]; then
    log_error "Failed to start $NEW_ENV containers"
    return 1
  fi

  # Wait for containers to be ready
  sleep 10

  # Health check new containers
  if ! health_check "$NEW_ENV"; then
    log_error "Health check failed for $NEW_ENV"

    if [ "$FORCE" = false ]; then
      log_error "Deployment failed. Use --force to bypass health check"
      stop_containers "$NEW_ENV"
      return 1
    else
      log_warn "Bypassing health check due to --force flag"
    fi
  fi

  # Switch traffic to new environment
  if [ -n "$CURRENT_ENV" ]; then
    switch_traffic "$CURRENT_ENV" "$NEW_ENV"
  else
    log_info "No current environment, skipping traffic switch"
  fi

  # Stop old environment (if exists)
  if [ -n "$CURRENT_ENV" ]; then
    sleep 10  # Give time for in-flight requests
    stop_containers "$CURRENT_ENV"
  fi

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log "=========================================="
  log "  Deployment Completed"
  log "=========================================="
  log "Duration: ${duration}s"
  log "New Environment: $NEW_ENV"

  log_info "Deployment successful!"

  return 0
}

rollback() {
  log_warn "=========================================="
  log_warn "  Rolling Back Deployment"
  log_warn "=========================================="

  if [ -z "$CURRENT_ENV" ]; then
    log_error "No previous environment to rollback to"
    return 1
  fi

  local start_time=$(date +%s)

  # Switch traffic back to current environment
  switch_traffic "$NEW_ENV" "$CURRENT_ENV"

  # Stop new environment
  stop_containers "$NEW_ENV"

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  log_warn "Rollback completed in ${duration}s"

  return 0
}

# ============================================================================
# Main
# ============================================================================

main() {
  # Create log directory
  mkdir -p "$LOG_DIR"

  if [ "$ROLLBACK" = true ]; then
    rollback
  else
    deploy
  fi
}

main "$@"

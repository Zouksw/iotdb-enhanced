#!/bin/bash
#
# IoTDB Enhanced - Monitoring and Alerting Script
#
# Provides real-time monitoring with alerting:
# - System resources (CPU, memory, disk)
# - Service health
# - Application metrics
# - Custom alert thresholds
#
# Usage:
#   ./monitoring.sh [options]
#
# Options:
#   --daemon        Run as daemon with continuous monitoring
#   --once          Run checks once and exit
#   --alert-cpu N   CPU alert threshold (default: 80)
#   --alert-mem N   Memory alert threshold (default: 80)
#   --alert-disk N  Disk alert threshold (default: 80)
#   --interval N    Check interval in seconds (default: 60)
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/var/log/iotdb-enhanced"
LOG_FILE="$LOG_DIR/monitoring.log"
PID_FILE="/var/run/iotdb-monitoring.pid"

# Alert thresholds
ALERT_CPU=${ALERT_CPU:-80}
ALERT_MEM=${ALERT_MEM:-80}
ALERT_DISK=${ALERT_DISK:-80}
CHECK_INTERVAL=60

# Monitoring endpoints
API_HEALTH="${API_HEALTH:-http://localhost:3001/api/health}"

# Parse command line arguments
DAEMON=false
ONCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --daemon)
      DAEMON=true
      shift
      ;;
    --once)
      ONCE=true
      shift
      ;;
    --alert-cpu)
      ALERT_CPU="$2"
      shift 2
      ;;
    --alert-mem)
      ALERT_MEM="$2"
      shift 2
      ;;
    --alert-disk)
      ALERT_DISK="$2"
      shift 2
      ;;
    --interval)
      CHECK_INTERVAL="$2"
      shift 2
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
  echo -e "\033[0;34m[INFO]\033[0m $1" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "\033[1;33m[WARN]\033[0m $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "\033[0;31m[ERROR]\033[0m $1" | tee -a "$LOG_FILE"
}

log_alert() {
  echo -e "\033[0;31m[ALERT]\033[0m $1" | tee -a "$LOG_FILE"
  send_alert "$1"
}

# ============================================================================
# Alert Functions
# ============================================================================

send_alert() {
  local message="$1"

  # Log to alert file
  local alert_file="$LOG_DIR/alerts.log"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" >> "$alert_file"

  # Send to Sentry (if configured)
  if command -v sentry-cli &>/dev/null && [ -n "${SENTRY_DSN:-}" ]; then
    sentry-cli send-event "$message" --level error
  fi

  # Send to Telegram (if configured)
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}&text=🚨 $message&parse_mode=HTML" >/dev/null 2>&1 || true
  fi

  # TODO: Add Slack, PagerDuty, etc.
}

# ============================================================================
# Check Functions
# ============================================================================

check_cpu() {
  local usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' | cut -d'.' -f1)

  log "CPU Usage: ${usage}%"

  if [ "$usage" -ge "$ALERT_CPU" ]; then
    log_alert "High CPU usage: ${usage}% (threshold: ${ALERT_CPU}%)"
    return 1
  fi

  return 0
}

check_memory() {
  local usage=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')

  log "Memory Usage: ${usage}%"

  if [ "$usage" -ge "$ALERT_MEM" ]; then
    log_alert "High memory usage: ${usage}% (threshold: ${ALERT_MEM}%)"
    return 1
  fi

  return 0
}

check_disk() {
  local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

  log "Disk Usage: ${usage}%"

  if [ "$usage" -ge "$ALERT_DISK" ]; then
    log_alert "High disk usage: ${usage}% (threshold: ${ALERT_DISK}%)"
    return 1
  fi

  return 0
}

check_api_health() {
  local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_HEALTH" 2>/dev/null || echo "000")

  if [ "$response" = "200" ]; then
    log "API Health: OK"
    return 0
  else
    log_error "API Health: FAILED (HTTP $response)"
    send_alert "API health check failed: HTTP $response"
    return 1
  fi
}

check_docker_containers() {
  local stopped=$(docker ps -a --filter "name=iotdb" --filter "status=exited" --format '{{.Names}}' | wc -l)

  if [ "$stopped" -gt 0 ]; then
    log_error "Stopped containers detected: $stopped"
    return 1
  fi

  log "Docker Containers: All running"
  return 0
}

check_process_count() {
  local node_count=$(pgrep -c node || echo "0")

  log "Node Processes: $node_count"

  if [ "$node_count" -lt 2 ]; then
    log_error "Insufficient Node processes: $node_count"
    return 1
  fi

  return 0
}

check_log_errors() {
  local error_count=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo "0")

  log "Recent Errors: $error_count"

  if [ "$error_count" -gt 100 ]; then
    log_warn "High error count in logs: $error_count"
  fi
}

# ============================================================================
# Monitoring Loop
# ============================================================================

run_checks() {
  log "=========================================="
  log "  Running Health Checks"
  log "=========================================="

  local errors=0

  check_cpu || ((errors++)) || true
  check_memory || ((errors++)) || true
  check_disk || ((errors++)) || true
  check_api_health || ((errors++)) || true
  check_docker_containers || ((errors++)) || true
  check_process_count || ((errors++)) || true
  check_log_errors || true

  log "=========================================="
  log "Checks completed with $errors errors"
  log "=========================================="

  return $errors
}

monitor_loop() {
  log "Starting monitoring loop (interval: ${CHECK_INTERVAL}s)"

  while true; do
    run_checks
    sleep $CHECK_INTERVAL
  done
}

# ============================================================================
# Daemon Management
# ============================================================================

start_daemon() {
  # Check if already running
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
      log_error "Monitoring daemon already running (PID: $pid)"
      exit 1
    fi
  fi

  log "Starting monitoring daemon..."

  # Start in background
  nohup bash "$0" --daemon --interval "$CHECK_INTERVAL" </dev/null >/dev/null 2>&1 &
  local pid=$!

  echo $pid > "$PID_FILE"
  log_info "Monitoring daemon started (PID: $pid)"
}

stop_daemon() {
  if [ ! -f "$PID_FILE" ]; then
    log_error "Monitoring daemon not running"
    exit 1
  fi

  local pid=$(cat "$PID_FILE")
  kill "$pid"
  rm -f "$PID_FILE"

  log_info "Monitoring daemon stopped (PID: $pid)"
}

status_daemon() {
  if [ -f "$PID_FILE" ]; then
    local pid=$(cat "$PID_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
      log_info "Monitoring daemon running (PID: $pid)"
      exit 0
    fi
  fi

  log_error "Monitoring daemon not running"
  exit 1
}

# ============================================================================
# Main
# ============================================================================

main() {
  # Create log directory
  mkdir -p "$LOG_DIR"

  if [ "$ONCE" = true ]; then
    run_checks
    exit $?
  fi

  if [ "$DAEMON" = true ]; then
    monitor_loop
  else
    # Default: start as daemon
    start_daemon
  fi
}

# Handle signals
trap 'stop_daemon; exit 0' SIGINT SIGTERM

main "$@"

#!/bin/bash
#
# Environment Setup Script
#
# Decrypts .env.gpg files on startup or deployment
# Can be called from:
# - systemd service
# - PM2 ecosystem file
# - CI/CD pipeline
#
# Usage: ./scripts/setup-env.sh [--force]
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

FORCE_DECRYPT=false
if [ "$1" = "--force" ]; then
  FORCE_DECRYPT=true
fi

ENCRYPTION_KEY="${IOTDB_ENCRYPTION_KEY:-IoTDB_Enhanced_Production_2026}"

# Check if .env already exists and is recent
check_env_freshness() {
  local env_file="$1"
  local encrypted_file="$2"
  
  if [ -f "$env_file" ] && [ "$FORCE_DECRYPT" = false ]; then
    # Check if encrypted file is newer
    if [ "$encrypted_file" -nt "$env_file" ]; then
      return 1  # Encrypted is newer, need to decrypt
    fi
    
    # Check if .env is less than 1 day old
    env_age=$(($(date +%s) - $(stat -c %Y "$env_file")))
    if [ $env_age -lt 86400 ]; then
      return 0  # .env is fresh, no need to decrypt
    fi
  fi
  
  return 1  # Need to decrypt
}

# Decrypt function
decrypt_env() {
  local encrypted_file="$1"
  local output_file="$2"
  local service_name="$3"
  
  echo "Setting up $service_name environment..."
  
  if check_env_freshness "$output_file" "$encrypted_file"; then
    echo -e "${YELLOW}⊘${NC} $output_file is up to date"
    return 0
  fi
  
  if [ ! -f "$encrypted_file" ]; then
    echo -e "${YELLOW}⚠️  Warning: $encrypted_file not found${NC}"
    echo "   Using existing $output_file if available"
    return 0
  fi
  
  echo "Decrypting $encrypted_file..."
  gpg --decrypt --batch --passphrase "$ENCRYPTION_KEY" \
    "$encrypted_file" > "$output_file" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    chmod 600 "$output_file"
    echo -e "${GREEN}✓${NC} $service_name environment ready"
    return 0
  else
    echo -e "${RED}✗${NC} Failed to decrypt $encrypted_file"
    echo "   Check ENCRYPTION_KEY environment variable"
    return 1
  fi
}

# Main setup
echo -e "${GREEN}=== Environment Setup ===${NC}"
echo "Started at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Setup backend
decrypt_env \
  "/root/backend/.env.gpg" \
  "/root/backend/.env" \
  "Backend"

# Setup frontend
if [ -f "/root/frontend/.env.local.gpg" ]; then
  decrypt_env \
    "/root/frontend/.env.local.gpg" \
    "/root/frontend/.env.local" \
    "Frontend"
fi

echo ""
echo -e "${GREEN}=== Environment Setup Complete ===${NC}"
echo "Completed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

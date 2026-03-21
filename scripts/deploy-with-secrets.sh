#!/bin/bash
#
# Production Deployment Script with Encrypted Secrets
#
# Decrypts .env.gpg files and deploys the application
#
# Usage: ./scripts/deploy-with-secrets.sh [--environment production|staging]
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENVIRONMENT=${2:-production}
ENCRYPTION_KEY="${IOTDB_ENCRYPTION_KEY:-IoTDB_Enhanced_Production_2026}"

echo -e "${GREEN}=== Production Deployment with Encrypted Secrets ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Started at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Function to decrypt .env file
decrypt_env() {
  local encrypted_file="$1"
  local output_file="$2"
  
  if [ ! -f "$encrypted_file" ]; then
    echo -e "${YELLOW}⚠️  Warning: $encrypted_file not found${NC}"
    return 1
  fi
  
  echo "Decrypting $encrypted_file..."
  gpg --decrypt --batch --passphrase "$ENCRYPTION_KEY" \
    "$encrypted_file" > "$output_file" 2>/dev/null
  
  if [ $? -eq 0 ]; then
    chmod 600 "$output_file"
    echo -e "${GREEN}✓${NC} Decrypted to $output_file"
    return 0
  else
    echo -e "${RED}✗${NC} Failed to decrypt $encrypted_file"
    return 1
  fi
}

# Function to verify .env file
verify_env() {
  local env_file="$1"
  
  echo "Verifying $env_file..."
  
  # Check for required variables
  required_vars=("JWT_SECRET" "IOTDB_USERNAME" "IOTDB_PASSWORD")
  missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" "$env_file"; then
      missing_vars+=("$var")
    fi
  done
  
  if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}✗${NC} Missing required variables: ${missing_vars[*]}"
    return 1
  fi
  
  echo -e "${GREEN}✓${NC} All required variables present"
  return 0
}

# Deploy backend
echo "=== Deploying Backend ==="
decrypt_env "/root/backend/.env.gpg" "/root/backend/.env"
verify_env "/root/backend/.env"

echo ""
echo "Restarting backend..."
pm2 restart iotdb-backend --update-env
sleep 5

# Verify backend health
echo "Verifying backend health..."
if curl -sf http://localhost:8000/health > /dev/null; then
  echo -e "${GREEN}✓${NC} Backend is healthy"
else
  echo -e "${RED}✗${NC} Backend health check failed"
  exit 1
fi

# Deploy frontend (if encrypted)
if [ -f "/root/frontend/.env.local.gpg" ]; then
  echo ""
  echo "=== Deploying Frontend ==="
  decrypt_env "/root/frontend/.env.local.gpg" "/root/frontend/.env.local"
  
  echo "Restarting frontend..."
  pm2 restart iotdb-frontend --update-env
  sleep 5
  
  # Verify frontend
  if curl -sf http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend is healthy"
  else
    echo -e "${YELLOW}⚠️  Frontend health check failed (may be starting up)${NC}"
  fi
fi

echo ""
echo -e "${GREEN}=== Deployment Completed Successfully ===${NC}"
echo "Completed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""
echo "⚠️  IMPORTANT: Plaintext .env files are now on disk."
echo "   For production, consider using ramdisk or tmpfs."

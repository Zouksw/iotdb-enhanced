#!/bin/bash
#
# Rotate Secrets and Re-encrypt
#
# 1. Generates new secrets
# 2. Updates .env files
# 3. Re-encrypts with GPG
# 4. Restarts services
#
# Usage: ./scripts/rotate-and-reencrypt.sh [--dry-run]
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
fi

ENCRYPTION_KEY="${IOTDB_ENCRYPTION_KEY:-IoTDB_Enhanced_Production_2026}"

echo -e "${GREEN}=== Secret Rotation and Re-encryption ===${NC}"
echo "Started at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Backup
BACKUP_DIR="/root/backups/secrets-rotation-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /root/backend/.env.gpg "$BACKUP_DIR/"
echo -e "${GREEN}✓${NC} Backed up .env.gpg to $BACKUP_DIR"

# Decrypt current .env
echo "Decrypting current .env..."
gpg --decrypt --batch --passphrase "$ENCRYPTION_KEY" \
  /root/backend/.env.gpg > /tmp/.env.current 2>/dev/null

# Generate new secrets
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_SESSION_SECRET=$(openssl rand -base64 64)
NEW_IOTDB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
NEW_REDIS_PASSWORD=$(openssl rand -base64 32)

# Update secrets in .env
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" /tmp/.env.current
sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$NEW_SESSION_SECRET/" /tmp/.env.current
sed -i "s/^IOTDB_PASSWORD=.*/IOTDB_PASSWORD=$NEW_IOTDB_PASSWORD/" /tmp/.env.current

# Update Redis URL
ENCODED_REDIS_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$NEW_REDIS_PASSWORD', safe=''))")
sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:$ENCODED_REDIS_PASSWORD@localhost:6379|" /tmp/.env.current

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo -e "${YELLOW}New secrets (dry run):${NC}"
  grep "JWT_SECRET\|IOTDB_PASSWORD\|REDIS_URL" /tmp/.env.current | sed 's/=.*/=***/'
  rm /tmp/.env.current
  echo ""
  echo "Run without --dry-run to apply changes"
  exit 0
fi

# Change IoTDB password
OLD_IOTDB_PASSWORD=$(grep "IOTDB_PASSWORD=" /root/backend/.env | cut -d'=' -f2)
echo "Changing IoTDB password..."
CLI_PATH="/opt/iotdb/apache-iotdb-2.0.6-all-bin/sbin/start-cli.sh"
(echo "ALTER USER iotdb_app SET PASSWORD '$NEW_IOTDB_PASSWORD';" && echo "exit") | \
  $CLI_PATH -h localhost -p 6667 -u iotdb_app -pw "$OLD_IOTDB_PASSWORD" 2>&1 | \
  grep -i "success\|error" | head -3

# Change Redis password
OLD_REDIS_PASSWORD=$(grep "REDIS_URL=" /root/backend/.env | sed 's/.*:\(.*\)=@.*/\1/' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))")
echo "Changing Redis password..."
redis-cli -a "$OLD_REDIS_PASSWORD" CONFIG SET requirepass "$NEW_REDIS_PASSWORD" 2>&1 | grep -v "Warning"

# Encrypt new .env
echo "Encrypting new .env..."
gpg --symmetric --cipher-algo AES256 --batch --yes \
  --passphrase "$ENCRYPTION_KEY" \
  /tmp/.env.current --output /root/backend/.env.gpg
chmod 600 /root/backend/.env.gpg

# Copy plaintext for deployment
cp /tmp/.env.current /root/backend/.env
chmod 600 /root/backend/.env
rm /tmp/.env.current

# Invalidate existing sessions
echo "Invalidating existing JWT tokens..."
redis-cli -a "$NEW_REDIS_PASSWORD" FLUSHDB 2>&1 | grep -v "Warning"

# Restart services
echo "Restarting services..."
pm2 restart iotdb-backend --update-env
sleep 10

# Verify
echo "Verifying services..."
if curl -sf http://localhost:8000/health > /dev/null; then
  echo -e "${GREEN}✓${NC} Backend is healthy"
else
  echo -e "${RED}✗${NC} Backend health check failed"
  exit 1
fi

echo ""
echo -e "${GREEN}=== Secret Rotation Completed ===${NC}"
echo "Completed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "⚠️  All existing JWT tokens have been invalidated"
echo "📋 Next rotation due: $(date -d '+90 days' +%Y-%m-%d)"

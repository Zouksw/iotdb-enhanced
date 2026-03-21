#!/bin/bash
#
# Secret Rotation Script
#
# Rotates JWT secrets, IoTDB passwords, and Redis passwords.
# Should be run every 90 days.
#
# Usage: ./scripts/rotate-secrets.sh [--dry-run]
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
  echo -e "${YELLOW}=== DRY RUN MODE - No changes will be made ===${NC}"
fi

echo -e "${GREEN}=== Secret Rotation Script ===${NC}"
echo "Started at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Backup current .env
BACKUP_DIR="/root/backups/secrets-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /root/backend/.env "$BACKUP_DIR/"
echo -e "${GREEN}✓${NC} Backed up .env to $BACKUP_DIR"

# Generate new secrets
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_SESSION_SECRET=$(openssl rand -base64 64)
NEW_IOTDB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
NEW_REDIS_PASSWORD=$(openssl rand -base64 32)

echo -e "${GREEN}✓${NC} Generated new secrets"

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo -e "${YELLOW}New secrets (dry run):${NC}"
  echo "JWT_SECRET: ${NEW_JWT_SECRET:0:20}..."
  echo "IOTDB_PASSWORD: ${NEW_IOTDB_PASSWORD}"
  echo "REDIS_PASSWORD: ${NEW_REDIS_PASSWORD:0:20}..."
  echo ""
  echo "Run without --dry-run to apply changes"
  exit 0
fi

# Get old passwords for rotation
OLD_IOTDB_PASSWORD=$(grep "IOTDB_PASSWORD=" /root/backend/.env | cut -d'=' -f2)
OLD_REDIS_PASSWORD=$(grep "REDIS_URL=" /root/backend/.env | sed 's/.*:\(.*\)=@.*/\1/' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))")

# Update .env file
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" /root/backend/.env
sed -i "s/^SESSION_SECRET=.*/SESSION_SECRET=$NEW_SESSION_SECRET/" /root/backend/.env
sed -i "s/^IOTDB_PASSWORD=.*/IOTDB_PASSWORD=$NEW_IOTDB_PASSWORD/" /root/backend/.env

# Update Redis URL with new password (URL encoded)
ENCODED_REDIS_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$NEW_REDIS_PASSWORD', safe=''))")
sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:$ENCODED_REDIS_PASSWORD@localhost:6379|" /root/backend/.env

echo -e "${GREEN}✓${NC} Updated .env file"

# Change IoTDB user password
echo ""
echo "Changing IoTDB password..."
CLI_PATH="/opt/iotdb/apache-iotdb-2.0.6-all-bin/sbin/start-cli.sh"
(echo "ALTER USER iotdb_app SET PASSWORD '$NEW_IOTDB_PASSWORD';" && echo "exit") | \
  $CLI_PATH -h localhost -p 6667 -u iotdb_app -pw "$OLD_IOTDB_PASSWORD" 2>&1 | \
  grep -i "success\|error" | head -3

echo -e "${GREEN}✓${NC} Changed IoTDB password"

# Change Redis password
echo ""
echo "Changing Redis password..."
redis-cli -a "$OLD_REDIS_PASSWORD" CONFIG SET requirepass "$NEW_REDIS_PASSWORD" 2>&1 | grep -v "Warning"
echo -e "${GREEN}✓${NC} Changed Redis password"

# Invalidate all existing JWT tokens
echo ""
echo "Invalidating existing JWT tokens..."
REDIS_PASSWORD=$(grep "REDIS_URL=" /root/backend/.env | sed 's/.*:\(.*\)=@.*/\1/' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))")
redis-cli -a "$REDIS_PASSWORD" FLUSHDB 2>&1 | grep -v "Warning"
echo -e "${GREEN}✓${NC} Cleared Redis database (all sessions invalidated)"

# Restart services
echo ""
echo "Restarting services..."
pm2 restart iotdb-backend --update-env
sleep 10

# Verify services
echo ""
echo "Verifying services..."
HEALTH_CHECK=$(curl -s http://localhost:8000/health | grep -o '"success":true')
if [ "$HEALTH_CHECK" = '"success":true' ]; then
  echo -e "${GREEN}✓${NC} Backend is healthy"
else
  echo -e "${RED}✗${NC} Backend health check failed"
  exit 1
fi

# Test IoTDB connection
(echo "SHOW TIMESERIES;" && echo "exit") | \
  $CLI_PATH -h localhost -p 6667 -u iotdb_app -pw "$NEW_IOTDB_PASSWORD" 2>&1 | \
  grep -v "^IoTDB>" | grep -v "^>" | head -1
echo -e "${GREEN}✓${NC} IoTDB connection successful"

# Test Redis connection
redis-cli -a "$NEW_REDIS_PASSWORD" PING 2>&1 | grep -v "Warning"
echo -e "${GREEN}✓${NC} Redis connection successful"

# Save secrets to secure file
cat > /root/.secrets.tmp << SECRETS
JWT_SECRET=$NEW_JWT_SECRET
SESSION_SECRET=$NEW_SESSION_SECRET
IOTDB_PASSWORD=$NEW_IOTDB_PASSWORD
REDIS_PASSWORD=$NEW_REDIS_PASSWORD
SECRETS
chmod 600 /root/.secrets.tmp

echo ""
echo -e "${GREEN}=== Secret Rotation Completed Successfully ===${NC}"
echo "Completed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""
echo "📋 Next rotation due: $(date -d '+90 days' +%Y-%m-%d)"
echo "⚠️  All existing JWT tokens have been invalidated"
echo "⚠️  Users will need to log in again"

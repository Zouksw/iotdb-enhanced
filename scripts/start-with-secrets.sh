#!/bin/bash
#
# Start all services with encrypted secrets
#
# This script:
# 1. Decrypts .env.gpg files
# 2. Starts PM2 services
# 3. Verifies all services are healthy
#
# Usage: ./scripts/start-with-secrets.sh [--skip-setup]
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\93[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SKIP_SETUP=false
if [ "$1" = "--skip-setup" ]; then
  SKIP_SETUP=true
fi

echo -e "${GREEN}=== Starting IoTDB Enhanced with Encrypted Secrets ===${NC}"
echo "Started at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Step 1: Setup environment (decrypt .env files)
if [ "$SKIP_SETUP" = false ]; then
  echo "Step 1: Setting up environment..."
  /root/scripts/setup-env.sh
  echo ""
fi

# Step 2: Start services
echo "Step 2: Starting PM2 services..."
pm2 start /root/ecosystem.config.cjs
echo ""
sleep 10

# Step 3: Verify services
echo "Step 3: Verifying services..."
echo ""
echo "Backend health:"
if curl -sf http://localhost:8000/health > /dev/null; then
  echo -e "${GREEN}✓${NC} Backend is healthy"
else
  echo -e "${RED}✗${NC} Backend health check failed"
  pm2 logs iotdb-backend --lines 20 --nostream
  exit 1
fi

echo ""
echo "Frontend health:"
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Frontend is healthy"
else
  echo -e "${YELLOW}⚠️${NC} Frontend may still be starting..."
fi

echo ""
echo "IoTDB health:"
if nc -z localhost 6667; then
  echo -e "${GREEN}✓${NC} IoTDB is responding"
else
  echo -e "${RED}✗${NC} IoTDB is not responding"
fi

echo ""
echo "Redis health:"
REDIS_PASSWORD=$(grep "REDIS_URL=" /root/backend/.env | sed 's/.*:\(.*\)=@.*/\1/' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))")
if redis-cli -a "$REDIS_PASSWORD" PING 2>&1 | grep -q "PONG"; then
  echo -e "${GREEN}✓${NC} Redis is responding"
else
  echo -e "${RED}✗${NC} Redis is not responding"
fi

echo ""
echo -e "${GREEN}=== All Services Started Successfully ===${NC}"
echo "Completed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""
echo "📊 Service Status:"
pm2 status
echo ""
echo "📋 Logs:"
echo "  Backend: pm2 logs iotdb-backend"
echo "  Frontend: pm2 logs iotdb-frontend"

#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Stop All Services
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping IoTDB Enhanced services...${NC}"
echo ""

# Stop PM2 services
echo "Stopping application services..."
pm2 stop all 2>/dev/null || echo "No PM2 services running"

# Stop IoTDB services
echo "Stopping IoTDB services..."
/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/data-node-stop.sh > /dev/null 2>&1 &
/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/config-node-stop.sh > /dev/null 2>&1 &

sleep 2

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services stopped${NC}"
echo -e "${GREEN}========================================${NC}"

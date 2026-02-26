#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Start All Services
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting IoTDB Enhanced services...${NC}"
echo ""

# Start IoTDB services
echo -n "IoTDB ConfigNode... "
if pgrep -f "config-node" > /dev/null; then
    echo -e "${GREEN}already running${NC}"
else
    /opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/config-node-start.sh > /dev/null 2>&1 &
    echo -e "${GREEN}started${NC}"
fi

echo -n "IoTDB DataNode... "
sleep 2
if pgrep -f "data-node" > /dev/null; then
    echo -e "${GREEN}already running${NC}"
else
    /opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/data-node-start.sh > /dev/null 2>&1 &
    echo -e "${GREEN}started${NC}"
fi

# Start PM2 services
echo -n "Application services... "
if pm2 list 2>/dev/null | grep -q "online"; then
    echo -e "${GREEN}already running${NC}"
else
    cd /root/iotdb-enhanced
    pm2 start ecosystem.config.cjs
    echo -e "${GREEN}started${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services started${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  ./status.sh"

#!/bin/bash
# IoTDB Enhanced - Quick Service Check

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================  "
echo "  IoTDB Enhanced - Service Status Check"
echo "========================================  "
echo ""

# Database Services
echo "Database Services:"
pgrep -x postgres > /dev/null && echo -e "  ${GREEN}✓${NC} PostgreSQL" || echo -e "  ${RED}✗${NC} PostgreSQL"
pgrep -x redis-server > /dev/null && echo -e "  ${GREEN}✓${NC} Redis" || echo -e "  ${RED}✗${NC} Redis"

# IoTDB Services
echo ""
echo "IoTDB Services:"
nc -z localhost 6667 2>/dev/null && echo -e "  ${GREEN}✓${NC} IoTDB DataNode (port 6667)" || echo -e "  ${RED}✗${NC} IoTDB DataNode"
nc -z localhost 10710 2>/dev/null && echo -e "  ${GREEN}✓${NC} IoTDB ConfigNode (port 10710)" || echo -e "  ${RED}✗${NC} IoTDB ConfigNode"
nc -z localhost 10810 2>/dev/null && echo -e "  ${GREEN}✓${NC} AI Node (port 10810)" || echo -e "  ${RED}✗${NC} AI Node"
nc -z localhost 18080 2>/dev/null && echo -e "  ${GREEN}✓${NC} IoTDB REST API (port 18080)" || echo -e "  ${RED}✗${NC} IoTDB REST API"

# PM2 Services
echo ""
echo "Application Services:"
if pm2 list 2>/dev/null | grep -q "iotdb-backend.*online"; then
    echo -e "  ${GREEN}✓${NC} Backend (PM2, port 8000)"
else
    echo -e "  ${RED}✗${NC} Backend (PM2)"
fi

if pm2 list 2>/dev/null | grep -q "iotdb-frontend.*online"; then
    echo -e "  ${GREEN}✓${NC} Frontend (PM2, port 3000)"
else
    echo -e "  ${RED}✗${NC} Frontend (PM2)"
fi

echo ""
echo "Access URLs:"
echo -e "  ${GREEN}Frontend:${NC}       http://localhost:3000"
echo -e "  ${GREEN}Backend API:${NC}    http://localhost:8000"
echo ""
echo "========================================"

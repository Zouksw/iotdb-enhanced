#!/bin/bash
# IoTDB Enhanced Platform - Stop Script
# =======================================
# 统一停止所有服务：Frontend + Backend + IoTDB + AI Node

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOTDB_HOME="/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================"
echo "  IoTDB Enhanced Platform"
echo "========================================"
echo ""
echo "Stopping services..."
echo ""

# ============================================
# 1. Stop Frontend
# ============================================
echo "[1/4] Stopping Frontend..."

cd "$FRONTEND_DIR"

if [ -f .pid ]; then
    FRONTEND_PID=$(cat .pid)
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        kill "$FRONTEND_PID" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} Frontend stopped (PID: $FRONTEND_PID)"
    else
        echo -e "  ${YELLOW}Frontend process not running${NC}"
    fi
    rm -f .pid
else
    # Try to find and kill any next-server processes
    if pkill -f "next-server"; then
        echo -e "  ${GREEN}✓${NC} Frontend stopped"
    else
        echo -e "  ${YELLOW}Frontend not running${NC}"
    fi
fi

# Double check port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "  ${YELLOW}⚠ Port 3000 still in use, force killing...${NC}"
    fuser -k 3000/tcp 2>/dev/null || true
fi

echo ""

# ============================================
# 2. Stop Backend
# ============================================
echo "[2/4] Stopping Backend..."

cd "$BACKEND_DIR"

if [ -f .pid ]; then
    BACKEND_PID=$(cat .pid)
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        kill "$BACKEND_PID" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} Backend stopped (PID: $BACKEND_PID)"
    else
        echo -e "  ${YELLOW}Backend process not running${NC}"
    fi
    rm -f .pid
else
    # Try to find and kill any node processes running on port 8002
    BACKEND_PID=$(lsof -ti :8002 2>/dev/null)
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} Backend stopped"
    else
        echo -e "  ${YELLOW}Backend not running${NC}"
    fi
fi

echo ""

# ============================================
# 3. Stop IoTDB + AI Node
# ============================================
echo "[3/4] Stopping IoTDB + AI Node..."

# Check if IoTDB is running
if ! pgrep -f "iotdb" > /dev/null; then
    echo -e "  ${YELLOW}IoTDB is not running${NC}"
else
    cd "$IOTDB_HOME"

    # Stop DataNode (this will also stop AI Node)
    echo "  Stopping IoTDB DataNode..."
    if [ -f "./sbin/stop-datanode.sh" ]; then
        ./sbin/stop-datanode.sh > /dev/null 2>&1 &
    fi

    # Wait for IoTDB to stop
    echo "  Waiting for IoTDB to stop..."
    MAX_WAIT=30
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        if ! pgrep -f "iotdb" > /dev/null; then
            echo -e "  ${GREEN}✓${NC} IoTDB stopped"
            break
        fi
        sleep 1
        echo -n "."
        WAIT_COUNT=$((WAIT_COUNT + 1))
    done

    if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
        echo ""
        echo -e "  ${YELLOW}⚠ IoTDB did not stop gracefully, force killing...${NC}"
        pkill -9 -f "iotdb" || true
        sleep 2
    fi
fi

echo ""

# ============================================
# 4. Verify ports are released
# ============================================
echo "[4/4] Verifying ports..."

PORTS=(6667 10710 10810 18080 8002 3000)
ALL_CLEARED=true

for PORT in "${PORTS[@]}"; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "  ${RED}✗ Port $PORT still in use${NC}"
        ALL_CLEARED=false
    fi
done

if [ "$ALL_CLEARED" = true ]; then
    echo -e "  ${GREEN}✓ All ports released${NC}"
fi

echo ""
echo "========================================"
echo "  All Services Stopped!"
echo "========================================"
echo ""

# Exit successfully
exit 0

#!/bin/bash
# IoTDB Enhanced Platform - Stop Script (PM2 Version)
# =======================================
# 统一停止所有服务：Frontend + Backend + IoTDB + AI Node

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Detect IoTDB installation paths
IOTDB_HOME="/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin"
AINODE_HOME="/opt/iotdb-ainode/apache-iotdb-2.0.5-ainode-bin"

# Use alternative paths if not found
[ ! -d "$IOTDB_HOME" ] && IOTDB_HOME="/opt/iotdb/apache-iotdb-2.0.6-all-bin"
[ ! -d "$AINODE_HOME" ] && AINODE_HOME="$IOTDB_HOME"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  IoTDB Enhanced Platform"
echo "========================================"
echo ""
echo "Stopping services..."
echo ""

# ============================================
# 1. Stop PM2 Services
# ============================================
echo "[1/5] Stopping PM2 managed services..."

cd "$PROJECT_DIR"

# Stop frontend and backend
if pm2 list 2>/dev/null | grep -q "iotdb"; then
    echo "  Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} PM2 services stopped"
else
    echo -e "  ${YELLOW}No PM2 services running${NC}"
fi

echo ""

# ============================================
# 2. Stop AI Node Components
# ============================================
echo "[2/5] Stopping AI Node components..."

# Define ConfigNode home (same as IOTDB_HOME)
CONFIG_NODE_HOME="$IOTDB_HOME"

# First, stop AI Node (DataNode)
if [ -d "$AINODE_HOME" ]; then
    cd "$AINODE_HOME"

    if [ -f "./sbin/stop-ainode.sh" ]; then
        ./sbin/stop-ainode.sh > /dev/null 2>&1 &
        echo "  Waiting for AI Node to stop..."

        # Wait for graceful shutdown
        for i in {1..15}; do
            if ! nc -z localhost 10810 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} AI Node (DataNode) stopped"
                break
            fi
            sleep 1
            echo -n "."
        done

        # Force kill if still running
        if nc -z localhost 10810 2>/dev/null; then
            echo ""
            echo -e "  ${YELLOW}⚠ Force killing AI Node...${NC}"
            pkill -9 -f "ainode" || true
            sleep 2
        fi
    else
        # Try to find and kill AINode processes
        if pkill -f "python.*ainode"; then
            echo -e "  ${GREEN}✓${NC} AI Node (DataNode) stopped"
        else
            echo -e "  ${YELLOW}AI Node (DataNode) not running${NC}"
        fi
    fi
else
    echo -e "  ${YELLOW}AI Node directory not found${NC}"
    pkill -f "ainode" 2>/dev/null || true
fi

# Then, stop ConfigNode
echo ""
echo "  Stopping ConfigNode..."
if [ -d "$CONFIG_NODE_HOME" ]; then
    cd "$CONFIG_NODE_HOME"

    if [ -f "./sbin/stop-confignode.sh" ]; then
        ./sbin/stop-confignode.sh > /dev/null 2>&1 &
        echo "  Waiting for ConfigNode to stop..."

        # Wait for graceful shutdown
        for i in {1..15}; do
            if ! nc -z localhost 10710 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} ConfigNode stopped"
                break
            fi
            sleep 1
            echo -n "."
        done

        # Force kill if still running
        if nc -z localhost 10710 2>/dev/null; then
            echo ""
            echo -e "  ${YELLOW}⚠ Force killing ConfigNode...${NC}"
            pkill -9 -f "ConfigNode" || true
            sleep 2
        fi
    else
        # Try to find and kill ConfigNode processes
        if pkill -f "ConfigNode"; then
            echo -e "  ${GREEN}✓${NC} ConfigNode stopped"
        else
            echo -e "  ${YELLOW}ConfigNode not running${NC}"
        fi
    fi
else
    echo -e "  ${YELLOW}ConfigNode directory not found${NC}"
    pkill -f "ConfigNode" 2>/dev/null || true
fi

echo ""

# ============================================
# 3. Stop IoTDB
# ============================================
echo "[3/5] Stopping IoTDB..."

if [ -d "$IOTDB_HOME" ]; then
    cd "$IOTDB_HOME"

    # Check if IoTDB is running
    if ! pgrep -f "iotdb" > /dev/null; then
        echo -e "  ${YELLOW}IoTDB is not running${NC}"
    else
        # Stop DataNode
        if [ -f "./sbin/stop-datanode.sh" ]; then
            echo "  Stopping IoTDB DataNode..."
            ./sbin/stop-datanode.sh > /dev/null 2>&1 &
        fi

        # Wait for graceful shutdown
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

        # Force kill if still running
        if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
            echo ""
            echo -e "  ${YELLOW}⚠ IoTDB did not stop gracefully, force killing...${NC}"
            pkill -9 -f "iotdb" || true
            sleep 2
        fi
    fi
else
    echo -e "  ${YELLOW}IoTDB directory not found${NC}"
    pkill -f "iotdb" 2>/dev/null || true
fi

echo ""

# ============================================
# 4. Stop Optional Services
# ============================================
echo "[4/5] Stopping optional services..."

# Stop PostgreSQL (optional - comment out if you want it to keep running)
# if pgrep -x postgres > /dev/null; then
#     echo "  Stopping PostgreSQL..."
#     sudo systemctl stop postgresql 2>/dev/null || service postgresql stop 2>/dev/null
#     echo -e "  ${GREEN}✓${NC} PostgreSQL stopped"
# else
#     echo -e "  ${YELLOW}PostgreSQL not running${NC}"
# fi

# Stop Redis (optional - comment out if you want it to keep running)
# if pgrep -x redis-server > /dev/null; then
#     echo "  Stopping Redis..."
#     sudo systemctl stop redis 2>/dev/null || service redis stop 2>/dev/null
#     echo -e "  ${GREEN}✓${NC} Redis stopped"
# else
#     echo -e "  ${YELLOW}Redis not running${NC}"
# fi

echo -e "  ${YELLOW}PostgreSQL and Redis left running (for data persistence)${NC}"

echo ""

# ============================================
# 5. Verify ports are released
# ============================================
echo "[5/5] Verifying ports..."

PORTS=(6667 10710 10810 18080 8000 3000)
ALL_CLEARED=true

for PORT in "${PORTS[@]}"; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "  ${RED}✗ Port $PORT still in use${NC}"
        ALL_CLEARED=false
    fi
done

if [ "$ALL_CLEARED" = true ]; then
    echo -e "  ${GREEN}✓ All ports released${NC}"
else
    echo ""
    echo "  ${YELLOW}Some ports still in use. You may need to manually kill processes:${NC}"
    echo "  sudo lsof -ti :3000 | xargs kill -9"
    echo "  sudo lsof -ti :8000 | xargs kill -9"
fi

echo ""
echo "========================================"
echo "  All Services Stopped!"
echo "========================================"
echo ""

# Clean up PM2 PID file (optional)
# pm2 delete all 2>/dev/null || true
# pm2 flush 2>/dev/null || true

echo "Note: PostgreSQL and Redis are left running to preserve data."
echo "      To stop them, uncomment the relevant sections in this script."
echo ""

# Exit successfully
# Clear PM2 saved configuration so services don't auto-restart
pm2 save --force > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} PM2 configuration cleared"

exit 0

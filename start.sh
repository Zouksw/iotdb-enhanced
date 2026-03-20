#!/bin/bash
# IoTDB Enhanced Platform - Start Script (PM2 Version)
# ========================================
# 统一启动所有服务：IoTDB + AI Node + Backend + Frontend

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

# Service status tracking
IOTDB_STARTED=false
AINODE_STARTED=false

# Application mode: development | production | staging
# Change this to switch the default mode
APP_MODE="${APP_MODE:-development}"

echo "========================================"
echo "  IoTDB Enhanced Platform"
echo "========================================"
echo ""
echo "Starting services..."
echo ""

# ============================================
# 1. Check and Start IoTDB
# ============================================
echo "[1/6] Checking IoTDB..."

if nc -z localhost 6667 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} IoTDB is already running (port 6667)"
elif [ ! -d "$IOTDB_HOME" ]; then
    echo -e "  ${YELLOW}⚠${NC} IoTDB not found at $IOTDB_HOME"
    echo -e "  ${YELLOW}⚠${NC} Skipping IoTDB startup (backend will run without IoTDB)"
    IOTDB_STARTED=false
else
    echo "  Starting IoTDB DataNode..."
    cd "$IOTDB_HOME"

    # Clean up any existing processes
    pkill -9 -f "iotdb" 2>/dev/null || true
    sleep 1

    # Start IoTDB
    nohup ./sbin/start-standalone.sh > /tmp/iotdb.log 2>&1 &
    IOTDB_PID=$!

    # Wait for IoTDB to start with timeout
    IOTDB_STARTED=false
    for i in {1..30}; do
        if nc -z localhost 6667 2>/dev/null; then
            echo -e "\n  ${GREEN}✓${NC} IoTDB DataNode started"
            IOTDB_STARTED=true
            break
        fi
        sleep 2
        echo -n "."
    done

    if ! $IOTDB_STARTED; then
        echo -e "\n  ${YELLOW}⚠${NC} IoTDB did not start within timeout (60s)"
        echo -e "  ${YELLOW}⚠${NC} Continuing without IoTDB..."
        # Kill the hung process
        kill $IOTDB_PID 2>/dev/null || true
    else
        # Check ConfigNode
        if nc -z localhost 10710 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} IoTDB ConfigNode started"
        fi

        # Check REST API
        sleep 2
        if curl -s http://localhost:18080/ping > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} IoTDB REST API ready"
        fi
    fi
fi

echo ""

# ============================================
# 2. Check and Start AI Node
# ============================================
echo "[2/6] Checking AI Node..."

# Define ConfigNode home (same as IOTDB_HOME)
CONFIG_NODE_HOME="$IOTDB_HOME"

if nc -z localhost 10810 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} AI Node is already running (port 10810)"
elif [ ! -d "$AINODE_HOME" ] || [ ! -f "$AINODE_HOME/sbin/start-ainode.sh" ]; then
    echo -e "  ${YELLOW}⚠${NC} AI Node not found at $AINODE_HOME"
    echo -e "  ${YELLOW}⚠${NC} Skipping AI Node startup (AI features will be unavailable)"
elif [ ! -d "$CONFIG_NODE_HOME" ] || [ ! -f "$CONFIG_NODE_HOME/sbin/start-confignode.sh" ]; then
    echo -e "  ${YELLOW}⚠${NC} ConfigNode not found at $CONFIG_NODE_HOME"
    echo -e "  ${YELLOW}⚠${NC} Skipping AI Node startup (ConfigNode is required)"
else
    # First, ensure ConfigNode is running
    if ! nc -z localhost 10710 2>/dev/null; then
        echo "  Starting ConfigNode (required for AI Node)..."
        cd "$CONFIG_NODE_HOME"

        nohup ./sbin/start-confignode.sh > /tmp/confignode.log 2>&1 &
        CONFIGNODE_PID=$!

        # Wait for ConfigNode to start
        for i in {1..30}; do
            if nc -z localhost 10710 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} ConfigNode started (port 10710)"
                break
            fi
            sleep 1
            echo -n "."
        done

        # If ConfigNode still not started, skip AI Node
        if ! nc -z localhost 10710 2>/dev/null; then
            echo -e "\n  ${YELLOW}⚠${NC} ConfigNode failed to start, skipping AI Node"
            echo -e "  ${YELLOW}⚠${NC} AI features will be unavailable"
            cd "$PROJECT_DIR"
        else
            # ConfigNode is running, now start AI Node
            cd "$PROJECT_DIR"
            echo ""
            echo "  Starting AI Node..."
            cd "$AINODE_HOME"

            # Clean old AI Node data if needed
            if [ -d "data/ainode" ]; then
                echo "  Cleaning old AI Node data directory..."
                rm -rf "data/ainode"
            fi

            # Start AI Node
            nohup ./sbin/start-ainode.sh > /tmp/ainode.log 2>&1 &
            AINODE_PID=$!

            # Wait for AI Node to start
            AINODE_STARTED=false
            for i in {1..30}; do
                if nc -z localhost 10810 2>/dev/null; then
                    echo -e "  ${GREEN}✓${NC} AI Node started (port 10810)"
                    AINODE_STARTED=true
                    break
                fi
                sleep 1
                echo -n "."
            done

            cd "$PROJECT_DIR"

            if ! $AINODE_STARTED; then
                echo -e "\n  ${YELLOW}⚠${NC} AI Node did not start within timeout (30s)"
                echo -e "  ${YELLOW}⚠${NC} Continuing without AI Node..."
                kill $AINODE_PID 2>/dev/null || true
            fi
        fi
    else
        echo -e "  ${GREEN}✓${NC} ConfigNode is already running (port 10710)"
        echo ""
        echo "  Starting AI Node..."
        cd "$AINODE_HOME"

        # Clean old AI Node data if needed
        if [ -d "data/ainode" ]; then
            echo "  Cleaning old AI Node data directory..."
            rm -rf "data/ainode"
        fi

        # Start AI Node
        nohup ./sbin/start-ainode.sh > /tmp/ainode.log 2>&1 &
        AINODE_PID=$!

        # Wait for AI Node to start
        AINODE_STARTED=false
        for i in {1..30}; do
            if nc -z localhost 10810 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} AI Node started (port 10810)"
                AINODE_STARTED=true
                break
            fi
            sleep 1
            echo -n "."
        done

        cd "$PROJECT_DIR"

        if ! $AINODE_STARTED; then
            echo -e "\n  ${YELLOW}⚠${NC} AI Node did not start within timeout (30s)"
            echo -e "  ${YELLOW}⚠${NC} Continuing without AI Node..."
            kill $AINODE_PID 2>/dev/null || true
        fi
    fi
fi

echo ""

# ============================================
# 3. Check PostgreSQL
# ============================================
echo "[3/6] Checking PostgreSQL..."

if pgrep -x postgres > /dev/null || nc -z localhost 5432 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL is running"
else
    echo -e "  ${YELLOW}⚠${NC} PostgreSQL is not running. Starting..."
    sudo systemctl start postgresql || service postgresql start
    sleep 2

    if pgrep -x postgres > /dev/null; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL started"
    else
        echo -e "  ${RED}✗${NC} Failed to start PostgreSQL"
    fi
fi

echo ""

# ============================================
# 4. Check Redis
# ============================================
echo "[4/6] Checking Redis..."

if pgrep -x redis-server > /dev/null || nc -z localhost 6379 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Redis is running"
else
    echo -e "  ${YELLOW}⚠${NC} Redis is not running. Starting..."
    sudo systemctl start redis || service redis start
    sleep 2

    if pgrep -x redis-server > /dev/null; then
        echo -e "  ${GREEN}✓${NC} Redis started"
    else
        echo -e "  ${RED}✗${NC} Failed to start Redis"
    fi
fi

echo ""

# ============================================
# 5. Start Backend with PM2
# ============================================
echo "[5/6] Starting Backend service..."

cd "$PROJECT_DIR"

# Check if backend is already running in PM2
if pm2 describe iotdb-backend 2>/dev/null | grep -q "online"; then
    echo -e "  ${YELLOW}Backend is already running in PM2${NC}"
    pm2 restart iotdb-backend
else
    # Start backend directly in dev mode (more reliable than ecosystem config)
    cd backend
    pm2 start "npm run dev" --name iotdb-backend
    cd "$PROJECT_DIR"

    # Wait for PM2 to start
    sleep 3

    # Wait for backend to be ready (try multiple endpoints)
    for i in {1..30}; do
        if nc -z localhost 8000 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Backend started (PM2 managed)"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

echo ""

# ============================================
# 6. Start Frontend with PM2
# ============================================
echo "[6/6] Starting Frontend service..."

# Check if frontend is already running in PM2
if pm2 describe iotdb-frontend 2>/dev/null | grep -q "online"; then
    echo -e "  ${YELLOW}Frontend is already running in PM2${NC}"
    pm2 restart iotdb-frontend
else
    # Start frontend directly in dev mode
    cd frontend
    pm2 start "npm run dev" --name iotdb-frontend
    cd "$PROJECT_DIR"

    # Wait for frontend to be ready
    for i in {1..30}; do
        if nc -z localhost 3000 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Frontend started (PM2 managed)"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

echo ""

# ============================================
# Health Check
# ============================================
echo "========================================"
echo "  Health Check"
echo "========================================"
echo ""

# Service status
check_service() {
    local name=$1
    local port=$2
    local url=$3

    if [ -n "$url" ]; then
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name: ${GREEN}Running${NC}"
            return 0
        fi
    elif [ -n "$port" ]; then
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} $name: ${GREEN}Running${NC} (port $port)"
            return 0
        fi
    fi

    echo -e "  ${RED}✗${NC} $name: ${RED}Not Running${NC}"
    return 1
}

check_service "IoTDB DataNode" "6667"
check_service "IoTDB ConfigNode" "10710"
check_service "AI Node" "10810"
check_service "IoTDB REST API" "18080" "http://localhost:18080/ping"
check_service "PostgreSQL" "5432"
check_service "Redis" "6379"
check_service "Backend API" "8000" ""  # Just check port, no health endpoint
check_service "Frontend" "3000" ""  # Just check port

echo ""
echo "========================================"
echo "  All Services Started!"
echo "========================================"
echo ""
echo "Access URLs:"
echo -e "  ${GREEN}Frontend:${NC}        http://localhost:3000"
echo -e "  ${GREEN}Backend API:${NC}     http://localhost:8000"
echo -e "  ${GREEN}IoTDB REST API:${NC}  http://localhost:18080"
echo ""
echo "PM2 Commands:"
echo "  pm2 status              - Show process status"
echo "  pm2 logs                - Show logs"
echo "  pm2 restart all         - Restart all services"
echo "  pm2 stop all            - Stop all services"
echo "  pm2 monit               - Monitor dashboard"
echo ""
echo "To stop all services, run: ./stop.sh"
echo ""

# Save PM2 configuration for auto-restart on system reboot
pm2 save > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} PM2 configuration saved (services will restart on reboot)"
echo ""

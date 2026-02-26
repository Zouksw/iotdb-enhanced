#!/bin/bash
# IoTDB Enhanced Platform - Start Script
# ========================================
# 统一启动所有服务：IoTDB + AI Node + Backend + Frontend

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
echo "Starting services..."
echo ""

# ============================================
# 1. Start IoTDB + AI Node
# ============================================
echo "[1/4] Starting IoTDB + AI Node..."

# Check if IoTDB is already running
if pgrep -f "iotdb" > /dev/null && nc -z localhost 6667 2>/dev/null; then
    echo -e "  ${YELLOW}IoTDB is already running${NC}"
else
    # Kill any existing IoTDB processes first
    pkill -9 -f "iotdb" 2>/dev/null || true
    sleep 2

    cd "$IOTDB_HOME"
    nohup ./sbin/start-standalone.sh > /dev/null 2>&1 &

    # Wait for IoTDB to start
    echo "  Waiting for IoTDB to start..."
    for i in {1..40}; do
        if nc -z localhost 6667 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} IoTDB DataNode started (port 6667)"
            break
        fi
        sleep 1
        echo -n "."
    done

    # Wait for AI Node to start
    sleep 3
    if nc -z localhost 10810 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} AI Node started (port 10810)"
    else
        echo "  Waiting for AI Node..."
        for i in {1..15}; do
            if nc -z localhost 10810 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} AI Node started (port 10810)"
                break
            fi
            sleep 1
            echo -n "."
        done
    fi
fi

# Check IoTDB REST API
if curl -s http://localhost:18080/ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} IoTDB REST API ready (port 18080)"
else
    echo -e "  ${YELLOW}⚠ Waiting for REST API...${NC}"
    sleep 3
fi

echo ""

# ============================================
# 2. Start Backend
# ============================================
echo "[2/4] Starting Backend service..."

cd "$BACKEND_DIR"

# Check if .env exists, if not create default one
if [ ! -f .env ]; then
    echo "  Creating .env file..."
    cat > .env << 'ENVEOF'
# IoTDB Configuration
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=root
IOTDB_PASSWORD=root
IOTDB_REST_URL=http://localhost:18080

# Server Configuration
PORT=8002
NODE_ENV=development
ENVEOF
fi

# Check if backend is already running
if pgrep -f "node.*backend" > /dev/null || pgrep -f "nodemon.*backend" > /dev/null; then
    echo -e "  ${YELLOW}Backend is already running${NC}"
else
    # Start backend in background
    nohup npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .pid

    # Wait for backend to be ready
    echo "  Waiting for backend to start..."
    for i in {1..15}; do
        if curl -s http://localhost:8002/api/iotdb/status > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Backend started (PID: $BACKEND_PID, port 8002)"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

echo ""

# ============================================
# 3. Start Frontend
# ============================================
echo "[3/4] Starting Frontend service..."

cd "$FRONTEND_DIR"

# Check if frontend is already running
if pgrep -f "next-server" > /dev/null; then
    echo -e "  ${YELLOW}Frontend is already running${NC}"
else
    # Start frontend in background
    nohup npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > .pid

    # Wait for frontend to be ready
    echo "  Waiting for frontend to start..."
    for i in {1..20}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Frontend started (PID: $FRONTEND_PID, port 3000)"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

echo ""

# ============================================
# 4. Health Check
# ============================================
echo "[4/4] Running health check..."

# Check IoTDB
if curl -s http://localhost:18080/ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} IoTDB: Healthy"
else
    echo -e "  ${RED}✗${NC} IoTDB: Not responding"
fi

# Check AI Node
if nc -z localhost 10810 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} AI Node: Running"
else
    echo -e "  ${RED}✗${NC} AI Node: Not responding"
fi

# Check Backend
if curl -s http://localhost:8002/api/iotdb/status > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend API: Running"
else
    echo -e "  ${RED}✗${NC} Backend API: Not responding"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Frontend: Running"
else
    echo -e "  ${RED}✗${NC} Frontend: Not responding"
fi

echo ""
echo "========================================"
echo "  All Services Started!"
echo "========================================"
echo ""
echo "Access URLs:"
echo -e "  ${GREEN}Frontend:${NC}        http://localhost:3000"
echo -e "  ${GREEN}Backend API:${NC}     http://localhost:8002"
echo -e "  ${GREEN}IoTDB REST API:${NC}  http://localhost:18080"
echo ""
echo "AI Pages:"
echo -e "  ${GREEN}- AI Prediction:${NC}   http://localhost:3000/ai/predict"
echo -e "  ${GREEN}- AI Models:${NC}      http://localhost:3000/ai/models"
echo -e "  ${GREEN}- AI Anomalies:${NC}   http://localhost:3000/ai/anomalies"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "To stop all services, run: ./stop.sh"
echo ""

#!/bin/bash
# IoTDB Enhanced Platform - Status Check Script
# =================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOTDB_HOME="/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  IoTDB Enhanced Platform Status"
echo "========================================"
echo ""

# Function to check service status
check_service() {
    local name=$1
    local port=$2
    local check_cmd=$3

    if [ -n "$port" ]; then
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} $name (port $port)"
            return 0
        else
            echo -e "  ${RED}✗${NC} $name (port $port) - Not running"
            return 1
        fi
    elif [ -n "$check_cmd" ]; then
        if eval "$check_cmd" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name"
            return 0
        else
            echo -e "  ${RED}✗${NC} $name - Not running"
            return 1
        fi
    fi
}

# Check each service
echo "IoTDB Services:"
check_service "  ConfigNode" "10710"
check_service "  DataNode" "6667"
check_service "  AI Node" "10810"
check_service "  REST API" "18080" "curl -s http://localhost:18080/ping"

echo ""
echo "Application Services:"
check_service "  Backend API" "8002"
check_service "  Frontend" "3000"

echo ""
echo "========================================"
echo "Access URLs:"
echo -e "  ${BLUE}Frontend:${NC}       http://localhost:3000"
echo -e "  ${BLUE}Backend API:${NC}    http://localhost:8002"
echo -e "  ${BLUE}IoTDB REST API:${NC} http://localhost:18080"
echo ""
echo "AI Pages:"
echo -e "  ${BLUE}AI Prediction:${NC}  http://localhost:3000/ai/predict"
echo -e "  ${BLUE}AI Models:${NC}     http://localhost:3000/ai/models"
echo -e "  ${BLUE}AI Anomalies:${NC}  http://localhost:3000/ai/anomalies"
echo ""

# Show process IDs if running
echo "========================================"
echo "Process Information:"
echo ""

# IoTDB processes
IOTDB_PIDS=$(pgrep -f "iotdb" 2>/dev/null)
if [ -n "$IOTDB_PIDS" ]; then
    echo "IoTDB Processes:"
    echo "$IOTDB_PIDS" | head -3 | while read pid; do
        ps -p "$pid" -o pid,cmd --no-headers 2>/dev/null | head -c 80
        echo ""
    done
fi

# Backend process
BACKEND_PID=""
if [ -f "$PROJECT_DIR/backend/.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/backend/.pid")
fi
if [ -n "$BACKEND_PID" ] && ps -p "$BACKEND_PID" > /dev/null 2>&1; then
    echo "Backend PID: $BACKEND_PID"
fi

# Frontend process
FRONTEND_PID=""
if [ -f "$PROJECT_DIR/frontend/.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/frontend/.pid")
fi
if [ -n "$FRONTEND_PID" ] && ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
    echo "Frontend PID: $FRONTEND_PID"
fi

echo ""
echo "========================================"

# Quick health check
echo ""
echo "Quick Health Check:"
HEALTHY=0

# Check IoTDB
if curl -s http://localhost:8002/api/iotdb/status > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend can connect to IoTDB"
else
    echo -e "  ${RED}✗${NC} Backend cannot connect to IoTDB"
    HEALTHY=1
fi

# Check AI models
if curl -s http://localhost:8002/api/iotdb/ai/models > /dev/null 2>&1; then
    MODEL_COUNT=$(curl -s http://localhost:8002/api/iotdb/ai/models | grep -o '"id":"[^"]*"' | wc -l)
    echo -e "  ${GREEN}✓${NC} AI Models available ($MODEL_COUNT models)"
else
    echo -e "  ${YELLOW}⚠${NC} Cannot fetch AI models"
fi

echo ""
if [ $HEALTHY -eq 0 ]; then
    echo -e "${GREEN}All services healthy!${NC}"
else
    echo -e "${YELLOW}Some services have issues.${NC}"
fi
echo ""

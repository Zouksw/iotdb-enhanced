#!/bin/bash
#
# IoTDB AI Node Start Script
# Starts the Apache IoTDB AI Node service with verification
#

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# AI Node installation directory
AINODE_HOME="/opt/iotdb-ainode/apache-iotdb-2.0.5-ainode-bin"
AINODE_PORT=10810
AINODE_STARTUP_TIMEOUT=30

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   IoTDB AI Node - Start Script${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Check if AI Node is already running
if nc -z localhost $AINODE_PORT 2>/dev/null; then
    echo -e "${YELLOW}AI Node is already running on port $AINODE_PORT${NC}"
    echo "Checking process status..."
    ps aux | grep -E "ainode.*start" | grep -v grep || true
    echo ""
    echo -e "${GREEN}AI Node is operational!${NC}"
    exit 0
fi

# Check if AI Node directory exists
if [ ! -d "$AINODE_HOME" ]; then
    echo -e "${RED}ERROR: AI Node directory not found: $AINODE_HOME${NC}"
    exit 1
fi

# Check if start script exists
if [ ! -f "$AINODE_HOME/sbin/start-ainode.sh" ]; then
    echo -e "${RED}ERROR: AI Node start script not found${NC}"
    exit 1
fi

# Start AI Node
echo "Starting IoTDB AI Node..."
cd "$AINODE_HOME"
./sbin/start-ainode.sh

# Wait for AI Node to start
echo "Waiting for AI Node to start (timeout: ${AINODE_STARTUP_TIMEOUT}s)..."
elapsed=0
while [ $elapsed -lt $AINODE_STARTUP_TIMEOUT ]; do
    if nc -z localhost $AINODE_PORT 2>/dev/null; then
        echo -e "${GREEN}✓ AI Node started successfully on port $AINODE_PORT${NC}"
        echo ""
        echo "Service Details:"
        echo "  Port: $AINODE_PORT"
        echo "  Home: $AINODE_HOME"
        echo "  Logs: $AINODE_HOME/logs/"
        echo ""
        echo "Recent logs:"
        tail -5 "$AINODE_HOME/logs/log_ainode_info.log" 2>/dev/null || true
        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}   AI Node Started Successfully!${NC}"
        echo -e "${GREEN}================================================${NC}"
        exit 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
    echo -n "."
done

echo ""
echo -e "${RED}ERROR: AI Node failed to start within ${AINODE_STARTUP_TIMEOUT}s${NC}"
echo ""
echo "Troubleshooting:"
echo "  1. Check logs: tail -50 $AINODE_HOME/logs/log_ainode_error.log"
echo "  2. Check process: ps aux | grep ainode"
echo "  3. Check IoTDB: nc -z localhost 6667"
exit 1

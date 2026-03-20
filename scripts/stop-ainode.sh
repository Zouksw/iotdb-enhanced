#!/bin/bash
#
# IoTDB AI Node Stop Script
# Stops the Apache IoTDB AI Node service
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

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   IoTDB AI Node - Stop Script${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Check if AI Node is running
if ! nc -z localhost $AINODE_PORT 2>/dev/null; then
    echo -e "${YELLOW}AI Node is not running (port $AINODE_PORT is closed)${NC}"
    echo ""
    echo "Checking for orphaned processes..."
    PIDS=$(ps aux | grep -E "ainode.*start" | grep -v grep | awk '{print $2}' || true)
    if [ -n "$PIDS" ]; then
        echo "Found orphaned processes: $PIDS"
        echo "Killing orphaned processes..."
        echo "$PIDS" | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ Orphaned processes cleaned up${NC}"
    else
        echo "No orphaned processes found"
    fi
    echo ""
    echo -e "${GREEN}AI Node is stopped${NC}"
    exit 0
fi

# Check if AI Node directory exists
if [ ! -d "$AINODE_HOME" ]; then
    echo -e "${RED}ERROR: AI Node directory not found: $AINODE_HOME${NC}"
    exit 1
fi

# Check if stop script exists
if [ ! -f "$AINODE_HOME/sbin/stop-ainode.sh" ]; then
    echo -e "${RED}ERROR: AI Node stop script not found${NC}"
    exit 1
fi

# Stop AI Node
echo "Stopping IoTDB AI Node..."
cd "$AINODE_HOME"
./sbin/stop-ainode.sh

# Wait for AI Node to stop
echo "Waiting for AI Node to stop..."
sleep 3

# Verify AI Node is stopped
if nc -z localhost $AINODE_PORT 2>/dev/null; then
    echo -e "${YELLOW}AI Node port still open, forcing shutdown...${NC}"

    # Find and kill AI Node processes
    PIDS=$(ps aux | grep -E "ainode.*start" | grep -v grep | awk '{print $2}' || true)
    if [ -n "$PIDS" ]; then
        echo "Killing AI Node processes: $PIDS"
        echo "$PIDS" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi

    # Final check
    if nc -z localhost $AINODE_PORT 2>/dev/null; then
        echo -e "${RED}ERROR: Failed to stop AI Node${NC}"
        echo "Port $AINODE_PORT is still in use"
        exit 1
    fi
fi

echo -e "${GREEN}✓ AI Node stopped successfully${NC}"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   AI Node Stopped${NC}"
echo -e "${GREEN}================================================${NC}"

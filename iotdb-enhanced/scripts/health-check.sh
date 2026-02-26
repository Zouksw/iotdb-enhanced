#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Comprehensive Health Check Script
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
WARN=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}IoTDB Enhanced - System Health Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check service
check_service() {
    local name=$1
    local host=$2
    local port=$3
    local command=$4
    
    echo -n "Checking $name... "
    
    if [ -n "$command" ]; then
        if eval "$command" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((PASS++))
            return 0
        fi
    elif nc -zv "$host" "$port" 2>&1 | grep -q succeeded; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
        return 0
    fi
    
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
    return 1
}

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response, expected $expected)"
        ((FAIL++))
        return 1
    fi
}

# Function to check JSON API
check_api() {
    local name=$1
    local url=$2
    local field=$3
    local expected=$4
    
    echo -n "Checking $name... "
    
    response=$(curl -s "$url")
    value=$(echo "$response" | grep -o "\"$field\":\"[^\"]*" | cut -d'"' -f4)
    
    if [ "$value" = "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($field=$value)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} ($field=$value, expected $expected)"
        ((FAIL++))
        return 1
    fi
}

echo -e "${YELLOW}=== Core Services ===${NC}"
check_service "Backend API" "localhost" "8000"
check_service "Frontend" "localhost" "3000"
check_service "PostgreSQL" "localhost" "5432" "pg_isready -h localhost"
check_service "Redis" "localhost" "6379" "redis-cli ping"
echo ""

echo -e "${YELLOW}=== IoTDB Services ===${NC}"
check_service "IoTDB DataNode" "localhost" "6667"
check_service "IoTDB ConfigNode" "localhost" "10710"
check_service "IoTDB REST API" "localhost" "18080"
echo ""

echo -e "${YELLOW}=== HTTP Endpoints ===${NC}"
check_http "Backend Health" "http://localhost:8000/health" "200"
check_http "Frontend Home" "http://localhost:3000/" "200"
check_http "Frontend Login" "http://localhost:3000/login" "200"
check_http "Frontend Dashboard" "http://localhost:3000/dashboard" "200"
echo ""

echo -e "${YELLOW}=== API Functionality ===${NC}"
check_api "Backend Status" "http://localhost:8000/health" "status" "ok"
check_api "IoTDB Status" "http://localhost:8000/api/iotdb/status" "status" "healthy"
echo ""

echo -e "${YELLOW}=== PM2 Processes ===${NC}"
if pm2 list 2>/dev/null | grep -q "online"; then
    echo -e "${GREEN}✓ PASS${NC} PM2 processes running"
    ((PASS++))
    pm2 list 2>/dev/null | grep online
else
    echo -e "${RED}✗ FAIL${NC} No PM2 processes running"
    ((FAIL++))
fi
echo ""

echo -e "${YELLOW}=== Disk Space ===${NC}"
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "Root disk usage: $disk_usage%"
if [ "$disk_usage" -lt 80 ]; then
    echo -e "${GREEN}✓ PASS${NC} Disk space OK"
    ((PASS++))
elif [ "$disk_usage" -lt 90 ]; then
    echo -e "${YELLOW}⚠ WARN${NC} Disk space above 80%"
    ((WARN++))
else
    echo -e "${RED}✗ FAIL${NC} Disk space critical"
    ((FAIL++))
fi
echo ""

echo -e "${YELLOW}=== Memory Usage ===${NC}"
mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
echo "Memory usage: $mem_usage%"
if [ "$mem_usage" -lt 80 ]; then
    echo -e "${GREEN}✓ PASS${NC} Memory OK"
    ((PASS++))
elif [ "$mem_usage" -lt 90 ]; then
    echo -e "${YELLOW}⚠ WARN${NC} Memory usage above 80%"
    ((WARN++))
else
    echo -e "${RED}✗ FAIL${NC} Memory critical"
    ((FAIL++))
fi
echo ""

echo -e "${YELLOW}=== Environment Variables ===${NC}"
env_file="/root/iotdb-enhanced/backend/.env"
missing=0

if [ -f "$env_file" ]; then
    for var in DATABASE_URL JWT_SECRET SESSION_SECRET REDIS_URL IOTDB_HOST IOTDB_PASSWORD; do
        if grep -q "^${var}=" "$env_file" && ! grep -q "CHANGE_ME" "$env_file" | grep -q "^${var}="; then
            :  # Variable is set and not placeholder
        else
            echo -e "${RED}✗ $var: ${NC}Missing or using placeholder"
            ((missing++))
        fi
    done
    
    if [ $missing -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} All required environment variables set"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} $missing environment variable(s) missing"
        ((FAIL++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} .env file not found"
    ((FAIL++))
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Health Check Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review above.${NC}"
    exit 1
fi

#!/bin/bash
# Test all IoTDB Enhanced Platform features

echo "========================================"
echo "IoTDB Enhanced - Complete Feature Test"
echo "========================================"

API_BASE="http://localhost:8002/api/iotdb"
FRONTEND_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}[OK]${NC} $2"
        return 0
    else
        echo -e "  ${RED}[FAIL]${NC} $2"
        return 1
    fi
}

echo ""
echo "=== 1. Service Status ==="

# Check IoTDB
if netstat -tlnp 2>/dev/null | grep -q ":6667.*LISTEN"; then
    test_result 0 "IoTDB DataNode (port 6667)"
else
    test_result 1 "IoTDB DataNode not running"
fi

if netstat -tlnp 2>/dev/null | grep -q ":18080.*LISTEN"; then
    test_result 0 "IoTDB REST API (port 18080)"
else
    test_result 1 "IoTDB REST API not running"
fi

# Check AI Node
if netstat -tlnp 2>/dev/null | grep -q ":10810.*LISTEN"; then
    test_result 0 "AI Node (port 10810)"
else
    test_result 1 "AI Node not running"
fi

# Check Backend
if netstat -tlnp 2>/dev/null | grep -q ":8002.*LISTEN"; then
    test_result 0 "Backend API (port 8002)"
else
    test_result 1 "Backend API not running"
fi

# Check Frontend
if netstat -tlnp 2>/dev/null | grep -q ":3000.*LISTEN"; then
    test_result 0 "Frontend (port 3000)"
else
    test_result 1 "Frontend not running"
fi

echo ""
echo "=== 2. IoTDB Basic Functions ==="

# Health check
RESPONSE=$(curl -s "$API_BASE/status")
if echo "$RESPONSE" | grep -q "healthy"; then
    test_result 0 "IoTDB health check"
else
    test_result 1 "IoTDB health check failed"
fi

# SQL Query
RESPONSE=$(curl -s -X POST "$API_BASE/sql" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM root.test1 LIMIT 5"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "SQL query working"
else
    test_result 1 "SQL query failed"
fi

# List Timeseries
RESPONSE=$(curl -s "$API_BASE/timeseries")
if echo "$RESPONSE" | grep -q "root"; then
    test_result 0 "List timeseries working"
else
    test_result 1 "List timeseries failed"
fi

echo ""
echo "=== 3. AI Node Functions ==="

# List Models
RESPONSE=$(curl -s "$API_BASE/ai/models")
MODEL_COUNT=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
if [ "$MODEL_COUNT" -ge 5 ]; then
    test_result 0 "List AI models ($MODEL_COUNT models available)"
else
    test_result 1 "List AI models failed"
fi

# ARIMA Prediction
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "arima"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "ARIMA prediction working"
else
    test_result 1 "ARIMA prediction failed"
fi

# HoltWinters Prediction
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "holtwinters"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "HoltWinters prediction working"
else
    test_result 1 "HoltWinters prediction failed"
fi

# Naive Forecaster
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "naive_forecaster"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "Naive Forecaster prediction working"
else
    test_result 1 "Naive Forecaster prediction failed"
fi

# Batch Prediction
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{"requests": [{"timeseries": "root.test1", "horizon": 2, "algorithm": "arima"}, {"timeseries": "root.test1", "horizon": 2, "algorithm": "holtwinters"}]}')
if echo "$RESPONSE" | grep -q "results"; then
    test_result 0 "Batch prediction working"
else
    test_result 1 "Batch prediction failed"
fi

# Anomaly Detection
RESPONSE=$(curl -s -X POST "$API_BASE/ai/anomalies" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test2", "threshold": 1.5}')
if echo "$RESPONSE" | grep -q "anomalies"; then
    test_result 0 "Anomaly detection working"
else
    test_result 1 "Anomaly detection failed"
fi

echo ""
echo "=== 4. Frontend Pages ==="

# Check AI Predict page
RESPONSE=$(curl -s "$FRONTEND_URL/ai/predict")
if echo "$RESPONSE" | grep -q "AI Prediction"; then
    test_result 0 "AI Predict page accessible"
else
    test_result 1 "AI Predict page not accessible"
fi

# Check AI Models page
RESPONSE=$(curl -s "$FRONTEND_URL/ai/models")
if echo "$RESPONSE" | grep -q "AI Node"; then
    test_result 0 "AI Models page accessible"
else
    test_result 1 "AI Models page not accessible"
fi

# Check AI Anomalies page
RESPONSE=$(curl -s "$FRONTEND_URL/ai/anomalies")
if echo "$RESPONSE" | grep -q "Anomaly"; then
    test_result 0 "AI Anomalies page accessible"
else
    test_result 1 "AI Anomalies page not accessible"
fi

echo ""
echo "========================================"
echo "Test Complete"
echo "========================================"
echo ""
echo "Access the application at:"
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:3000"
echo -e "  ${BLUE}Backend API:${NC}  http://localhost:8002"
echo -e "  ${BLUE}IoTDB REST:${NC}  http://localhost:18080"
echo ""
echo "AI Pages:"
echo -e "  ${BLUE}- AI Prediction:${NC}  http://localhost:3000/ai/predict"
echo -e "  ${BLUE}- AI Models:${NC}     http://localhost:3000/ai/models"
echo -e "  ${BLUE}- AI Anomalies:${NC}  http://localhost:3000/ai/anomalies"
echo ""

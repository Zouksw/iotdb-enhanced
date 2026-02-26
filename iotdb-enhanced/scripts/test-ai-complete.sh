#!/bin/bash

echo "========================================"
echo "AI Node Integration - Complete Test"
echo "========================================"

API_BASE="http://localhost:8002/api/iotdb"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}[OK]${NC} $2"
        return 0
    else
        echo -e "  ${RED}[FAIL]${NC} $2"
        return 1
    fi
}

# Test 1: Check AI Node status
echo ""
echo "1. Checking AI Node status..."
if netstat -tlnp 2>/dev/null | grep -q ":10810.*LISTEN"; then
    test_result 0 "AI Node is running on port 10810"
else
    test_result 1 "AI Node not accessible"
fi

# Test 2: Test ARIMA prediction
echo ""
echo "2. Testing ARIMA prediction..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "arima"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "ARIMA prediction working"
    echo "     Response: $RESPONSE"
else
    test_result 1 "ARIMA prediction failed"
fi

# Test 3: Test HoltWinters prediction
echo ""
echo "3. Testing HoltWinters prediction..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "holtwinters"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "HoltWinters prediction working"
else
    test_result 1 "HoltWinters prediction failed"
fi

# Test 4: Test Exponential Smoothing prediction
echo ""
echo "4. Testing Exponential Smoothing prediction..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "exponential_smoothing"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "Exponential Smoothing prediction working"
else
    test_result 1 "Exponential Smoothing prediction failed"
fi

# Test 5: Test Naive Forecaster prediction
echo ""
echo "5. Testing Naive Forecaster prediction..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "naive_forecaster"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "Naive Forecaster prediction working"
else
    test_result 1 "Naive Forecaster prediction failed"
fi

# Test 5.1: Test Timer-XL (LSTM) prediction
echo ""
echo "5.1 Testing Timer-XL (LSTM) prediction..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "timer_xl"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "Timer-XL (LSTM) prediction working"
else
    test_result 1 "Timer-XL (LSTM) prediction failed"
fi

# Test 5.2: Test Sundial (Transformer) prediction
echo ""
echo "5.2 Testing Sundial (Transformer) prediction..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 3, "algorithm": "sundial"}')
if echo "$RESPONSE" | grep -q "timestamps"; then
    test_result 0 "Sundial (Transformer) prediction working"
else
    test_result 1 "Sundial (Transformer) prediction failed"
fi

# Test 6: Test anomaly detection
echo ""
echo "6. Testing anomaly detection..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/anomalies" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test2", "threshold": 1.5}')
if echo "$RESPONSE" | grep -q "anomalies"; then
    test_result 0 "Anomaly detection working"
    echo "     Found $(echo "$RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*') anomalies"
else
    test_result 1 "Anomaly detection failed"
fi

# Test 7: List models
echo ""
echo "7. Listing available models..."
RESPONSE=$(curl -s "$API_BASE/ai/models")
MODEL_COUNT=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
if [ "$MODEL_COUNT" -ge 4 ]; then
    test_result 0 "Models list available ($MODEL_COUNT models)"
    echo "     Available models:"
    echo "$RESPONSE" | grep -o '"id":"[^"]*"' | sed 's/"id":/     - /' | sed 's/"//g'
else
    test_result 1 "Models list failed"
fi

# Test 8: Test batch prediction
echo ""
echo "8. Testing batch prediction..."
RESPONSE=$(curl -s -X POST "$API_BASE/ai/predict/batch" \
  -H "Content-Type: application/json" \
  -d '{"requests": [{"timeseries": "root.test1", "horizon": 2, "algorithm": "arima"}, {"timeseries": "root.test1", "horizon": 2, "algorithm": "holtwinters"}]}')
if echo "$RESPONSE" | grep -q "results"; then
    test_result 0 "Batch prediction working"
else
    test_result 1 "Batch prediction failed"
fi

echo ""
echo "========================================"
echo "AI Node Integration Test Complete"
echo "========================================"

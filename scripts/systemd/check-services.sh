#!/bin/bash
# Check status of all IoTDB Enhanced services

echo "IoTDB Enhanced - Service Status"
echo "=================================="
echo ""

for service in postgresql redis iotdb-backend iotdb-frontend; do
  status=$(systemctl is-active $service 2>/dev/null || echo "not-found")
  if [ "$status" = "active" ]; then
    echo "✓ $service: RUNNING"
  else
    echo "✗ $service: STOPPED ($status)"
  fi
done

echo ""
echo "PM2 Processes:"
pm2 list 2>/dev/null || echo "PM2 not running"

echo ""
echo "Ports in use:"
echo "  PostgreSQL (5432): $(nc -z localhost 5432 && echo 'OPEN' || echo 'CLOSED')"
echo "  Redis (6379): $(nc -z localhost 6379 && echo 'OPEN' || echo 'CLOSED')"
echo "  Backend (8000): $(nc -z localhost 8000 && echo 'OPEN' || echo 'CLOSED')"
echo "  Frontend (3000): $(nc -z localhost 3000 && echo 'OPEN' || echo 'CLOSED')"

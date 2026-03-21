#!/bin/bash
# Start all IoTDB Enhanced services in correct order

set -e

echo "Starting IoTDB Enhanced services..."

# Start in order
sudo systemctl start postgresql
echo "✓ PostgreSQL started"

sudo systemctl start redis
echo "✓ Redis started"

sleep 5

sudo systemctl start iotdb-backend
echo "✓ Backend started"

sleep 5

sudo systemctl start iotdb-frontend
echo "✓ Frontend started"

echo ""
echo "All services started!"
echo ""
echo "PM2 Processes:"
pm2 list

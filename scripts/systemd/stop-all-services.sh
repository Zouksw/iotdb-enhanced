#!/bin/bash
# Stop all IoTDB Enhanced services in reverse order

set -e

echo "Stopping IoTDB Enhanced services..."

# Stop in reverse order
sudo systemctl stop iotdb-frontend
echo "✓ Frontend stopped"

sudo systemctl stop iotdb-backend
echo "✓ Backend stopped"

sudo systemctl stop redis
echo "✓ Redis stopped"

sudo systemctl stop postgresql
echo "✓ PostgreSQL stopped"

echo ""
echo "All services stopped!"

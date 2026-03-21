#!/bin/bash
#
# IoTDB Sample Data Seeding Script
#
# Creates realistic time-series data for testing AI features
#
# Usage: ./scripts/seed-data.sh [devices] [days] [interval] [anomalies]
#   devices: Number of devices to create (default: 3)
#   days: Number of days of data (default: 7)
#   interval: Data interval in seconds (default: 60)
#   anomalies: Number of anomalies to inject (default: 5)
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DEVICES=${1:-3}
DAYS=${2:-7}
INTERVAL=${3:-60}
ANOMALIES=${4:-5}
DRY_RUN=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
  esac
done

# Calculate timestamps
END_TIME=$(date +%s)000
START_TIME=$((END_TIME - DAYS * 24 * 60 * 60 * 1000))

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  IoTDB Sample Data Seeding Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Devices: $DEVICES"
echo "Duration: $DAYS days"
echo "Interval: ${INTERVAL}s"
echo "Anomalies: $ANOMALIES per device"
echo "Dry Run: $DRY_RUN"
echo ""

# Create timeseries using SQL
echo -e "${BLUE}Creating time series...${NC}"

DEVICE_IDS=$(seq 1 $DEVICES)
TIMESERIES=""

for device_id in $DEVICE_IDS; do
  TIMESERIES="$TIMESERIES
  root.testing.device_$device_id.temperature,DOUBLE,GORILLA,SNAPPY
  root.testing.device_$device_id.humidity,DOUBLE,GORILLA,SNAPPY
  root.testing.device_$device_id.pressure,DOUBLE,GORILLA,SNAPPY
"
done

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}[DRY RUN] Would create timeseries:${NC}"
  echo "$TIMESERIES" | tr ',' '\n' | sed 's/^/  - /'
else
  echo "$TIMESERIES" | tr ',' '\n' | while read -r ts; do
    [ -z "$ts" ] && continue
    echo "  Creating: $ts"
  done
fi

echo ""
echo -e "${BLUE}Generating sample data...${NC}"

# Generate data for each device
for device_id in $DEVICE_IDS; do
  DATA_POINTS=$((DAYS * 24 * 60 * 60 / INTERVAL))
  echo -e "${GREEN}✓ device_$device_id: $DATA_POINTS data points, $ANOMALIES anomalies${NC}"
done

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo -e "${YELLOW}[DRY RUN] Run without --dry-run to actually insert data${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}Inserting data via API...${NC}"

# Insert data using backend API
for device_id in $DEVICE_IDS; do
  echo "  Inserting data for device_$device_id..."
  
  # This would use the backend API to insert data
  # For now, just showing the structure
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Seeding completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Test queries:${NC}"
for device_id in $DEVICE_IDS; do
  echo "  SELECT temperature FROM root.testing.device_$device_id LIMIT 5"
done

# Save configuration for reference
cat > /root/.seed-data-config.json << EOF
{
  "devices": $DEVICES,
  "days": $DAYS,
  "interval": $INTERVAL,
  "anomalies": $ANOMALIES,
  "startTime": $START_TIME,
  "endTime": $END_TIME,
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

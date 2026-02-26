#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Database Restore Script
# ============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file.sql.gz>${NC}"
    echo -e "${YELLOW}Example: $0 /var/backups/iotdb-enhanced/db_20250226_120000.sql.gz${NC}"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IoTDB Enhanced - Database Restore${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"

# Load environment variables
if [ -f /root/iotdb-enhanced/backend/.env ]; then
    source /root/iotdb-enhanced/backend/.env
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Warning
echo -e "${RED}WARNING: This will replace the current database!${NC}"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo -e "${YELLOW}Starting database restore...${NC}"

if gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"; then
    echo -e "${GREEN}✓ Restore completed successfully${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    exit 1
fi

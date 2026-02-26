#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Database Backup Script
# ============================================================================

set -e

BACKUP_DIR="/var/backups/iotdb-enhanced"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IoTDB Enhanced - Database Backup${NC}"
echo -e "${GREEN}========================================${NC}"

mkdir -p "$BACKUP_DIR"

if [ -f /root/iotdb-enhanced/backend/.env ]; then
    source /root/iotdb-enhanced/backend/.env
else
    echo "Error: .env file not found"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set"
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql.gz"

echo -e "${YELLOW}Starting database backup...${NC}"

if pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup completed${NC} - Size: $SIZE"

    echo -e "${YELLOW}Removing old backups...${NC}"
    find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo -e "${GREEN}✓ Cleanup completed${NC}"

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Backup completed at $(date)${NC}"
    echo -e "${GREEN}========================================${NC}"
else
    echo "Backup failed"
    exit 1
fi

#!/bin/bash

# IoTDB Enhanced - Secure Password Change Script
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IoTDB Enhanced - Secure Password Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Generate strong passwords
IOTDB_NEW_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')
POSTGRES_NEW_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=')

echo -e "${YELLOW}1. Changing PostgreSQL Password...${NC}"

# Change PostgreSQL password
sudo -u postgres psql << EOSQL
ALTER USER iotdb_user WITH PASSWORD '${POSTGRES_NEW_PASSWORD}';
EOSQL

echo -e "${GREEN}✓ PostgreSQL password changed${NC}"

# Update .env file
echo -e "${YELLOW}2. Updating environment variables...${NC}"

ENV_FILE="/root/iotdb-enhanced/backend/.env"
if [ -f "$ENV_FILE" ]; then
    # Backup current .env
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update PostgreSQL password
    sed -i "s/postgresql:\/\/iotdb_user:[^@]*@/postgresql:\/\/iotdb_user:${POSTGRES_NEW_PASSWORD}@/" "$ENV_FILE"
    
    # Update IoTDB password
    sed -i "s/^IOTDB_PASSWORD=.*/IOTDB_PASSWORD=${IOTDB_NEW_PASSWORD}/" "$ENV_FILE"
    
    echo -e "${GREEN}✓ Environment files updated${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Password Change Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Save these passwords securely!${NC}"
echo ""
echo "PostgreSQL Password: ${POSTGRES_NEW_PASSWORD}"
echo "IoTDB Password: ${IOTDB_NEW_PASSWORD}"
echo ""
echo -e "${YELLOW}Backup saved to: ${ENV_FILE}.backup.${date}${NC}"
echo ""

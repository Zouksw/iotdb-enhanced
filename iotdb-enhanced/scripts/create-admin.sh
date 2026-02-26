#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Create Admin User
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}IoTDB Enhanced - Create Admin User${NC}"
echo -e "${GREEN}========================================${NC}"

# API endpoint
API_URL="http://localhost:8000/api/auth"

# Admin credentials
EMAIL="${1:-admin@iotdb-enhanced.com}"
PASSWORD="${2:-Admin123!}"
NAME="${3:-Administrator}"

echo -e "${YELLOW}Creating admin user...${NC}"
echo -e "Email: $EMAIL"
echo -e "Name: $NAME"
echo ""

# Check if user already exists
echo -e "${YELLOW}Checking if user exists...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  echo -e "${GREEN}✓ Admin user already exists${NC}"
  exit 0
fi

echo -e "${YELLOW}User does not exist. Creating new admin user...${NC}"

# Register new admin user
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"$NAME\"}")

if echo "$REGISTER_RESPONSE" | grep -q "token\|id"; then
  echo -e "${GREEN}✓ Admin user created successfully${NC}"
  echo ""
  echo -e "${YELLOW}Admin credentials:${NC}"
  echo -e "  Email: $EMAIL"
  echo -e "  Password: $PASSWORD"
  echo ""
  echo -e "${YELLOW}You can now login at: http://localhost:3000/login${NC}"
else
  echo -e "${RED}✗ Failed to create admin user${NC}"
  echo -e "${YELLOW}Response: $REGISTER_RESPONSE${NC}"
  exit 1
fi

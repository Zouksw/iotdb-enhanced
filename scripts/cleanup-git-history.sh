#!/bin/bash
#
# Git History Cleanup Script
#
# Removes sensitive information from Git history.
# WARNING: This rewrites Git history and requires force push.
#
# Usage: ./scripts/cleanup-git-history.sh [--dry-run]
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
fi

echo -e "${RED}=== Git History Cleanup Script ===${NC}"
echo -e "${RED}⚠️  WARNING: This will rewrite Git history!${NC}"
echo ""

# Confirm
if [ "$DRY_RUN" = false ]; then
  read -p "Are you sure you want to continue? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted"
    exit 0
  fi
fi

# Backup current state
BACKUP_DIR="/root/backups/git-cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /root/.git "$BACKUP_DIR/"
echo -e "${GREEN}✓${NC} Backed up .git to $BACKUP_DIR"

# Create replacement file
cat > /tmp/secrets-to-remove.txt << 'EOF'
IOTDB_PASSWORD=root→IOTDB_PASSWORD=***REMOVED***
JWT_SECRET=1Df1XIs7XJMUmDS4R+zLKESAIi5xvF1fG4lVavTiEDg=→JWT_SECRET=***REMOVED***
SESSION_SECRET=iotdb-enhanced-session-key-2024→SESSION_SECRET=***REMOVED***

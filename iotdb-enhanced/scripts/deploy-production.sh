#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Production Deployment Script
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}IoTDB Enhanced - Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
DOMAIN="${1:-your-domain.com}"
EMAIL="${2:-admin@$DOMAIN}"

echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Email: $EMAIL${NC}"
echo ""

# Step 1: Pre-deployment backup
echo -e "${YELLOW}1. Creating backup...${NC}"
./scripts/backup-db.sh
echo -e "${GREEN}✓ Backup completed${NC}"
echo ""

# Step 2: Update system
echo -e "${YELLOW}2. Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}3. Installing dependencies...${NC}"
sudo apt install -y nginx ufw certbot python3-certbot-nginx
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 4: Configure firewall
echo -e "${YELLOW}4. Configuring firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Step 5: Setup SSL certificate
echo -e "${YELLOW}5. Setting up SSL certificate...${NC}"
echo -e "${YELLOW}Make sure DNS is configured for $DOMAIN${NC}"
read -p "Continue with SSL setup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
    echo -e "${GREEN}✓ SSL certificate installed${NC}"
else
    echo -e "${YELLOW}Skipping SSL setup${NC}"
fi
echo ""

# Step 6: Configure Nginx
echo -e "${YELLOW}6. Configuring Nginx...${NC}"
sudo cp nginx/nginx.conf /etc/nginx/sites-available/iotdb-enhanced
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/iotdb-enhanced
sudo ln -sf /etc/nginx/sites-available/iotdb-enhanced /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
echo -e "${GREEN}✓ Nginx configured${NC}"
echo ""

# Step 7: Set production environment
echo -e "${YELLOW}7. Setting production environment...${NC}"
cd backend
sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
sed -i "s|CORS_ORIGIN=http://localhost:3000|CORS_ORIGIN=https://$DOMAIN|" .env
cd ..
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Step 8: Build and restart services
echo -e "${YELLOW}8. Building and restarting services...${NC}"
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
pm2 restart all
echo -e "${GREEN}✓ Services restarted${NC}"
echo ""

# Step 9: Health check
echo -e "${YELLOW}9. Running health checks...${NC}"
sleep 5
HEALTH=$(curl -s http://localhost:8000/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    exit 1
fi
echo ""

# Step 10: Setup auto-start
echo -e "${YELLOW}10. Setting up PM2 auto-start...${NC}"
pm2 save
pm2 startup | tail -1 > /tmp/pm2_startup_cmd
eval $(cat /tmp/pm2_startup_cmd)
echo -e "${GREEN}✓ PM2 auto-start configured${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Your application is now available at:${NC}"
echo -e "  https://$DOMAIN"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Change default passwords (see docs/SECURITY_SETUP.md)"
echo "  2. Configure automated backups"
echo "  3. Setup monitoring and alerts"
echo ""

#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Install Systemd Services
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installing Systemd Services${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create systemd service for IoTDB
echo -e "${YELLOW}Creating IoTDB services...${NC}"

# ConfigNode service
sudo tee /etc/systemd/system/iotdb-confignode.service > /dev/null << EOF
[Unit]
Description=IoTDB ConfigNode
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin
ExecStart=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/config-node-start.sh
ExecStop=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/config-node-stop.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=iotdb-confignode

[Install]
WantedBy=multi-user.target
EOF

# DataNode service
sudo tee /etc/systemd/system/iotdb-datanode.service > /dev/null << EOF
[Unit]
Description=IoTDB DataNode
After=network.target iotdb-confignode.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin
ExecStart=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/data-node-start.sh
ExecStop=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/data-node-stop.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=iotdb-datanode

[Install]
WantedBy=multi-user.target
EOF

# AI Node service
sudo tee /etc/systemd/system/iotdb-ainode.service > /dev/null << EOF
[Unit]
Description=IoTDB AI Node
After=network.target iotdb-confignode.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin
ExecStart=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/ai-node-start.sh
ExecStop=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/ai-node-stop.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=iotdb-ainode
Environment="IOTDB_HOME=/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin"

[Install]
WantedBy=multi-user.target
EOF

# Enable services
sudo systemctl daemon-reload
sudo systemctl enable iotdb-confignode.service
sudo systemctl enable iotdb-datanode.service
sudo systemctl enable iotdb-ainode.service

echo -e "${GREEN}✓ Systemd services created and enabled${NC}"
echo ""
echo "Available commands:"
echo "  sudo systemctl start|stop|restart|status iotdb-confignode"
echo "  sudo systemctl start|stop|restart|status iotdb-datanode"
echo "  sudo systemctl start|stop|restart|status iotdb-ainode"
echo "  sudo journalctl -u iotdb-confignode -f"
echo ""

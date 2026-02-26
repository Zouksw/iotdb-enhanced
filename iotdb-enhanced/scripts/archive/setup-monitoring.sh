#!/bin/bash

# ============================================================================
# IoTDB Enhanced - Monitoring Setup Script
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setting up Monitoring${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Install Prometheus
echo -e "${YELLOW}1. Installing Prometheus...${NC}"
if ! command -v prometheus &> /dev/null; then
    sudo apt update
    sudo apt install -y prometheus
    sudo systemctl enable prometheus
    sudo systemctl start prometheus
    echo -e "${GREEN}✓ Prometheus installed${NC}"
else
    echo -e "${GREEN}✓ Prometheus already installed${NC}"
fi
echo ""

# Install Grafana
echo -e "${YELLOW}2. Installing Grafana...${NC}"
if ! command -v grafana-server &> /dev/null; then
    wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
    echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
    sudo apt update
    sudo apt install -y grafana
    sudo systemctl enable grafana-server
    sudo systemctl start grafana-server
    echo -e "${GREEN}✓ Grafana installed${NC}"
    echo -e "${YELLOW}Access Grafana at: http://localhost:3001 (admin/admin)${NC}"
else
    echo -e "${GREEN}✓ Grafana already installed${NC}"
fi
echo ""

# Configure Prometheus to scrape IoTDB Enhanced
echo -e "${YELLOW}3. Configuring Prometheus...${NC}"
sudo tee -a /etc/prometheus/prometheus.yml > /dev/null << EOF

# IoTDB Enhanced metrics
  - job_name: 'iotdb-enhanced'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
EOF

sudo systemctl restart prometheus
echo -e "${GREEN}✓ Prometheus configured${NC}"
echo ""

# Create Grafana datasource
echo -e "${YELLOW}4. Grafana datasource configuration...${NC}"
cat > /tmp/grafana-datasource.json << EOF
{
  "name": "Prometheus",
  "type": "prometheus",
  "url": "http://localhost:9090",
  "access": "proxy",
  "isDefault": true
}
EOF

echo -e "${GREEN}✓ Datasource config saved to /tmp/grafana-datasource.json${NC}"
echo -e "${YELLOW}Add it manually in Grafana: Configuration > Data Sources > Import${NC}"
echo ""

# Create alert rules
echo -e "${YELLOW}5. Creating alert rules...${NC}"
mkdir -p /root/iotdb-enhanced/monitoring
cat > /root/iotdb-enhanced/monitoring/alerts.yml << EOF
groups:
  - name: iotdb_enhanced
    interval: 30s
    rules:
      # API availability
      - alert: APIDown
        expr: up{job="iotdb-enhanced"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API is down"
          description: "IoTDB Enhanced API has been down for more than 1 minute"

      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

      # Disk space low
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low"
          description: "Root disk has less than 20% free space"
EOF

echo -e "${GREEN}✓ Alert rules created at /root/iotdb-enhanced/monitoring/alerts.yml${NC}"
echo ""

# Install Node Exporter for system metrics
echo -e "${YELLOW}6. Installing Node Exporter...${NC}"
if ! command -v node_exporter &> /dev/null; then
    wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
    tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
    sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
    rm -rf node_exporter-1.6.1.linux-amd64*

    # Create systemd service
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null << 'ENDEX'
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure

[Install]
WantedBy=multi-user.target
ENDEX

    sudo systemctl daemon-reload
    sudo systemctl enable node_exporter
    sudo systemctl start node_exporter
    rm -f node_exporter-1.6.1.linux-amd64.tar.gz
    echo -e "${GREEN}✓ Node Exporter installed${NC}"
else
    echo -e "${GREEN}✓ Node Exporter already installed${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Monitoring Setup Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Available services:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo "  - Node Exporter: http://localhost:9100/metrics"
echo ""
echo "Next steps:"
echo "  1. Open Grafana and add Prometheus datasource"
echo "  2. Import dashboards from Grafana.com"
echo "  3. Configure alert notifications"
echo ""

#!/bin/bash

# Quick status check for IoTDB Enhanced

echo "=== IoTDB Enhanced Status ==="
echo ""

# PM2 Status
echo "📊 Application Services:"
pm2 list 2>/dev/null | grep -E "iotdb-|online|stopped" | head -5

echo ""
echo "🗄️  Database Services:"
echo "  PostgreSQL: $(pg_isready -h localhost 2>&1 | head -1)"
echo "  Redis:      $(redis-cli ping 2>/dev/null)"

echo ""
echo "⚡ IoTDB Services:"
for service in "ConfigNode:10710" "DataNode:6667" "REST:18080"; do
    name="${service%:*}"
    port="${service#*:}"
    if nc -zv localhost "$port" 2>&1 | grep -q succeeded; then
        echo "  $name: ✅ Running (port $port)"
    else
        echo "  $name: ❌ Stopped (port $port)"
    fi
done

echo ""
echo "💾 Disk Usage:"
df -h / | tail -1 | awk '{echo "  Used: "$3" / "$2" ("$5")"}'

echo ""
echo "📈 Memory:"
free -h | grep Mem | awk '{echo "  Used: "$3" / "$2""}'

#!/bin/bash
# 数据库迁移脚本
# 用法: ./scripts/migrate-db.sh [environment]

set -e

ENV=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "🗄️  开始数据库迁移 (环境: $ENV)..."

# 检查后端目录
if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ 后端目录不存在: $BACKEND_DIR"
  exit 1
fi

cd "$BACKEND_DIR"

# 检查环境变量文件
ENV_FILE=".env.$ENV"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 环境变量文件不存在: .env 或 .env.$ENV"
  echo "请先创建环境配置文件"
  exit 1
fi

echo "📋 使用环境文件: $ENV_FILE"

# 生成数据库备份时间戳
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_DIR/backups/database"
mkdir -p "$BACKUP_DIR"

# 备份数据库（如果已有数据）
echo "💾 备份现有数据库..."
if [ -n "$DATABASE_URL" ]; then
  # 从环境变量提取数据库连接信息
  # 使用pg_dump备份
  BACKUP_FILE="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP.sql"

  # 尝试备份（如果数据库已存在）
  pg_dump $DATABASE_URL > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  数据库可能尚未初始化，跳过备份"

  if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    echo "✅ 备份完成: $BACKUP_FILE"
  fi
fi

# 运行Prisma迁移
echo "🔄 运行数据库迁移..."

# 生成prisma客户端
echo "📦 生成Prisma客户端..."
npx prisma generate

# 推送schema到数据库
echo "⬆️  推送数据库schema..."
npx prisma db push

# 可选：运行种子数据
if [ -f "prisma/seed.ts" ]; then
  echo "🌱 运行种子数据..."
  npx tsx prisma/seed.ts || echo "⚠️  种子数据执行失败或不存在"
fi

# 验证迁移
echo "🔍 验证数据库结构..."
npx prisma migrate status || npx prisma db pull

echo ""
echo "✅ 数据库迁移完成!"
echo ""
echo "数据库状态:"
npx prisma studio --port 5555 &
echo "Prisma Studio 已启动在 http://localhost:5555"
echo "按 Ctrl+C 停止"

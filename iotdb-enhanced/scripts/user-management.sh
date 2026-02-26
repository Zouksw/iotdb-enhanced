#!/bin/bash
# IoTDB Enhanced - User Management Script
# ========================================
# 统一用户管理脚本：创建管理员、修改密码

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 显示使用说明
show_usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create-admin <email> <password>    创建管理员用户"
    echo "  change-password <email> <newpwd>   修改用户密码"
    echo "  list-users                         列出所有用户"
    echo ""
    echo "Examples:"
    echo "  $0 create-admin admin@example.com SecurePass123"
    echo "  $0 change-password admin@example.com NewSecurePass456"
    exit 1
}

# 检查后端目录
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found${NC}"
    exit 1
fi

# 解析命令
COMMAND="${1:-}"
case "$COMMAND" in
    create-admin)
        if [ "$#" -ne 3 ]; then
            echo -e "${RED}Error: create-admin requires email and password${NC}"
            show_usage
        fi

        EMAIL="$2"
        PASSWORD="$3"

        echo -e "${YELLOW}Creating admin user...${NC}"

        cd "$BACKEND_DIR"
        node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('$PASSWORD', 10);

    const user = await prisma.user.upsert({
        where: { email: '$EMAIL' },
        update: {
            password: hashedPassword,
            isAdmin: true,
        },
        create: {
            email: '$EMAIL',
            password: hashedPassword,
            name: 'Administrator',
            isAdmin: true,
        },
    });

    console.log('Admin user created/updated:', user.email);
    await prisma.\$disconnect();
}

createAdmin().catch(console.error);
"

        echo -e "${GREEN}✓ Admin user created: $EMAIL${NC}"
        ;;

    change-password)
        if [ "$#" -ne 3 ]; then
            echo -e "${RED}Error: change-password requires email and new password${NC}"
            show_usage
        fi

        EMAIL="$2"
        NEW_PASSWORD="$3"

        echo -e "${YELLOW}Changing password for: $EMAIL${NC}"

        cd "$BACKEND_DIR"
        node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function changePassword() {
    const user = await prisma.user.findUnique({
        where: { email: '$EMAIL' },
    });

    if (!user) {
        console.error('User not found: $EMAIL');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash('$NEW_PASSWORD', 10);

    await prisma.user.update({
        where: { email: '$EMAIL' },
        data: { password: hashedPassword },
    });

    console.log('Password changed for:', user.email);
    await prisma.\$disconnect();
}

changePassword().catch(console.error);
"

        echo -e "${GREEN}✓ Password changed for: $EMAIL${NC}"
        ;;

    list-users)
        echo -e "${YELLOW}Listing all users...${NC}"

        cd "$BACKEND_DIR"
        node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            isAdmin: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    console.log('\\nUsers:');
    users.forEach((user, i) => {
        console.log(\`\${i + 1}. \${user.email} (\${user.name}) - \${user.isAdmin ? 'Admin' : 'User'}\`);
    });

    await prisma.\$disconnect();
}

listUsers().catch(console.error);
"
        ;;

    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
        show_usage
        ;;
esac

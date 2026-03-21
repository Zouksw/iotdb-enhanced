# 🔐 密钥管理 - 快速参考

## 快速命令

### 启动服务（带加密）
```bash
export IOTDB_ENCRYPTION_KEY="IoTDB_Enhanced_Production_2026"
./scripts/start-with-secrets.sh
```

### 部署新版本
```bash
export IOTDB_ENCRYPTION_KEY="your-key"
./scripts/deploy-with-secrets.sh
```

### 轮换密钥
```bash
./scripts/rotate-and-reencrypt.sh
```

### 手动解密
```bash
gpg --decrypt --batch --passphrase "your-key" \
  backend/.env.gpg > backend/.env
```

### 手动加密
```bash
gpg --symmetric --cipher-algo AES256 --batch --yes \
  --passphrase "your-key" \
  backend/.env --output backend/.env.gpg
```

---

## 环境变量

| 变量 | 用途 | 默认值 | 建议 |
|------|------|--------|------|
| `IOTDB_ENCRYPTION_KEY` | GPG加密/解密 | `IoTDB_Enhanced_Production_2026` | 生产环境使用强密钥 |

---

## 文件位置

| 文件 | 用途 | 权限 |
|------|------|------|
| `/root/backend/.env` | 运行时配置 | 600 |
| `/root/backend/.env.gpg` | 加密配置 | 600 |
| `/root/frontend/.env.local` | 运行时配置 | 600 |
| `/root/frontend/.env.local.gpg` | 加密配置 | 600 |
| `/root/.gnupg/` | GPG密钥环 | 700 |

---

## 检查清单

### 部署前
- [ ] 设置 `IOTDB_ENCRYPTION_KEY`
- [ ] 备份当前 .env
- [ ] 测试解密流程
- [ ] 验证所有变量存在

### 部署后
- [ ] 验证服务健康
- [ ] 检查日志无错误
- [ ] 清理临时文件
- [ ] 保存PM2配置

---

## 故障排除

### 解密失败
```bash
# 检查密钥
echo $IOTDB_ENCRYPTION_KEY

# 测试GPG
gpg --list-keys

# 手动测试
gpg --decrypt --batch --passphrase "$IOTDB_ENCRYPTION_KEY" \
  backend/.env.gpg > /tmp/test.env
```

### 服务无法启动
```bash
# 检查.env文件
ls -lh backend/.env

# 强制重新设置
./scripts/setup-env.sh --force

# 检查PM2
pm2 logs iotdb-backend --lines 50
```

---

## 安全提醒

⚠️ **重要**:
- 永不将 .env 文件提交到Git
- 永不在日志中打印密钥
- 每90天轮换密钥
- 使用不同的生产/开发密钥

✅ **最佳实践**:
- 使用环境变量存储加密密钥
- 定期备份GPG密钥
- 限制对.env文件的访问
- 监控未授权访问尝试

---

**更新**: 2026-03-21
**详细文档**: `/root/SECRETS-MANAGEMENT.md`

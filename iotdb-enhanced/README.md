# IoTDB Enhanced Platform

> 基于 Apache IoTDB 2.0.5 + AI Node 的增强型时序数据库平台

提供完整的时序数据存储、查询和 AI 预测分析功能。

---

## 快速开始

```bash
# 克隆项目
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced

# 启动所有服务
./start.sh

# 查看状态
./status.sh

# 停止服务
./stop.sh
```

---

## 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端应用 | http://localhost:3000 | Web 管理界面 |
| 后端 API | http://localhost:8000 | RESTful API |
| API 文档 | http://localhost:8000/api-docs | Swagger 文档 |
| IoTDB REST | http://localhost:18080 | IoTDB 原生 API |

---

## 核心功能

### AI 分析能力

- **AI 预测** - 时序数据预测分析
- **异常检测** - 智能异常识别
- **模型管理** - AI 模型训练与管理

### 支持的 AI 算法

| 算法 | 说明 |
|------|------|
| `arima` | ARIMA 自回归移动平均 |
| `timer_xl` | LSTM 长短期记忆网络 |
| `sundial` | Transformer 模型 |
| `holtwinters` | Holt-Winters 三次指数平滑 |
| `exponential_smoothing` | 指数平滑 |
| `naive_forecaster` | 朴素预测 |
| `stl_forecaster` | STL 分解预测 |

### 数据管理

- 时序数据管理（IoTDB 集成）
- 数据集管理
- 告警系统（多通道通知）
- API 密钥管理
- 用户认证与授权（JWT）

---

## API 示例

```bash
# AI 预测
curl -X POST http://localhost:8000/api/iotdb/ai/predict \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 5, "algorithm": "arima"}'

# 异常检测
curl -X POST http://localhost:8000/api/iotdb/ai/anomalies \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test2", "threshold": 2.5}'

# 模型列表
curl http://localhost:8000/api/iotdb/ai/models
```

---

## 项目结构

```
iotdb-enhanced/
├── backend/           # Node.js 后端服务
│   ├── src/
│   │   ├── routes/    # API 路由
│   │   ├── services/  # 业务逻辑
│   │   └── schemas/   # 数据验证
│   └── prisma/        # 数据库模型
├── frontend/          # Next.js 前端应用
│   └── src/
│       ├── app/       # 页面组件
│       └── components/ # 可复用组件
├── scripts/           # 管理脚本
├── docs/              # 项目文档
└── nginx/             # Nginx 配置
```

---

## 文档

| 文档 | 说明 |
|------|------|
| [使用指南](docs/GUIDE.md) | 完整使用文档 |
| [部署指南](docs/DEPLOYMENT.md) | 生产环境部署 |
| [迁移指南](docs/MIGRATION_GUIDE.md) | 版本迁移说明 |
| [安全配置](docs/SECURITY_SETUP.md) | 安全加固指南 |

---

## 技术栈

### 后端
- **运行时**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL + Redis
- **时序库**: Apache IoTDB 2.0.5 + AI Node
- **认证**: JWT
- **进程管理**: PM2

### 前端
- **框架**: Next.js 14 + React 19
- **UI 组件**: Ant Design
- **状态管理**: React Context + Hooks
- **样式**: CSS-in-JS

### 基础设施
- **容器**: Docker + Docker Compose
- **反向代理**: Nginx
- **监控**: Prometheus + Grafana（可选）

---

## 管理命令

```bash
./start.sh    # 启动所有服务（IoTDB + Backend + Frontend）
./stop.sh     # 停止所有服务
./status.sh   # 查看服务状态

# 数据库管理
./scripts/backup-db.sh      # 备份数据库
./scripts/restore-db.sh     # 恢复数据库
./scripts/health-check.sh   # 健康检查

# 用户管理
./scripts/user-management.sh create-admin    # 创建管理员
./scripts/user-management.sh change-password # 修改密码

# 部署相关
./scripts/deploy-production.sh  # 生产环境部署
./scripts/test-suite.sh         # 运行测试套件
```

---

## 开发

```bash
# 后端开发
cd backend
npm install
npm run dev

# 前端开发
cd frontend
npm install
npm run dev
```

---

## 许可证

Apache License 2.0

---

## 链接

- **GitHub**: https://github.com/Zouksw/iotdb-enhanced
- **Apache IoTDB**: https://iotdb.apache.org/

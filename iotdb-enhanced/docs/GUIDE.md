# IoTDB Enhanced Platform - 综合指南

## 目录

1. [项目概述](#项目概述)
2. [快速开始](#快速开始)
3. [服务管理](#服务管理)
4. [API 参考](#api-参考)
5. [AI 功能](#ai-功能)
6. [部署指南](#部署指南)

---

## 项目概述

IoTDB Enhanced Platform 是基于 Apache IoTDB 2.0.5 + AI Node 的增强型时序数据库平台，提供完整的时间序列数据存储、查询和 AI 预测分析功能。

### 核心功能

- **时序数据库**: Apache IoTDB 2.0.5
- **AI 集成**: 内置 AI Node，支持 7 种预测算法
- **RESTful API**: 完整的 API 接口
- **Web 界面**: 现代化管理界面

### 支持的 AI 算法

| 算法 | 类型 | 说明 |
|------|------|------|
| `arima` | ML | ARIMA 自回归移动平均 |
| `timer_xl` | DL | LSTM 长短期记忆网络 |
| `sundial` | DL | Transformer 模型 |
| `holtwinters` | ML | Holt-Winters 三次指数平滑 |
| `exponential_smoothing` | ML | 指数平滑 |
| `naive_forecaster` | ML | 朴素预测 |
| `stl_forecaster` | ML | STL 分解预测 |

---

## 快速开始

### 一键启动

```bash
# 启动所有服务
./start.sh

# 查看状态
./status.sh

# 停止所有服务
./stop.sh
```

### 服务端口

| 服务 | 端口 |
|------|------|
| IoTDB ConfigNode | 10710 |
| IoTDB DataNode | 6667 |
| AI Node | 10810 |
| IoTDB REST API | 18080 |
| Backend API | 8000 |
| Frontend | 3000 |

### 访问地址

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **AI 预测**: http://localhost:3000/ai/predict
- **AI 模型**: http://localhost:3000/ai/models
- **AI 异常检测**: http://localhost:3000/ai/anomalies

---

## 服务管理

### 启动脚本 (start.sh)

按顺序启动所有服务，自动检测和等待服务就绪。

### 停止脚本 (stop.sh)

安全停止所有服务，验证端口释放。

### 状态脚本 (status.sh)

查看服务状态、进程信息和健康检查。

### 单独管理 IoTDB

```bash
# 单独启动 IoTDB
./scripts/start-iotdb.sh

# 单独停止 IoTDB
./scripts/stop-iotdb.sh

# 检查 IoTDB 状态
./scripts/check-iotdb.sh
```

---

## API 参考

### IoTDB 基础功能

#### GET /api/iotdb/status
检查服务健康状态。

#### POST /api/iotdb/sql
执行 SQL 查询。

```json
{"sql": "SELECT * FROM root.test1 LIMIT 10"}
```

#### POST /api/iotdb/timeseries
创建时间序列。

```json
{"path": "root.sg1.sensor", "dataType": "DOUBLE", "encoding": "GORILLA"}
```

#### POST /api/iotdb/insert
插入数据。

```json
{
  "records": [
    {"device": "root.sg1.device1", "timestamp": 1708774800000, "measurements": ["sensor1"], "values": [25.5]}
  ]
}
```

### AI 功能 API

#### POST /api/iotdb/ai/predict
时序预测。

```json
{
  "timeseries": "root.test1",
  "horizon": 5,
  "algorithm": "arima"
}
```

响应:
```json
{
  "timestamps": [1708774810000, ...],
  "values": [25.0, 25.5, ...],
  "algorithm": "arima"
}
```

#### POST /api/iotdb/ai/predict/batch
批量预测。

```json
{
  "requests": [
    {"timeseries": "root.test1", "horizon": 3, "algorithm": "arima"},
    {"timeseries": "root.test2", "horizon": 3, "algorithm": "timer_xl"}
  ]
}
```

#### POST /api/iotdb/ai/anomalies
异常检测。

```json
{
  "timeseries": "root.test2",
  "threshold": 2.5
}
```

#### GET /api/iotdb/ai/models
获取可用模型列表。

---

## AI 功能

### 预测算法说明

#### 机器学习模型
- **arima**: 适合短期预测、季节性数据
- **holtwinters**: 适合具有趋势和季节性的数据
- **exponential_smoothing**: 适合短期预测、无趋势数据
- **naive_forecaster**: 基准预测方法
- **stl_forecaster**: 适合复杂季节性模式

#### 深度学习模型
- **timer_xl (LSTM)**: 适合复杂模式、长期依赖 (需要 >= 96 个数据点)
- **sundial (Transformer)**: 适合复杂时间模式 (需要 >= 96 个数据点)

### 数据要求

| 模型类型 | 最小数据点 |
|---------|-----------|
| 机器学习模型 | 10 |
| 深度学习模型 | 96 |

---

## 部署指南

### 系统要求

- **OS**: Linux (推荐 Ubuntu 20.04+)
- **Java**: OpenJDK 17+
- **Python**: 3.10+
- **Node.js**: 18+
- **内存**: 8GB+

### 安装步骤

1. **安装 Java 17**
```bash
sudo apt update
sudo apt install -y openjdk-17-jdk
```

2. **部署 IoTDB**
```bash
# 下载并解压
wget https://downloads.apache.org/iotdb/2.0.5/apache-iotdb-2.0.5-all-bin.zip
unzip apache-iotdb-2.0.5-all-bin.zip -d /opt/iotdb-ainode
```

3. **启动项目**
```bash
cd /root/iotdb-enhanced
./start.sh
```

### 生产环境

#### 使用 PM2 管理进程

```bash
npm install -g pm2

# 启动后端
pm2 start backend/dist/index.js --name iotdb-backend

# 启动前端
pm2 start frontend/node_modules/next/dist/bin/next --name iotdb-frontend start -p 3000

# 设置开机自启
pm2 startup
pm2 save
```

#### Nginx 反向代理

```nginx
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;

    location /api/ {
        proxy_pass http://backend;
    }

    location / {
        proxy_pass http://frontend;
    }
}
```

---

## 故障排查

### 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep -E "(6667|10710|10810|8000|3000)"

# 检查日志
tail -f /tmp/backend.log
tail -f /tmp/frontend.log
```

### AI 预测失败

```bash
# 检查 AI Node 状态
nc -zv localhost 10810

# 检查数据点数量（深度学习模型需要 >= 96 个点）
curl -X POST http://localhost:8000/api/iotdb/sql \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT count(*) FROM root.test1"}'
```

### 模型权重下载

使用 HuggingFace 镜像站：

```python
import os
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

from huggingface_hub import snapshot_download

# Timer-XL
snapshot_download("thuml/timer-base-84m", local_dir="/path/to/timer_xl")

# Sundial
snapshot_download("thuml/sundial-base-128m", local_dir="/path/to/sundial")
```

---

## 测试脚本

```bash
# AI 功能测试
./scripts/test-ai-complete.sh

# 完整功能测试
./scripts/test-all-features.sh
```

---

## 项目结构

```
iotdb-enhanced/
├── start.sh           # 启动所有服务
├── stop.sh            # 停止所有服务
├── status.sh          # 查看服务状态
├── backend/           # 后端服务
├── frontend/          # 前端应用
├── scripts/           # 管理脚本
│   ├── start-iotdb.sh
│   ├── stop-iotdb.sh
│   ├── check-iotdb.sh
│   ├── test-ai-complete.sh
│   └── test-all-features.sh
└── docs/              # 文档
    ├── API.md         # API 详细文档
    └── DEPLOYMENT.md  # 部署详细文档
```

---

## 更新日志

### 2025-02-26
- ✅ 简化项目架构 - 移除复杂功能
  - 删除 MFA 多因素认证系统
  - 删除保存的查询 (Saved Queries) 功能
  - 删除多租户 (Organization) 支持
  - 简化会话管理页面
  - 简化通知系统（移除 webhook 集成）
  - 简化 AI 模型页面（移除模型下载管理）
- ✅ 更新默认后端端口为 8000
- ✅ 配置 PM2 进程管理
- ✅ 更新所有项目文档

### 2024-02-24
- ✅ 完成所有 AI 算法集成
- ✅ 下载深度学习模型权重 (Timer-XL, Sundial)
- ✅ 创建统一管理脚本
- ✅ 精简文档结构

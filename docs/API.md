---
title: "IoTDB Enhanced API 参考"
en_title: "IoTDB Enhanced API Reference"
version: "1.1.0"
last_updated: "2026-03-04"
status: "stable"
maintainer: "IoTDB Enhanced Team"
reviewers:
  - "Backend Developer"
  - "API Designer"
tags:
  - "api"
  - "rest"
  - "reference"
  - "endpoints"
target_audience: "开发者、集成工程师"
related_docs:
  - "使用指南": "GUIDE.md"
  - "部署指南": "DEPLOYMENT.md"
  - "部署后配置": "POST-DEPLOYMENT.md"
  - "文档规范": "DOCUMENTATION_METADATA.md"
changes:
  - version: "1.1.0"
    date: "2026-03-04"
    author: "IoTDB Enhanced Team"
    changes: "更新 - 添加健康检查、监控和缓存管理 API 端点"
  - version: "1.0.0"
    date: "2026-03-03"
    author: "IoTDB Enhanced Team"
    changes: "初始版本 - 整合所有 API 接口文档"
next_review: "2026-06-04"
approval:
  status: "approved"
  reviewed_by: "Backend Developer"
  approved_date: "2026-03-04"
---

# IoTDB Enhanced API 参考

本文档提供了 IoTDB Enhanced 平台的完整 RESTful API 参考文档，包括所有端点、请求/响应格式、错误码和使用示例。

---

## 新增 API (v1.1.0)

### 系统监控与健康检查

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 系统健康检查 |
| `/api/metrics` | GET | 性能指标 |
| `/api/cache/stats` | GET | 缓存统计 |
| `/api/cache/clear` | POST | 清除缓存 |

---

## 目录

1. [API 概述](#api-概述)
2. [认证方式](#认证方式)
3. [核心 API](#核心-api)
   - [认证 API](#认证-api)
   - [时序数据 API](#时序数据-api)
   - [AI 功能 API](#ai-功能-api)
   - [数据集管理 API](#数据集管理-api)
   - [异常检测 API](#异常检测-api)
   - [模型管理 API](#模型管理-api)
   - [告警管理 API](#告警管理-api)
   - [API 密钥管理](#api-密钥管理)
   - [系统监控 API](#系统监控-api) 🆕
4. [数据模型](#数据模型)
5. [错误码说明](#错误码说明)
6. [使用示例](#使用示例)

---

## API 概述

### 基础信息

| 属性 | 值 |
|------|-----|
| Base URL (开发) | `http://localhost:8000` |
| Base URL (生产) | `https://your-domain.com/api` |
| API 版本 | v1 |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 交互式文档

项目提供 Swagger UI 交互式 API 文档：

```
开发环境: http://localhost:8000/api-docs
生产环境: https://your-domain.com/api-docs
```

### API 设计原则

- **RESTful**: 遵循 REST 架构风格
- **资源导向**: URL 表示资源，HTTP 方法表示操作
- **统一响应**: 标准化的响应格式
- **版本控制**: 通过 URL 路径进行版本控制
- **幂等性**: GET、PUT、DELETE 操作保证幂等

---

## 认证方式

### JWT Bearer Token 认证

API 使用 JSON Web Token (JWT) 进行身份认证。

#### 获取 Token

```bash
# 登录获取 token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

响应示例:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

#### 使用 Token

在请求头中包含 Bearer Token:

```bash
curl -X GET http://localhost:8000/api/iotdb/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Token 刷新

```bash
# 使用 refresh token 获取新 token
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### API 密钥认证

某些端点支持 API 密钥认证，适用于服务间调用。

```bash
curl -X GET http://localhost:8000/api/iotdb/status \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 核心 API

### 认证 API

#### POST /api/auth/register

注册新用户。

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "User Name"
}
```

**响应**: `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    }
  }
}
```

#### POST /api/auth/login

用户登录。

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin"
    }
  }
}
```

#### POST /api/auth/refresh

刷新访问令牌。

**请求体**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

#### POST /api/auth/logout

用户登出。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "message": "登出成功"
}
```

#### GET /api/auth/me

获取当前用户信息。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 时序数据 API

#### GET /api/iotdb/status

检查 IoTDB 服务状态。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "2.0.5",
    "uptime": 3600
  }
}
```

#### POST /api/iotdb/sql

执行 IoTDB SQL 查询。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "sql": "SELECT * FROM root.test1 LIMIT 10"
}
```

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "columns": ["time", "root.test1.sensor1"],
    "values": [
      [1708774800000, 25.5],
      [1708774810000, 26.1]
    ]
  }
}
```

#### POST /api/iotdb/timeseries

创建时间序列。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "path": "root.sg1.device1.sensor",
  "dataType": "DOUBLE",
  "encoding": "GORILLA",
  "compression": "SNAPPY"
}
```

**响应**: `201 Created`

```json
{
  "success": true,
  "message": "时间序列创建成功"
}
```

#### POST /api/iotdb/insert

插入时序数据。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "records": [
    {
      "device": "root.sg1.device1",
      "timestamp": 1708774800000,
      "measurements": ["sensor1", "sensor2"],
      "values": [25.5, 30.2]
    }
  ]
}
```

**响应**: `201 Created`

```json
{
  "success": true,
  "data": {
    "inserted": 1
  }
}
```

#### GET /api/iotdb/timeseries

查询时间序列列表。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 否 | 路径前缀过滤 |

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "timeseries": [
      {
        "name": "root.sg1.device1.sensor",
        "dataType": "DOUBLE",
        "encoding": "GORILLA"
      }
    ]
  }
}
```

---

### AI 功能 API

#### POST /api/iotdb/ai/predict

时序数据预测。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "timeseries": "root.test1",
  "horizon": 5,
  "algorithm": "arima"
}
```

参数说明:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeseries | string | 是 | 时间序列名称 |
| horizon | number | 是 | 预测步数 |
| algorithm | string | 是 | 预测算法 |

支持的算法: `arima`, `timer_xl`, `sundial`, `holtwinters`, `exponential_smoothing`, `naive_forecaster`, `stl_forecaster`

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "timestamps": [1708774810000, 1708774820000, 1708774830000],
    "values": [25.0, 25.5, 26.1],
    "algorithm": "arima",
    "metrics": {
      "mse": 0.25,
      "mae": 0.4
    }
  }
}
```

#### POST /api/iotdb/ai/predict/batch

批量预测多个时间序列。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "requests": [
    {"timeseries": "root.test1", "horizon": 3, "algorithm": "arima"},
    {"timeseries": "root.test2", "horizon": 3, "algorithm": "timer_xl"}
  ]
}
```

**响应**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "timeseries": "root.test1",
      "timestamps": [...],
      "values": [...]
    },
    {
      "timeseries": "root.test2",
      "timestamps": [...],
      "values": [...]
    }
  ]
}
```

#### POST /api/iotdb/ai/anomalies

异常检测。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "timeseries": "root.test2",
  "threshold": 2.5
}
```

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "timestamp": 1708774800000,
        "value": 35.2,
        "score": 3.2,
        "isAnomaly": true
      }
    ],
    "statistics": {
      "total": 100,
      "anomalyCount": 5,
      "anomalyRate": 0.05
    }
  }
}
```

#### GET /api/iotdb/ai/models

获取可用模型列表。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "arima",
        "type": "ml",
        "description": "ARIMA 自回归移动平均",
        "minDataPoints": 10
      },
      {
        "name": "timer_xl",
        "type": "dl",
        "description": "LSTM 长短期记忆网络",
        "minDataPoints": 96
      }
    ]
  }
}
```

---

### 数据集管理 API

#### GET /api/datasets

获取数据集列表。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 10 |

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "datasets": [
      {
        "id": 1,
        "name": "传感器数据集",
        "timeseries": "root.test1",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
}
```

#### POST /api/datasets

创建数据集。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "name": "传感器数据集",
  "description": "测试数据集",
  "timeseries": "root.test1"
}
```

**响应**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "传感器数据集",
    "description": "测试数据集",
    "timeseries": "root.test1",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/datasets/:id

获取数据集详情。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "传感器数据集",
    "description": "测试数据集",
    "timeseries": "root.test1",
    "dataPoints": 1000,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### DELETE /api/datasets/:id

删除数据集。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "message": "数据集删除成功"
}
```

---

### 异常检测 API

#### GET /api/anomalies

获取异常记录列表。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeseries | string | 否 | 时间序列过滤 |
| startDate | string | 否 | 开始日期 (ISO 8601) |
| endDate | string | 否 | 结束日期 (ISO 8601) |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "id": 1,
        "timeseries": "root.test1",
        "timestamp": 1708774800000,
        "value": 35.2,
        "score": 3.2,
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50
    }
  }
}
```

---

### 模型管理 API

#### GET /api/models

获取 AI 模型列表。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": 1,
        "name": "预测模型 v1",
        "algorithm": "arima",
        "timeseries": "root.test1",
        "status": "trained",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### POST /api/models

训练新模型。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "name": "预测模型 v1",
  "algorithm": "arima",
  "timeseries": "root.test1",
  "parameters": {
    "p": 1,
    "d": 1,
    "q": 1
  }
}
```

**响应**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "预测模型 v1",
    "algorithm": "arima",
    "status": "training",
    "progress": 0
  }
}
```

---

### 告警管理 API

#### GET /api/alerts

获取告警列表。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态过滤: active, resolved |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 1,
        "ruleId": 1,
        "message": "检测到异常值",
        "severity": "high",
        "status": "active",
        "triggeredAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25
    }
  }
}
```

#### POST /api/alerts/rules

创建告警规则。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "name": "高温告警",
  "timeseries": "root.test1",
  "condition": "value > 30",
  "severity": "high",
  "channels": ["email", "webhook"]
}
```

**响应**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "高温告警",
    "condition": "value > 30",
    "severity": "high",
    "enabled": true
  }
}
```

---

### API 密钥管理

#### GET /api/apikeys

获取 API 密钥列表。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "id": 1,
        "name": "生产环境密钥",
        "key": "ak_live_xxxxx",
        "lastUsed": "2026-01-01T00:00:00.000Z",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### POST /api/apikeys

创建 API 密钥。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**请求体**:

```json
{
  "name": "生产环境密钥"
}
```

**响应**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "生产环境密钥",
    "key": "ak_live_xxxxx...",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### DELETE /api/apikeys/:id

删除 API 密钥。

**请求头**: `Authorization: Bearer YOUR_TOKEN`

**响应**: `200 OK`

```json
{
  "success": true,
  "message": "API 密钥删除成功"
}
```

---

### 系统监控 API 🆕

#### GET /api/health

系统健康检查端点，返回所有服务的健康状态。

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-04T10:30:00Z",
    "services": {
      "database": "ok",
      "redis": "ok",
      "iotdb": "ok",
      "uptime": 86400
    }
  }
}
```

#### GET /api/metrics

获取性能指标和统计数据。

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "requestCount": 15234,
    "averageResponseTime": 45,
    "p50ResponseTime": 32,
    "p95ResponseTime": 120,
    "p99ResponseTime": 250,
    "errorRate": 0.12,
    "memoryUsage": 65.5,
    "cpuUsage": 35.2,
    "cache": {
      "hits": 12500,
      "misses": 2734,
      "hitRate": 0.82
    }
  }
}
```

#### GET /api/cache/stats

获取缓存统计信息。

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "hits": 12500,
    "misses": 2734,
    "hitRate": 0.82,
    "total": 15234
  }
}
```

#### POST /api/cache/clear

清除缓存。支持按模式清除或全部清除。

**请求体**:

```json
{
  "pattern": "timeseries:*"
}
```

**响应**: `200 OK`

```json
{
  "success": true,
  "data": {
    "cleared": 125
  }
}
```

---

## 数据模型

### 通用响应格式

成功响应:

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误响应:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## 错误码说明

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| `UNAUTHORIZED` | 401 | 未认证或认证失败 |
| `FORBIDDEN` | 403 | 无权限访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `DUPLICATE_RESOURCE` | 409 | 资源已存在 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INVALID_TOKEN` | 401 | Token 无效或过期 |
| `INSUFFICIENT_DATA` | 400 | 数据点不足 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "field": "timeseries",
      "issue": "必填字段"
    }
  }
}
```

---

## 使用示例

### cURL 示例

#### 完整的认证和查询流程

```bash
# 1. 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.data.token')

# 2. 使用 token 访问 API
curl -X GET http://localhost:8000/api/iotdb/status \
  -H "Authorization: Bearer $TOKEN"

# 3. 执行 SQL 查询
curl -X POST http://localhost:8000/api/iotdb/sql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM root.test1 LIMIT 10"}'

# 4. AI 预测
curl -X POST http://localhost:8000/api/iotdb/ai/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test1", "horizon": 5, "algorithm": "arima"}'
```

### JavaScript 示例

```javascript
// 使用 Fetch API
async function queryIoTDB(sql) {
  const response = await fetch('http://localhost:8000/api/iotdb/sql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  return response.json();
}

// 使用 Async/Await
async function predictTimeseries(timeseries, horizon, algorithm) {
  const response = await fetch('http://localhost:8000/api/iotdb/ai/predict', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ timeseries, horizon, algorithm })
  });
  return response.json();
}
```

### Python 示例

```python
import requests

# 配置
BASE_URL = 'http://localhost:8000/api'
TOKEN = 'your_token_here'

# 设置认证头
headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# 执行 SQL 查询
def query_iotdb(sql):
    response = requests.post(
        f'{BASE_URL}/iotdb/sql',
        headers=headers,
        json={'sql': sql}
    )
    return response.json()

# AI 预测
def predict_timeseries(timeseries, horizon, algorithm):
    response = requests.post(
        f'{BASE_URL}/iotdb/ai/predict',
        headers=headers,
        json={
            'timeseries': timeseries,
            'horizon': horizon,
            'algorithm': algorithm
        }
    )
    return response.json()
```

---

## 附录

### 支持的 AI 算法

| 算法 | 类型 | 最小数据点 | 说明 |
|------|------|-----------|------|
| `arima` | ML | 10 | ARIMA 自回归移动平均 |
| `timer_xl` | DL | 96 | LSTM 长短期记忆网络 |
| `sundial` | DL | 96 | Transformer 模型 |
| `holtwinters` | ML | 10 | Holt-Winters 三次指数平滑 |
| `exponential_smoothing` | ML | 10 | 指数平滑 |
| `naive_forecaster` | ML | 10 | 朴素预测 |
| `stl_forecaster` | ML | 10 | STL 分解预测 |

### 数据类型

| 数据类型 | 编码方式 | 说明 |
|---------|---------|------|
| BOOLEAN | PLAIN | 布尔值 |
| INT32 | RLE | 32 位整数 |
| INT64 | RLE | 64 位整数 |
| FLOAT | GORILLA | 单精度浮点 |
| DOUBLE | GORILLA | 双精度浮点 |
| TEXT | DICTIONARY | 文本字符串 |

### 相关资源

- [Swagger UI](http://localhost:8000/api-docs) - 交互式 API 文档
- [IoTDB 文档](https://iotdb.apache.org/docs/UserGuide/latest/) - IoTDB 官方文档
- [Postman 集合](./postman-collection.json) - API 测试集合

---

**文档版本**: 1.0.0
**最后更新**: 2026-03-03
**下次审查**: 2026-06-03

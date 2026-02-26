# IoTDB Enhanced Platform

基于 Apache IoTDB 2.0.5 + AI Node 的增强型时序数据库平台，提供完整的时序数据存储、查询和 AI 预测分析功能。

## 快速开始

```bash
# 克隆项目
git clone https://github.com/your-org/iotdb-enhanced.git
cd iotdb-enhanced

# 启动所有服务
./start.sh

# 查看状态
./status.sh
```

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| 后端 API | http://localhost:8000 |
| API 文档 | http://localhost:8000/api-docs |
| IoTDB REST API | http://localhost:18080 |

## AI 功能页面

- **AI 预测**: http://localhost:3000/ai/predict
- **AI 模型**: http://localhost:3000/ai/models
- **AI 异常检测**: http://localhost:3000/ai/anomalies

## 支持 AI 算法

- `arima` - ARIMA 自回归移动平均
- `timer_xl` - LSTM 长短期记忆网络
- `sundial` - Transformer 模型
- `holtwinters` - Holt-Winters 三次指数平滑
- `exponential_smoothing` - 指数平滑
- `naive_forecaster` - 朴素预测
- `stl_forecaster` - STL 分解预测

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

## 管理命令

```bash
./start.sh    # 启动所有服务
./status.sh    # 查看服务状态
./stop.sh     # 停止所有服务
```

## 文档

- [综合指南](docs/GUIDE.md) - 完整使用文档
- [API 参考](docs/API.md) - API 详细接口
- [部署指南](docs/DEPLOYMENT.md) - 生产部署说明

## 技术栈

- **IoTDB**: Apache IoTDB 2.0.5 + AI Node
- **后端**: Node.js + Express + TypeScript
- **前端**: Next.js + React + Ant Design
- **AI**: sktime + PyTorch + Transformers

## 许可证

Apache License 2.0

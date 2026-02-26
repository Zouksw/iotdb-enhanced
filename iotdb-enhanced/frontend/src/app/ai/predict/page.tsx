"use client";

import { useState } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Row,
  Col,
  Descriptions,
  Alert,
  Spin,
  Tag,
  Divider,
  Timeline,
} from "antd";
import {
  ThunderboltOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentCard } from "@/components/layout/ContentCard";
import GlassCard from "@/components/ui/GlassCard";

interface PredictionRequest {
  timeseries: string;
  model: string;
  horizon?: number;
  startTime?: number;
}

interface PredictionResult {
  predicted: Array<{ timestamp: number; value: number }>;
  model: string;
  method: string;
  ainode?: boolean;
  statistics?: {
    count: number;
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  metadata?: {
    executionTime: number;
    datapoints: number;
    modelVersion: string;
  };
}

export default function AIPredictPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const models = [
    { id: "arima", name: "ARIMA", type: "Classic", description: "Auto-Regressive Integrated Moving Average" },
    { id: "fft", name: "FFT", type: "Spectral", description: "Fast Fourier Transform" },
    { id: "mlp", name: "Neural Network", type: "Deep Learning", description: "Multi-Layer Perceptron" },
  ];

  const handlePredict = async (values: PredictionRequest) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/iotdb/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeseries: values.timeseries,
          model: values.model,
          horizon: values.horizon || 10,
          startTime: values.startTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Prediction failed");
      }

      const data = await response.json();
      setResult(data);
      message.success(`Prediction completed! Generated ${data.predicted.length} data points.`);
    } catch (error: any) {
      message.error(`Prediction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  const formatValue = (val: number) => {
    return val.toFixed(4);
  };

  return (
    <PageContainer>
      <PageHeader
        title="AI Prediction"
        description="Generate single-time predictions using AI models"
        actions={
          <Button
            icon={<ExperimentOutlined />}
            onClick={() => {
              window.location.href = "/ai/models";
            }}
          >
            View Models
          </Button>
        }
      />

      <Row gutter={[24, 24]}>
        {/* Left Column - Prediction Form */}
        <Col xs={24} lg={10}>
          <ContentCard
            title="Configuration"
            subtitle={<span style={{ fontSize: 13 }}>Set prediction parameters</span>}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePredict}
              initialValues={{
                timeseries: "root.test2",
                model: "arima",
                horizon: 10,
              }}
            >
              <Form.Item
                label="Time Series Path"
                name="timeseries"
                rules={[{ required: true, message: "Please enter time series path" }]}
                tooltip="The path of the time series to predict"
              >
                <Input
                  placeholder="e.g., root.test2"
                  prefix={<LineChartOutlined style={{ color: "#bfbfbf" }} />}
                />
              </Form.Item>

              <Form.Item
                label="AI Model"
                name="model"
                rules={[{ required: true, message: "Please select a model" }]}
                tooltip="Choose the AI model for prediction"
              >
                <Select>
                  {models.map((model) => (
                    <Select.Option key={model.id} value={model.id}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{model.name}</div>
                        <div style={{ fontSize: 12, color: "#999" }}>
                          {model.type} - {model.description}
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Prediction Horizon"
                name="horizon"
                rules={[{ required: true, message: "Please enter horizon" }]}
                tooltip="Number of data points to predict ahead"
              >
                <InputNumber
                  min={1}
                  max={1000}
                  step={1}
                  style={{ width: "100%" }}
                  placeholder="e.g., 10"
                />
              </Form.Item>

              <Form.Item
                label="Start Time (Optional)"
                name="startTime"
                tooltip="Timestamp to start prediction from (defaults to last data point)"
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="Unix timestamp in milliseconds"
                />
              </Form.Item>

              <Divider style={{ margin: "16px 0" }} />

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  icon={<RocketOutlined />}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    height: "48px",
                  }}
                >
                  Generate Prediction
                </Button>
              </Form.Item>
            </Form>
          </ContentCard>

          {/* Model Info Card */}
          <GlassCard
            intensity="light"
            gradientBorder
            gradient="blue"
            style={{ marginTop: 24, padding: "20px" }}
          >
            <div style={{ marginBottom: 16 }}>
              <ThunderboltOutlined style={{ marginRight: 8, color: "#667eea" }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>About AI Prediction</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: "1.6" }}>
              <p style={{ margin: "0 0 8px 0" }}>
                AI prediction uses machine learning models to forecast future values based on
                historical time series data.
              </p>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Supported models:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>
                  <strong>ARIMA:</strong> Classic statistical method for time series forecasting
                </li>
                <li>
                  <strong>FFT:</strong> Spectral analysis for periodic patterns
                </li>
                <li>
                  <strong>Neural Network:</strong> Deep learning approach for complex patterns
                </li>
              </ul>
            </div>
          </GlassCard>
        </Col>

        {/* Right Column - Results */}
        <Col xs={24} lg={14}>
          {loading && (
            <ContentCard style={{ textAlign: "center", padding: "60px 20px" }}>
              <Spin size="large" tip="Generating predictions..." />
              <div style={{ marginTop: 16, color: "#999", fontSize: 13 }}>
                This may take a few moments depending on the data size and model complexity.
              </div>
            </ContentCard>
          )}

          {result && (
            <>
              {/* Success Alert */}
              <Alert
                message="Prediction Completed Successfully"
                description={`Generated ${result.predicted.length} data points using ${result.model} model`}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginBottom: 24 }}
              />

              {/* Metadata Card */}
              {result.metadata && (
                <GlassCard
                  intensity="medium"
                  gradientBorder
                  gradient="success"
                  style={{ marginBottom: 24, padding: "20px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                        Execution Time
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        {result.metadata.executionTime}ms
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                        Data Points
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        {result.metadata.datapoints}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                        Model Version
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {result.metadata.modelVersion}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Statistics */}
              {result.statistics && (
                <ContentCard
                  title="Prediction Statistics"
                  subtitle={<span style={{ fontSize: 13 }}>Statistical analysis of predictions</span>}
                  style={{ marginBottom: 24 }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Count</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{result.statistics.count}</div>
                      </div>
                    </Col>
                    <Col xs={12} sm={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Min</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>
                          {formatValue(result.statistics.min)}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} sm={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Max</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>
                          {formatValue(result.statistics.max)}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12} sm={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Mean</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#8b5cf6" }}>
                          {formatValue(result.statistics.mean)}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </ContentCard>
              )}

              {/* Prediction Results */}
              <ContentCard
                title="Predicted Values"
                subtitle={
                  <span style={{ fontSize: 13 }}>
                    <Tag color="blue" icon={<ClockCircleOutlined />}>
                      {result.predicted.length} points
                    </Tag>
                  </span>
                }
              >
                <div style={{ maxHeight: 500, overflowY: "auto" }}>
                  <Timeline
                    mode="left"
                    items={result.predicted.map((point, index) => ({
                      color: index < 3 ? "green" : index === 3 ? "blue" : "gray",
                      dot: index === 0 ? <ThunderboltOutlined style={{ fontSize: 16 }} /> : undefined,
                      children: (
                        <div
                          style={{
                            paddingBottom: 12,
                            fontSize: 13,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontWeight: 500, color: "#1e293b" }}>
                              Point {index + 1}
                            </span>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 16,
                                color:
                                  index < 3
                                    ? "#10b981"
                                    : index === 3
                                    ? "#3b82f6"
                                    : "#64748b",
                              }}
                            >
                              {formatValue(point.value)}
                            </span>
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: 12 }}>
                            {formatTimestamp(point.timestamp)}
                          </div>
                        </div>
                      ),
                    }))}
                  />
                </div>
              </ContentCard>

              {/* Model Information */}
              <ContentCard
                title="Model Information"
                style={{ marginTop: 24 }}
              >
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Model" span={2}>
                    <Tag color="purple" icon={<ExperimentOutlined />}>
                      {result.model.toUpperCase()}
                    </Tag>
                    {result.ainode && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        AI Node
                      </Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Method" span={2}>
                    {result.method}
                  </Descriptions.Item>
                  <Descriptions.Item label="First Prediction" span={2}>
                    {result.predicted.length > 0
                      ? formatTimestamp(result.predicted[0].timestamp)
                      : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Prediction" span={2}>
                    {result.predicted.length > 0
                      ? formatTimestamp(result.predicted[result.predicted.length - 1].timestamp)
                      : "-"}
                  </Descriptions.Item>
                </Descriptions>
              </ContentCard>

              {/* Action Buttons */}
              <Card style={{ marginTop: 24, borderRadius: 12 }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<LineChartOutlined />}
                  onClick={() => {
                    // Navigate to create forecast with these predictions
                    window.location.href = "/forecasts/create";
                  }}
                >
                  Save as Forecast
                </Button>
              </Card>
            </>
          )}

          {!loading && !result && (
            <ContentCard style={{ textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <RocketOutlined style={{ fontSize: 32, color: "#9ca3af" }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Ready to Predict
              </div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                Configure your prediction parameters and click "Generate Prediction" to start.
              </div>
            </ContentCard>
          )}
        </Col>
      </Row>
    </PageContainer>
  );
}

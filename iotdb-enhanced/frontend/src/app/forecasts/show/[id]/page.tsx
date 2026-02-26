"use client";

import {
  Show,
  DateField,
  EditButton,
  DeleteButton,
} from "@refinedev/antd";
import { useShow, useGo } from "@refinedev/core";
import { Typography, Space, Row, Col, Card, Tag, Statistic, Button, Descriptions } from "antd";
import {
  LineChartOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentCard } from "@/components/layout/ContentCard";

const { Text } = Typography;

export default function ForecastShow() {
  const { result: showResult } = useShow({});
  const forecast = showResult?.data;
  const go = useGo();

  if (!forecast) {
    return (
      <PageContainer>
        <ContentCard>
          <Text>Loading...</Text>
        </ContentCard>
      </PageContainer>
    );
  }

  const getDecimalValue = (value: any) => {
    if (typeof value === "object" && value !== null) {
      return value.toNumber?.() || Number(value);
    }
    return Number(value || 0);
  };

  const predictedValue = getDecimalValue(forecast.predictedValue);
  const confidence = getDecimalValue(forecast.confidence);
  const anomalyProbability = getDecimalValue(forecast.anomalyProbability);
  const lowerBound = forecast.lowerBound ? getDecimalValue(forecast.lowerBound) : null;
  const upperBound = forecast.upperBound ? getDecimalValue(forecast.upperBound) : null;
  const unit = forecast.timeseries?.unit || "";

  const algorithmColors: Record<string, string> = {
    ARIMA: "blue",
    PROPHET: "purple",
    LSTM: "green",
    TRANSFORMER: "orange",
    ENSEMBLE: "red",
  };

  const algorithmIcons: Record<string, string> = {
    ARIMA: "📈",
    PROPHET: "🔮",
    LSTM: "🧠",
    TRANSFORMER: "⚡",
    ENSEMBLE: "🎯",
  };

  return (
    <PageContainer>
      <Show
        title={
          <Space>
            <LineChartOutlined />
            <span>Forecast Details</span>
          </Space>
        }
        headerButtons={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => go({ to: "/forecasts", type: "push" })}
            >
              Back to List
            </Button>
            <EditButton recordItemId={forecast.id} />
            <DeleteButton recordItemId={forecast.id} />
          </Space>
        }
      >
        {/* Main Statistics Card */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[24, 24]}>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Predicted Value"
                value={predictedValue}
                precision={2}
                suffix={unit}
                valueStyle={{ color: "#1890ff" }}
                prefix={<LineChartOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Confidence"
                value={confidence * 100}
                precision={1}
                suffix="%"
                valueStyle={{ color: confidence >= 0.9 ? "#52c41a" : confidence >= 0.7 ? "#1890ff" : "#faad14" }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic
                title="Anomaly Probability"
                value={anomalyProbability * 100}
                precision={1}
                suffix="%"
                valueStyle={{
                  color: forecast.isAnomaly ? "#ff4d4f" : anomalyProbability > 0.5 ? "#faad14" : "#52c41a"
                }}
              />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Space direction="vertical" size={4}>
                <Text type="secondary">Status</Text>
                {forecast.isAnomaly ? (
                  <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 14, padding: "4px 12px" }}>
                    Anomaly
                  </Tag>
                ) : (
                  <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14, padding: "4px 12px" }}>
                    Normal
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>

          {/* Prediction Range */}
          {lowerBound !== null && upperBound !== null && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
              <Text type="secondary" style={{ marginBottom: 8, display: "block" }}>
                Prediction Range (Confidence Interval)
              </Text>
              <Space size="large">
                <Space>
                  <Text type="secondary">Lower:</Text>
                  <Text code style={{ fontSize: 16 }}>
                    {lowerBound.toFixed(2)} {unit}
                  </Text>
                </Space>
                <Text type="secondary">→</Text>
                <Space>
                  <Text type="secondary">Upper:</Text>
                  <Text code style={{ fontSize: 16 }}>
                    {upperBound.toFixed(2)} {unit}
                  </Text>
                </Space>
                <Space>
                  <Text type="secondary">Range:</Text>
                  <Text strong style={{ fontSize: 16 }}>
                    ±{((upperBound - lowerBound) / 2).toFixed(2)} {unit}
                  </Text>
                </Space>
              </Space>
            </div>
          )}
        </Card>

        {/* Model Information */}
        <ContentCard
          title="Model Information"
          subtitle="Details about the AI model that generated this forecast"
          style={{ marginBottom: 16 }}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
            <Descriptions.Item label={<Space><RobotOutlined />Algorithm</Space>}>
              {forecast.model?.algorithm ? (
                <Tag color={algorithmColors[forecast.model.algorithm] || "default"}>
                  {algorithmIcons[forecast.model.algorithm] || ""} {forecast.model.algorithm}
                </Tag>
              ) : "-"}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><LineChartOutlined />Time Series</Space>}>
              {forecast.timeseries?.name || "-"}
              {forecast.timeseries?.unit && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {forecast.timeseries.unit}
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><ClockCircleOutlined />Model ID</Space>}>
              <Text code>{forecast.modelId?.slice(0, 8)}...</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Model Active">
              {forecast.model?.isActive !== undefined ? (
                forecast.model.isActive ? (
                  <Tag color="success">Active</Tag>
                ) : (
                  <Tag color="default">Inactive</Tag>
                )
              ) : "-"}
            </Descriptions.Item>
            {forecast.model?.trainingMetrics?.mae && (
              <Descriptions.Item label="Training MAE">
                <Text code>{forecast.model.trainingMetrics.mae.toFixed(4)}</Text>
              </Descriptions.Item>
            )}
            {forecast.model?.trainingMetrics?.rmse && (
              <Descriptions.Item label="Training RMSE">
                <Text code>{forecast.model.trainingMetrics.rmse.toFixed(4)}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </ContentCard>

        {/* Forecast Details */}
        <ContentCard
          title="Forecast Values"
          subtitle="The predicted values and confidence intervals"
          style={{ marginBottom: 16 }}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
            <Descriptions.Item label={<Space><LineChartOutlined />Predicted Value</Space>}>
              <Text strong style={{ fontSize: 16 }}>
                {predictedValue.toFixed(6)} {unit}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Lower Bound">
              {lowerBound !== null ? (
                <Text code style={{ fontSize: 14 }}>
                  {lowerBound.toFixed(6)} {unit}
                </Text>
              ) : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Upper Bound">
              {upperBound !== null ? (
                <Text code style={{ fontSize: 14 }}>
                  {upperBound.toFixed(6)} {unit}
                </Text>
              ) : "-"}
            </Descriptions.Item>
            <Descriptions.Item label={<Space><CheckCircleOutlined />Confidence Level</Space>}>
              <Tag color={confidence >= 0.9 ? "green" : confidence >= 0.7 ? "blue" : "orange"}>
                {(confidence * 100).toFixed(1)}%
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<Space><CloseCircleOutlined />Anomaly Probability</Space>}>
              <Tag color={forecast.isAnomaly ? "error" : anomalyProbability > 0.5 ? "warning" : "success"}>
                {(anomalyProbability * 100).toFixed(1)}%
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Anomaly Flag">
              {forecast.isAnomaly ? (
                <Tag color="error" icon={<CloseCircleOutlined />}>
                  Detected as Anomaly
                </Tag>
              ) : (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Normal
                </Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </ContentCard>

        {/* Timestamp Information */}
        <ContentCard
          title="Timestamp Information"
          subtitle="Forecast and creation timestamps"
          style={{ marginBottom: 16 }}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
            <Descriptions.Item label={<Space><ClockCircleOutlined />Forecast Timestamp</Space>}>
              <DateField
                value={forecast.timestamp}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Descriptions.Item>
            <Descriptions.Item label={<Space><ClockCircleOutlined />Created At</Space>}>
              <DateField
                value={forecast.createdAt}
                format="YYYY-MM-DD HH:mm:ss"
              />
            </Descriptions.Item>
            <Descriptions.Item label="Forecast ID" span={2}>
              <Text code copyable>{forecast.id}</Text>
            </Descriptions.Item>
          </Descriptions>
        </ContentCard>

        {/* Actions */}
        <Card>
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => go({ to: `/forecasts/edit/${forecast.id}`, type: "push" })}
            >
              Edit Forecast
            </Button>
            <Button
              icon={<LineChartOutlined />}
              onClick={() => go({ to: `/models/show/${forecast.modelId}`, type: "push" })}
            >
              View Model
            </Button>
            <Button
              icon={<LineChartOutlined />}
              onClick={() => go({ to: `/timeseries/show/${forecast.timeseriesId}`, type: "push" })}
            >
              View Time Series
            </Button>
          </Space>
        </Card>
      </Show>
    </PageContainer>
  );
}

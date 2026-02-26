"use client";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Switch, Row, Col, Typography, Space, Card, Alert, Tag, Statistic } from "antd";
import {
  LineChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import { ContentCard } from "@/components/layout/ContentCard";

const { Text } = Typography;

export default function ForecastEdit() {
  const { formProps, saveButtonProps } = useForm();

  // Get initial values from form
  const forecast = formProps.initialValues;

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      title="Edit Forecast"
    >
      {forecast && (
        <>
          {/* Forecast Summary Card */}
          <Card
            title={
              <Space>
                <LineChartOutlined />
                <span>Forecast Summary</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Predicted Value"
                  value={
                    typeof forecast.predictedValue === "object"
                      ? forecast.predictedValue.toNumber?.() || Number(forecast.predictedValue)
                      : Number(forecast.predictedValue)
                  }
                  precision={2}
                  suffix={forecast.timeseries?.unit || ""}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Confidence"
                  value={
                    typeof forecast.confidence === "object"
                      ? forecast.confidence.toNumber?.() || Number(forecast.confidence)
                      : Number(forecast.confidence)
                  }
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="Anomaly Probability"
                  value={
                    typeof forecast.anomalyProbability === "object"
                      ? forecast.anomalyProbability.toNumber?.() || Number(forecast.anomalyProbability)
                      : Number(forecast.anomalyProbability || 0)
                  }
                  precision={2}
                  suffix="%"
                  valueStyle={{
                    color: forecast.isAnomaly ? "#ff4d4f" : "#52c41a"
                  }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Status</Text>
                  {forecast.isAnomaly ? (
                    <Tag icon={<CloseCircleOutlined />} color="error">
                      Anomaly
                    </Tag>
                  ) : (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      Normal
                    </Tag>
                  )}
                </Space>
              </Col>
            </Row>

            {/* Prediction Range */}
            {forecast.lowerBound && forecast.upperBound && (
              <>
                <div style={{ marginTop: 24 }}>
                  <Text type="secondary">Prediction Range (Confidence Interval)</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      <Text strong style={{ fontSize: 18 }}>
                        [
                        {typeof forecast.lowerBound === "object"
                          ? forecast.lowerBound.toNumber?.().toFixed(2) || Number(forecast.lowerBound).toFixed(2)
                          : Number(forecast.lowerBound).toFixed(2)}
                        ,
                        {" "}
                        {typeof forecast.upperBound === "object"
                          ? forecast.upperBound.toNumber?.().toFixed(2) || Number(forecast.upperBound).toFixed(2)
                          : Number(forecast.upperBound).toFixed(2)}
                        ]
                      </Text>
                      <Text type="secondary">{forecast.timeseries?.unit || ""}</Text>
                    </Space>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Model Information */}
          <ContentCard
            title="Model Information"
            subtitle="The AI model that generated this forecast"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Algorithm</Text>
                  <Text strong>{forecast.model?.algorithm || "-"}</Text>
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Time Series</Text>
                  <Text strong>{forecast.timeseries?.name || "-"}</Text>
                </Space>
              </Col>
            </Row>
          </ContentCard>

          {/* Edit Form */}
          <ContentCard
            title="Anomaly Settings"
            subtitle="Manually adjust anomaly detection settings"
          >
            <Alert
              message="About Anomaly Detection"
              description={
                <span>
                  Forecasts can be marked as anomalies if they fall outside expected patterns.
                  You can manually override this flag based on your domain knowledge.
                </span>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form {...formProps} layout="vertical">
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span style={{ fontWeight: 500 }}>Mark as Anomaly</span>}
                    name="isAnomaly"
                    valuePropName="checked"
                    tooltip="Flag this forecast as anomalous"
                  >
                    <Switch
                      checkedChildren="Anomaly"
                      unCheckedChildren="Normal"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Forecast Timestamp</span>}
                name="timestamp"
              >
                <div>
                  {new Date(forecast.timestamp).toLocaleString()}
                </div>
              </Form.Item>

              <Form.Item
                label={<span style={{ fontWeight: 500 }}>Created At</span>}
                name="createdAt"
              >
                <div>
                  {new Date(forecast.createdAt).toLocaleString()}
                </div>
              </Form.Item>
            </Form>
          </ContentCard>

          {/* Read-only Values Display */}
          <ContentCard
            title="Forecast Values (Read-only)"
            subtitle="These values are generated by the model and cannot be edited"
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Predicted Value</Text>
                  <Text code style={{ fontSize: 14 }}>
                    {typeof forecast.predictedValue === "object"
                      ? forecast.predictedValue.toNumber?.().toFixed(6) || Number(forecast.predictedValue).toFixed(6)
                      : Number(forecast.predictedValue).toFixed(6)}
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Lower Bound</Text>
                  <Text code style={{ fontSize: 14 }}>
                    {forecast.lowerBound
                      ? typeof forecast.lowerBound === "object"
                        ? forecast.lowerBound.toNumber?.().toFixed(6) || Number(forecast.lowerBound).toFixed(6)
                        : Number(forecast.lowerBound).toFixed(6)
                      : "-"}
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Upper Bound</Text>
                  <Text code style={{ fontSize: 14 }}>
                    {forecast.upperBound
                      ? typeof forecast.upperBound === "object"
                        ? forecast.upperBound.toNumber?.().toFixed(6) || Number(forecast.upperBound).toFixed(6)
                        : Number(forecast.upperBound).toFixed(6)
                      : "-"}
                  </Text>
                </Space>
              </Col>
            </Row>

            <Alert
              message="Model-generated values cannot be modified"
              description="The forecast values, bounds, and confidence levels are generated by the AI model and are read-only. To generate new forecasts, use the model's prediction function."
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </ContentCard>
        </>
      )}
    </Edit>
  );
}

"use client";

import { Row, Col, Typography, Tag, Card, Descriptions, Button, Space, Alert, Divider } from "antd";
import { ArrowLeftOutlined, AlertOutlined, ExclamationCircleOutlined, WarningOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { useOne } from "@refinedev/core";
import { DateField } from "@refinedev/antd";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentCard } from "@/components/layout/ContentCard";

const { Text, Paragraph, Title } = Typography;

interface AnomalyShowPageProps {
  params: { id: string };
}

const SEVERITY_CONFIG = {
  LOW: {
    color: "green",
    icon: <ExclamationCircleOutlined />,
    label: "Low",
    description: "Minor deviation from expected values",
  },
  MEDIUM: {
    color: "orange",
    icon: <WarningOutlined />,
    label: "Medium",
    description: "Notable anomaly worth investigating",
  },
  HIGH: {
    color: "red",
    icon: <AlertOutlined />,
    label: "High",
    description: "Significant deviation requiring attention",
  },
  CRITICAL: {
    color: "purple",
    icon: <CloseCircleOutlined />,
    label: "Critical",
    description: "Extreme deviation, immediate action needed",
  },
};

export default function AnomalyShowPage({ params }: AnomalyShowPageProps) {
  const go = useGo();

  const anomalyResult = useOne({
    resource: "anomalies",
    id: params.id,
  });

  const anomaly = anomalyResult?.result?.data;
  const isLoading = anomalyResult?.query?.isLoading ?? false;

  if (isLoading) {
    return (
      <PageContainer>
        <ContentCard>
          <Alert message="Loading anomaly details..." type="info" />
        </ContentCard>
      </PageContainer>
    );
  }

  if (!anomaly) {
    return (
      <PageContainer>
        <ContentCard>
          <Alert message="Anomaly not found" type="error" />
        </ContentCard>
      </PageContainer>
    );
  }

  const severityConfig = SEVERITY_CONFIG[anomaly.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.MEDIUM;

  return (
    <PageContainer>
      <PageHeader
        title="Anomaly Details"
        description="View detailed information about this detected anomaly"
        actions={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => go({ to: "/anomalies", type: "push" })}
          >
            Back to Anomalies
          </Button>
        }
      />

      {/* Severity Alert */}
      <Alert
        message={`${severityConfig.label} Severity Anomaly`}
        description={severityConfig.description}
        type={severityConfig.color === "green" ? "success" : severityConfig.color === "orange" ? "warning" : "error"}
        showIcon
        icon={severityConfig.icon}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        {/* Main Details */}
        <Col xs={24} lg={16}>
          <ContentCard title="Anomaly Information" subtitle="Details about the detected anomaly">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle">
              <Descriptions.Item label="Anomaly ID" span={2}>
                <Text code>{anomaly.id}</Text>
              </Descriptions.Item>

              <Descriptions.Item label="Severity">
                <Tag
                  color={severityConfig.color}
                  icon={severityConfig.icon}
                  style={{ fontSize: 13, padding: "4px 12px" }}
                >
                  {anomaly.severity}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Detection Method">
                <Tag>{anomaly.detectionMethod || "N/A"}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Time Series" span={2}>
                <Space>
                  <Text strong>{anomaly.timeseries?.name || "N/A"}</Text>
                  {anomaly.timeseries?.unit && (
                    <Text type="secondary">({anomaly.timeseries.unit})</Text>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Anomalous Value">
                <Text style={{ fontSize: 16, fontWeight: 600, fontFamily: "monospace" }}>
                  {anomaly.value?.toFixed(4) || "N/A"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Expected Range">
                <Text style={{ fontFamily: "monospace" }}>
                  [{anomaly.minExpected?.toFixed(2) || "N/A"}, {anomaly.maxExpected?.toFixed(2) || "N/A"}]
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Deviation">
                {anomaly.minExpected && anomaly.maxExpected ? (
                  <Text type={
                    anomaly.value < (anomaly.minExpected + anomaly.maxExpected) / 2 ? "success" : "danger"
                  }>
                    {anomaly.value < anomaly.minExpected
                      ? `Below min by ${Math.abs(anomaly.value - anomaly.minExpected).toFixed(2)}`
                      : anomaly.value > anomaly.maxExpected
                      ? `Above max by ${(anomaly.value - anomaly.maxExpected).toFixed(2)}`
                      : "Within range"}
                  </Text>
                ) : (
                  "N/A"
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Detected At">
                <DateField value={anomaly.detectedAt} format="YYYY-MM-DD HH:mm:ss" />
              </Descriptions.Item>
            </Descriptions>

            {anomaly.notes && (
              <>
                <Divider style={{ margin: "24px 0" }} />
                <div>
                  <Text strong>Notes:</Text>
                  <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                    {anomaly.notes}
                  </Paragraph>
                </div>
              </>
            )}
          </ContentCard>
        </Col>

        {/* Side Panel */}
        <Col xs={24} lg={8}>
          {/* Statistics Card */}
          <Card
            title="Anomaly Statistics"
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Score</Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: severityConfig.color }}>
                  {anomaly.anomalyScore?.toFixed(3) || "N/A"}
                </div>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Confidence</Text>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {anomaly.confidence ? `${(anomaly.confidence * 100).toFixed(1)}%` : "N/A"}
                </div>
              </div>
            </Space>
          </Card>

          {/* Time Series Info */}
          {anomaly.timeseries && (
            <Card
              title="Time Series Info"
              size="small"
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">
                  {anomaly.timeseries.name}
                </Descriptions.Item>
                <Descriptions.Item label="Dataset">
                  {anomaly.timeseries.dataset?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Unit">
                  {anomaly.timeseries.unit || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Metadata Card */}
          <Card
            title="Metadata"
            size="small"
            style={{ marginTop: 16 }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Created At">
                <DateField value={anomaly.createdAt} format="YYYY-MM-DD HH:mm" />
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                <DateField value={anomaly.updatedAt} format="YYYY-MM-DD HH:mm" />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}

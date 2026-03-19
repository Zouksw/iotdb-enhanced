/**
 * Anomaly Detail Page
 *
 * Displays detailed information about a specific anomaly including:
 * - Anomaly metadata (severity, status, detection method)
 * - Context and related time series
 * - Visualization of the anomalous data point
 * - Resolution actions
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Space,
  Typography,
  Descriptions,
  Alert,
  Timeline,
  Card,
  Steps,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { Anomaly } from "@/types/api";
import { authFetch } from "@/utils/auth";
import { DetailPageLayout, DetailSection } from "@/components/layout/DetailPageLayout";
import { useIsMobile } from "@/lib/responsive-utils";

const { Title, Text, Paragraph } = Typography;

interface AnomalyDetailParams {
  id?: string;
}

interface AnomalyWithDetails extends Omit<Anomaly, 'timeseries'> {
  timeseries?: {
    id: string;
    name: string;
    path: string;
  };
  detectedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  detectionMethod?: string;
  threshold?: number;
  actualValue?: number;
  normalRange?: {
    min: number;
    max: number;
  };
}

export default function AnomalyDetailPage() {
  const params = useParams() as AnomalyDetailParams;
  const router = useRouter();
  const [anomaly, setAnomaly] = useState<AnomalyWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchAnomaly();
  }, [params.id]);

  const fetchAnomaly = async () => {
    if (!params.id) {
      setError("Anomaly ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(`/api/anomalies/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch anomaly");
      }
      const data = await response.json();
      setAnomaly(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    // TODO: Implement resolve functionality
    setAnomaly({
      ...anomaly!,
      isResolved: true,
      resolvedAt: new Date().toISOString()
    } as AnomalyWithDetails);
  };

  const handleDismiss = async () => {
    // TODO: Implement dismiss functionality
    router.push("/anomalies");
  };

  if (loading) {
    return (
      <DetailPageLayout
        title="Anomaly Details"
        loading={loading}
      />
    );
  }

  if (error || !anomaly) {
    return (
      <DetailPageLayout
        title="Anomaly"
        error={error || "Anomaly not found"}
      />
    );
  }

  const breadcrumb = [
    { label: "Anomalies", href: "/anomalies" },
    { label: `Anomaly #${anomaly.id.substring(0, 8)}` }
  ];

  const severityColors: Record<string, string> = {
    low: "green",
    medium: "orange",
    high: "red"
  };

  const severityIcons: Record<string, React.ReactNode> = {
    low: <ExclamationCircleOutlined />,
    medium: <WarningOutlined />,
    high: <WarningOutlined />
  };

  const actions = [
    ...(anomaly.isResolved !== true ? [{
      icon: <CheckCircleOutlined />,
      label: "Resolve",
      onClick: handleResolve
    }] : []),
    {
      icon: <CloseCircleOutlined />,
      label: "Dismiss",
      onClick: handleDismiss
    }
  ];

  return (
    <DetailPageLayout
      title={`Anomaly #${anomaly.id.substring(0, 8)}`}
      subtitle={`Detected ${anomaly.detectedAt ? new Date(anomaly.detectedAt).toLocaleString() : "Recently"}`}
      breadcrumb={breadcrumb}
      actions={actions}
    >
      {/* Severity and Status Card */}
      <DetailSection title="Anomaly Status" colSpan={isMobile ? 24 : 8}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Severity">
            <Tag
              color={severityColors[anomaly.severity]}
              icon={severityIcons[anomaly.severity]}
            >
              {anomaly.severity.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={anomaly.isResolved === true ? "success" : "processing"}>
              {anomaly.isResolved ? "RESOLVED" : "OPEN"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Detection Method">
            {anomaly.detectionMethod || "statistical"}
          </Descriptions.Item>
        </Descriptions>

        {anomaly.isResolved === true && anomaly.resolvedAt && (
          <Alert
            message={`Resolved by ${anomaly.resolvedBy || "Admin"}`}
            description={anomaly.resolutionNote || "No resolution note provided"}
            type="success"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}
      </DetailSection>

      {/* Context Card */}
      <DetailSection title="Anomaly Context" colSpan={isMobile ? 24 : 16}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {anomaly.timeseries && (
            <Card size="small" title="Time Series">
              <Space>
                <LineChartOutlined />
                <Text strong>{anomaly.timeseries.name}</Text>
                <Text type="secondary">({anomaly.timeseries.path})</Text>
              </Space>
            </Card>
          )}

          {anomaly.actualValue !== undefined && (
            <Card size="small" title="Detected Value">
              <Statistic
                value={anomaly.actualValue}
                precision={4}
                valueStyle={{
                  color: anomaly.severity === "high" ? "#ef4444" : "#f59e0b"
                }}
                suffix={
                  anomaly.threshold ? `/ ${anomaly.threshold}` : ""
                }
              />
            </Card>
          )}

          {anomaly.normalRange && (
            <Card size="small" title="Normal Range">
              <Space>
                <Text>Min: {anomaly.normalRange.min.toFixed(4)}</Text>
                <Text>Max: {anomaly.normalRange.max.toFixed(4)}</Text>
              </Space>
            </Card>
          )}
        </Space>
      </DetailSection>

      {/* Visualization */}
      <DetailSection title="Data Visualization" colSpan={24}>
        <Alert
          message="Chart showing the anomaly in context"
          description="The anomalous data point will be highlighted on the chart"
          type="info"
          showIcon
          style={{ marginBottom: "16px" }}
        />
        <div style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(239, 68, 68, 0.05)",
          borderRadius: "8px",
          border: "1px dashed rgba(239, 68, 68, 0.3)"
        }}>
          <WarningOutlined style={{ fontSize: "48px", color: "#ef4444", marginRight: "16px" }} />
          <div>
            <Text strong>Anomaly Visualization</Text>
            <br />
            <Text type="secondary">Chart will display the anomalous data point</Text>
          </div>
        </div>
      </DetailSection>

      {/* Timeline */}
      <DetailSection title="Event Timeline" colSpan={24}>
        <Timeline
          items={[
            {
              color: "red",
              dot: <ExclamationCircleOutlined />,
              children: (
                <div>
                  <Text strong>Anomaly Detected</Text>
                  <br />
                  <Text type="secondary">
                    {anomaly.detectedAt
                      ? new Date(anomaly.detectedAt).toLocaleString()
                      : "Recently"}
                  </Text>
                </div>
              )
            },
            ...(anomaly.isResolved === true ? [{
              color: "green",
              dot: <CheckCircleOutlined />,
              children: (
                <div>
                  <Text strong>Anomaly Resolved</Text>
                  <br />
                  <Text type="secondary">
                    {anomaly.resolvedAt
                      ? new Date(anomaly.resolvedAt).toLocaleString()
                      : "Recently"}
                  </Text>
                  {anomaly.resolutionNote && (
                    <>
                      <br />
                      <Text type="secondary">{anomaly.resolutionNote}</Text>
                    </>
                  )}
                </div>
              )
            }] : [])
          ]}
        />
      </DetailSection>

      {/* Actions */}
      <DetailSection title="Quick Actions" colSpan={24}>
        <Space wrap>
          {anomaly.timeseries && (
            <Button
              icon={<LineChartOutlined />}
              onClick={() => anomaly.timeseries && router.push(`/timeseries?path=${anomaly.timeseries.path}`)}
            >
              View Time Series
            </Button>
          )}
          <Button
            icon={<ClockCircleOutlined />}
            onClick={() => router.push("/anomalies")}
          >
            View Related Anomalies
          </Button>
        </Space>
      </DetailSection>
    </DetailPageLayout>
  );
}

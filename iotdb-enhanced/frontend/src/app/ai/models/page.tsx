"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, message, Card, Row, Col, Descriptions, Typography, Alert } from "antd";
import {
  ThunderboltOutlined,
  RocketOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  LineChartOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import GlassCard from "@/components/ui/GlassCard";
import { useIsMobile } from "@/lib/responsive-utils";

const { Title } = Typography;

// Check if AI features are disabled
const AI_DISABLED = process.env.NEXT_PUBLIC_AI_DISABLED === 'true';

interface AIModel {
  id: string;
  name: string;
  type: string;
  description: string;
  ainode: boolean;
  useCase?: string;
}

export default function AIModelsPage() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    setPermissionError(null);
    try {
      const response = await fetch("/api/iotdb/ai/models");
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403 || response.status === 503) {
          setPermissionError(error.error || "AI features are restricted to administrators");
        }
        throw new Error(error.error || "Failed to fetch models");
      }
      const data = await response.json();
      setModels(data.models || []);
    } catch (error: any) {
      if (!permissionError) {
        message.error(`Failed to load models: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Model ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      responsive: ["lg"],
      render: (id: string) => (
        <code style={{ fontSize: 12, padding: "2px 6px", background: "#f5f5f5", borderRadius: 4 }}>
          {id}
        </code>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name: string, record: AIModel) => (
        <span style={{ fontWeight: 500 }}>
          {name}
          {record.ainode && (
            <Tag color="blue" icon={<ThunderboltOutlined />} style={{ marginLeft: 8 }}>
              Built-in
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      responsive: ["sm", "md", "lg", "xl"],
      render: (type: string) => {
        const color = type === "prediction" ? "green" : "blue";
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Action",
      key: "action",
      width: isMobile ? 80 : 120,
      fixed: "right" as const,
      render: (_: any, record: AIModel) => (
        <Button
          type="primary"
          icon={<RocketOutlined />}
          onClick={() => window.location.href = "/forecasts/create"}
        >
          {!isMobile && "Use Model"}
        </Button>
      ),
    },
  ];

  const totalModels = models.length;

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "AI & Anomaly Detection", href: "/ai" },
    { title: "AI Models" },
  ];

  return (
    <PageContainer>
      {/* AI Feature Disabled Warning */}
      {AI_DISABLED && (
        <Alert
          message="AI Features Temporarily Disabled"
          description="AI features including model training and prediction have been temporarily disabled for security reasons. Contact your administrator for more information."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: isMobile ? 16 : 24 }}
          closable
        />
      )}

      {/* Permission Error Alert */}
      {permissionError && (
        <Alert
          message="AI Feature Access Restricted"
          description={
            permissionError.includes("disabled")
              ? "AI features are currently disabled. Please contact your administrator to enable them."
              : "AI model management is only available to administrators. If you are an administrator, please ensure you are logged in with your admin account."
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: isMobile ? 16 : 24 }}
          closable
          onClose={() => setPermissionError(null)}
        />
      )}

      <PageHeader
        title="AI Models"
        description="Built-in AI models for forecasting and prediction"
        breadcrumbs={breadcrumbItems}
        actions={
          <Button
            type="primary"
            onClick={fetchModels}
            loading={loading}
            disabled={AI_DISABLED}
            icon={<ReloadOutlined />}
          >
            {!isMobile && "Refresh"}
          </Button>
        }
      />

      {/* Statistics Card */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} sm={12}>
          <GlassCard intensity="medium" gradientBorder gradient="purple" style={{ padding: isMobile ? "16px" : "20px" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <ExperimentOutlined style={{ fontSize: "20px", color: "#fff" }} />
              </div>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
                Available Models
              </span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>
              {totalModels}
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Built-in AI models
            </span>
          </GlassCard>
        </Col>
      </Row>

      {/* Models Table */}
      <DataTable
        columns={columns}
        dataSource={models}
        rowKey="id"
        loading={loading}
        enableZebraStriping={true}
        stickyHeader={true}
        scroll={{ x: isMobile ? "max-content" : undefined }}
        pagination={false}
      />

      {/* Info Card */}
      <Card
        title="About AI Models"
        style={{ marginTop: isMobile ? 16 : 24 }}
      >
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={24} md={8}>
            <LineChartOutlined style={{ fontSize: 24, color: "#0066cc", marginBottom: 8 }} />
            <Title level={5}>Time Series Forecasting</Title>
            <p style={{ color: "#64748b" }}>
              Use built-in ARIMA, FFT, or Neural Network models to generate predictions for your time series data.
            </p>
          </Col>
          <Col xs={24} md={8}>
            <ExperimentOutlined style={{ fontSize: 24, color: "#722ed1", marginBottom: 8 }} />
            <Title level={5}>Anomaly Detection</Title>
            <p style={{ color: "#64748b" }}>
              Detect anomalies in your data using statistical and machine learning methods.
            </p>
          </Col>
          <Col xs={24} md={8}>
            <ThunderboltOutlined style={{ fontSize: 24, color: "#f59e0b", marginBottom: 8 }} />
            <Title level={5}>IoTDB AI Node</Title>
            <p style={{ color: "#64748b" }}>
              Models run directly on IoTDB server for optimal performance.
            </p>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
}

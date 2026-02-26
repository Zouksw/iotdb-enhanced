"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, message, Card, Row, Col, Descriptions, Typography } from "antd";
import {
  ThunderboltOutlined,
  RocketOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  LineChartOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import GlassCard from "@/components/ui/GlassCard";

const { Title } = Typography;

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

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/iotdb/ai/models");
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      const data = await response.json();
      setModels(data.models || []);
    } catch (error: any) {
      message.error(`Failed to load models: ${error.message}`);
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
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: AIModel) => (
        <Button
          type="primary"
          icon={<RocketOutlined />}
          onClick={() => window.location.href = "/forecasts/create"}
        >
          Use Model
        </Button>
      ),
    },
  ];

  const totalModels = models.length;

  return (
    <PageContainer>
      <PageHeader
        title="AI Models"
        description="Built-in AI models for forecasting and prediction"
        actions={
          <Button
            type="primary"
            onClick={fetchModels}
            loading={loading}
            icon={<ReloadOutlined />}
          >
            Refresh
          </Button>
        }
      />

      {/* Statistics Card */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <GlassCard intensity="medium" gradientBorder gradient="purple" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
        pagination={false}
      />

      {/* Info Card */}
      <Card
        title="About AI Models"
        style={{ marginTop: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <LineChartOutlined style={{ fontSize: 24, color: "#667eea", marginBottom: 8 }} />
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

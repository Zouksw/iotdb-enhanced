"use client";

import {
  DateField,
  DeleteButton,
  List,
  ShowButton,
  useTable,
  CreateButton,
} from "@refinedev/antd";
import { Space, Table, Tag, Badge, Row, Col, Typography, Button } from "antd";
import { useList } from "@refinedev/core";
import {
  LineChartOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/tables/DataTable";
import GlassCard from "@/components/ui/GlassCard";

const { Text } = Typography;

export default function ForecastList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "timestamp", order: "desc" }],
    },
  });

  // Get statistics
  const forecastStatsResult = useList({
    resource: "forecasts",
    pagination: { pageSize: 1000 },
  });

  const forecastStats = forecastStatsResult?.result?.data ?? [];
  const totalForecasts = forecastStats?.length ?? 0;

  // Calculate unique models and timeseries
  const uniqueModels = new Set(forecastStats.map((f: any) => f.modelId)).size;
  const uniqueTimeseries = new Set(forecastStats.map((f: any) => f.timeseriesId)).size;

  // Calculate anomalies
  const anomalyCount = forecastStats?.filter((f: any) => f.isAnomaly).length ?? 0;

  // Define table columns
  const columns = [
    {
      dataIndex: "id",
      title: "ID",
      width: 100,
      fixed: "left" as const,
      render: (id: string) => (
        <Text code style={{ fontSize: 12 }}>
          {id.slice(0, 8)}...
        </Text>
      ),
    },
    {
      dataIndex: "timestamp",
      title: "Forecast Time",
      width: 160,
      sorter: true,
      render: (value: string) => (
        <Space direction="vertical" size={0}>
          <DateField value={value} format="YYYY-MM-DD HH:mm" />
        </Space>
      ),
    },
    {
      dataIndex: "timeseries",
      title: "Time Series",
      width: 180,
      ellipsis: true,
      render: (ts: any) => (
        <Space>
          <Text strong>{ts?.name || "-"}</Text>
        </Space>
      ),
    },
    {
      dataIndex: "model",
      title: "Model",
      width: 140,
      render: (model: any) => {
        const algo = model?.algorithm;
        const colors: Record<string, string> = {
          ARIMA: "blue",
          PROPHET: "purple",
          LSTM: "green",
          TRANSFORMER: "orange",
          ENSEMBLE: "red",
        };
        return algo ? (
          <Tag color={colors[algo] || "default"}>{algo}</Tag>
        ) : "-";
      },
    },
    {
      dataIndex: "predictedValue",
      title: "Predicted Value",
      width: 140,
      align: "right" as const,
      render: (value: any, record: any) => {
        const numValue = typeof value === "object" ? value.toNumber?.() : Number(value);
        const unit = record.timeseries?.unit || "";
        return (
          <Text style={{ fontFamily: "monospace", fontSize: 13 }}>
            {numValue.toFixed(2)} {unit}
          </Text>
        );
      },
    },
    {
      dataIndex: "confidence",
      title: "Confidence",
      width: 110,
      align: "center" as const,
      render: (value: any) => {
        const numValue = typeof value === "object" ? value.toNumber?.() : Number(value);
        const percentage = (numValue * 100).toFixed(0);
        const color = numValue >= 0.9 ? "green" : numValue >= 0.7 ? "blue" : "orange";
        return <Tag color={color}>{percentage}%</Tag>;
      },
    },
    {
      dataIndex: "lowerBound",
      title: "Range",
      width: 160,
      align: "right" as const,
      render: (_: any, record: any) => {
        const lower = typeof record.lowerBound === "object"
          ? record.lowerBound.toNumber?.()
          : Number(record.lowerBound);
        const upper = typeof record.upperBound === "object"
          ? record.upperBound.toNumber?.()
          : Number(record.upperBound);
        const unit = record.timeseries?.unit || "";

        if (!lower || !upper) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Text style={{ fontFamily: "monospace", fontSize: 12 }}>
            [{lower.toFixed(2)}, {upper.toFixed(2)}] {unit}
          </Text>
        );
      },
    },
    {
      dataIndex: "isAnomaly",
      title: "Anomaly",
      width: 100,
      align: "center" as const,
      render: (isAnomaly: boolean, record: any) => {
        const probability = typeof record.anomalyProbability === "object"
          ? record.anomalyProbability.toNumber?.()
          : Number(record.anomalyProbability);

        if (isAnomaly) {
          return (
            <Space direction="vertical" size={0}>
              <Badge status="error" text="Yes" />
              {probability > 0 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {(probability * 100).toFixed(0)}%
                </Text>
              )}
            </Space>
          );
        }
        return <Badge status="success" text="No" />;
      },
    },
    {
      dataIndex: "createdAt",
      title: "Created At",
      width: 140,
      sorter: true,
      render: (value: string) => <DateField value={value} format="YYYY-MM-DD" />,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <ShowButton hideText size="small" recordItemId={record.id} />
          <DeleteButton hideText size="small" recordItemId={record.id} confirmTitle="Delete this forecast?" />
        </Space>
      ),
    },
  ];

  // Handle export to CSV
  const handleExport = () => {
    // Get current data from table
    const dataSource = tableProps.dataSource || [];

    if (dataSource.length === 0) {
      return;
    }

    // Define CSV headers
    const headers = [
      "ID",
      "Forecast Time",
      "Time Series",
      "Algorithm",
      "Predicted Value",
      "Unit",
      "Confidence",
      "Lower Bound",
      "Upper Bound",
      "Is Anomaly",
      "Anomaly Probability",
      "Created At",
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(","),
      ...dataSource.map((record: any) => {
        const timeseriesName = record.timeseries?.name || "-";
        const algorithm = record.model?.algorithm || "-";
        const predictedValue = typeof record.predictedValue === "object"
          ? record.predictedValue.toNumber?.()
          : Number(record.predictedValue);
        const unit = record.timeseries?.unit || "";
        const confidence = typeof record.confidence === "object"
          ? record.confidence.toNumber?.()
          : Number(record.confidence);
        const lowerBound = typeof record.lowerBound === "object"
          ? record.lowerBound.toNumber?.()
          : Number(record.lowerBound);
        const upperBound = typeof record.upperBound === "object"
          ? record.upperBound.toNumber?.()
          : Number(record.upperBound);
        const anomalyProbability = typeof record.anomalyProbability === "object"
          ? record.anomalyProbability.toNumber?.()
          : Number(record.anomalyProbability);

        return [
          record.id,
          record.timestamp || "",
          `"${timeseriesName}"`,
          algorithm,
          predictedValue?.toFixed(4) || "",
          `"${unit}"`,
          confidence?.toFixed(4) || "",
          lowerBound?.toFixed(4) || "",
          upperBound?.toFixed(4) || "",
          record.isAnomaly ? "Yes" : "No",
          anomalyProbability?.toFixed(4) || "",
          record.createdAt || "",
        ].join(",");
      }),
    ];

    // Create blob and download
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `forecasts_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer>
      <List>
        <PageHeader
          title="Forecasts"
          description="AI-powered time series forecasting and predictions"
          actions={
            <Space>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                Export
              </Button>
              <CreateButton
                icon={<PlusOutlined />}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  height: "40px",
                  borderRadius: "10px",
                  fontWeight: 600,
                }}
              >
                Generate Forecast
              </CreateButton>
            </Space>
          }
        />

        {/* Statistics Cards with Glassmorphism */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <GlassCard intensity="medium" gradientBorder gradient="purple" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <LineChartOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Total Forecasts
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {totalForecasts}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                AI predictions generated
              </Text>
            </GlassCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <GlassCard intensity="medium" gradientBorder gradient="blue" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Active Models
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {uniqueModels}
              </div>
              <Text type="success" style={{ fontSize: "12px" }}>
                AI algorithms
              </Text>
            </GlassCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <GlassCard intensity="medium" gradientBorder gradient="sunset" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Time Series
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {uniqueTimeseries}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Being forecasted
              </Text>
            </GlassCard>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <GlassCard intensity="medium" gradientBorder gradient="purple" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <LineChartOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Anomalies Detected
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {anomalyCount}
              </div>
              <Text type={anomalyCount > 0 ? "warning" : "success"} style={{ fontSize: "12px" }}>
                {anomalyCount > 0 ? "Need attention" : "All normal"}
              </Text>
            </GlassCard>
          </Col>
        </Row>

        {/* Data Table */}
        <DataTable
          {...tableProps}
          rowKey="id"
          columns={columns}
          enableZebraStriping={true}
          stickyHeader={true}
        />
      </List>
    </PageContainer>
  );
}

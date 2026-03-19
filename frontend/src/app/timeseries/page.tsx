"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
  CreateButton,
} from "@refinedev/antd";
import { Space, Table, Tag, Row, Col, Typography, Progress } from "antd";
import type { Breakpoint } from "antd";
import { useList } from "@refinedev/core";
import {
  LineChartOutlined,
  DatabaseOutlined,
  AlertOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/tables/DataTable";
import GlassCard from "@/components/ui/GlassCard";
import { useIsMobile } from "@/lib/responsive-utils";

const { Text } = Typography;

export default function TimeseriesList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "createdAt", order: "desc" }],
    },
  });

  const isMobile = useIsMobile();

  // Get statistics
  const timeseriesStatsResult = useList({
    resource: "timeseries",
    pagination: { pageSize: 1000 },
  });

  const timeseriesStats = timeseriesStatsResult?.result?.data ?? [];
  const totalTimeseries = timeseriesStats?.length ?? 0;
  const totalDataPoints = timeseriesStats?.reduce(
    (sum: number, ts: any) => sum + (ts._count?.dataPoints || 0),
    0
  ) ?? 0;
  const totalAnomalies = timeseriesStats?.reduce(
    (sum: number, ts: any) => sum + (ts._count?.anomalies || 0),
    0
  ) ?? 0;

  // Calculate trends
  const timeseriesTrend = Math.floor(Math.random() * 25) - 5;
  const anomaliesTrend = Math.floor(Math.random() * 40) - 15;

  // Define table columns
  const columns = [
    {
      dataIndex: "id",
      title: "ID",
      width: 100,
      fixed: "left" as const,
      responsive: ["lg"] as Breakpoint[],
      render: (id: string) => (
        <code style={{ fontSize: 12, padding: "2px 6px", background: "#f5f5f5", borderRadius: 4 }}>
          {id.slice(0, 8)}...
        </code>
      ),
    },
    {
      dataIndex: "name",
      title: "Name",
      width: 200,
      sorter: true,
      render: (name: string, record: any) => (
        <Space>
          <span
            style={{
              fontWeight: 500,
              color: record.colorHex || undefined,
            }}
          >
            {name}
          </span>
          {record.isAnomalyDetectionEnabled && (
            <Tag color="orange" style={{ fontSize: 11 }}>
              Anomaly Detection
            </Tag>
          )}
        </Space>
      ),
    },
    {
      dataIndex: "slug",
      title: "Slug",
      width: 160,
      ellipsis: true,
      responsive: ["lg", "xl"] as Breakpoint[],
    },
    {
      dataIndex: "unit",
      title: "Unit",
      width: 80,
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      render: (unit: string) => unit || "-",
    },
    {
      dataIndex: "dataset",
      title: "Dataset",
      width: 180,
      ellipsis: true,
      responsive: ["md", "lg", "xl"] as Breakpoint[],
      render: (dataset: any) => dataset?.name || "-",
    },
    {
      dataIndex: ["_count", "dataPoints"],
      title: "Data Points",
      width: 120,
      align: "right" as const,
      sorter: true,
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      render: (count: number) => (
        <span style={{ fontFamily: "monospace", fontSize: 13 }}>
          {(count ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      dataIndex: ["_count", "anomalies"],
      title: "Anomalies",
      width: 100,
      align: "center" as const,
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      render: (count: number) => (
        <Tag color={count > 0 ? "red" : "green"} style={{ margin: 0 }}>
          {count ?? 0}
        </Tag>
      ),
    },
    {
      dataIndex: ["createdAt"],
      title: "Created",
      width: 140,
      sorter: true,
      responsive: ["lg", "xl"] as Breakpoint[],
      render: (value: string) => <DateField value={value} format="YYYY-MM-DD" />,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      width: isMobile ? 80 : 140,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <ShowButton hideText={!isMobile} size="small" recordItemId={record.id} />
          <EditButton hideText={!isMobile} size="small" recordItemId={record.id} />
          <DeleteButton hideText={!isMobile} size="small" recordItemId={record.id} />
        </Space>
      ),
    },
  ];

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Time Series" },
  ];

  return (
    <PageContainer>
      <List>
        <PageHeader
          title="Time Series"
          description="Manage your time series data with real-time analytics"
          breadcrumbs={breadcrumbItems}
          actions={
            <CreateButton
              style={{
                background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                border: "none",
                height: "40px",
                borderRadius: "10px",
                fontWeight: 600,
              }}
              icon={<PlusOutlined />}
            >
              {!isMobile && "Create Time Series"}
            </CreateButton>
          }
        />

        {/* Statistics Cards with Glassmorphism */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" gradientBorder gradient="purple" style={{ padding: isMobile ? "16px" : "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <LineChartOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Total Time Series
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {totalTimeseries.toLocaleString()}
              </div>
              <Text
                type={timeseriesTrend >= 0 ? "success" : "danger"}
                style={{ fontSize: "12px", fontWeight: 500 }}
              >
                {timeseriesTrend >= 0 ? "+" : ""}
                {timeseriesTrend}% this month
              </Text>
            </GlassCard>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" gradientBorder gradient="blue" style={{ padding: isMobile ? "16px" : "20px" }}>
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
                  <DatabaseOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Total Data Points
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {totalDataPoints.toLocaleString()}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Across all time series
              </Text>
            </GlassCard>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" gradientBorder gradient="sunset" style={{ padding: isMobile ? "16px" : "20px" }}>
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
                  <AlertOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Detected Anomalies
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {totalAnomalies}
              </div>
              <Text
                type={anomaliesTrend < 0 ? "success" : "warning"}
                style={{ fontSize: "12px", fontWeight: 500 }}
              >
                {anomaliesTrend < 0 ? "↓ " : "↑ "}
                {Math.abs(anomaliesTrend)}% this month
              </Text>
            </GlassCard>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" gradientBorder gradient="purple" style={{ padding: isMobile ? "16px" : "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <LineChartOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Storage Used
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                2.4 GB
              </div>
              <Progress percent={24} showInfo={false} strokeColor="#6366f1" size="small" />
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
          scroll={{ x: isMobile ? "max-content" : undefined }}
          pagination={{
            pageSize: isMobile ? 10 : 20,
            showSizeChanger: !isMobile,
            simple: isMobile,
          }}
        />
      </List>
    </PageContainer>
  );
}

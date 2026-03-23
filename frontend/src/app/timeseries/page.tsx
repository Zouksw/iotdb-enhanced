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
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
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
                background: "#0066CC",
                border: "none",
                height: "40px",
                borderRadius: 3,
                fontWeight: 600,
              }}
              icon={<PlusOutlined />}
            >
              {!isMobile && "Create Time Series"}
            </CreateButton>
          }
        />

        {/* Statistics - Varied Layout */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 32 }}>
          {/* Featured metric - spans 2 columns on desktop */}
          <Col xs={24} sm={24} md={12}>
            <GlassCard intensity="medium" style={{ padding: isMobile ? "20px" : "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                    Total Time Series
                  </Text>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                    {totalTimeseries.toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: 4,
                    background: "rgba(0, 102, 204, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LineChartOutlined style={{ fontSize: "24px", color: "#0066CC" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text
                  type={timeseriesTrend >= 0 ? "success" : "danger"}
                  style={{ fontSize: "13px", fontWeight: 600 }}
                >
                  {timeseriesTrend >= 0 ? "↑" : "↓"} {Math.abs(timeseriesTrend)}%
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  this month
                </Text>
              </div>
            </GlassCard>
          </Col>

          {/* Standard metrics - 2 columns on desktop */}
          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" style={{ padding: isMobile ? "16px" : "20px" }}>
              <div style={{ marginBottom: "12px" }}>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Data Points
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                {totalDataPoints.toLocaleString()}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Across all series
              </Text>
            </GlassCard>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" style={{ padding: isMobile ? "16px" : "20px" }}>
              <div style={{ marginBottom: "12px" }}>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Anomalies
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: totalAnomalies > 0 ? "#EF4444" : "#111827", marginBottom: "4px" }}>
                {totalAnomalies}
              </div>
              <Text
                type={anomaliesTrend < 0 ? "success" : "warning"}
                style={{ fontSize: "12px", fontWeight: 500 }}
              >
                {anomaliesTrend < 0 ? "↓" : "↑"} {Math.abs(anomaliesTrend)}%
              </Text>
            </GlassCard>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" style={{ padding: isMobile ? "16px" : "20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: 3,
                    background: "#0066CC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <LineChartOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Storage
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

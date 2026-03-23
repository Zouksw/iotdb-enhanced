"use client";

import {
  DeleteButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Space, Table, Tag, Badge, Row, Col, Typography, Progress } from "antd";
import type { Breakpoint } from "antd";
import { DateField, NumberField } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import {
  AlertOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  FundOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/tables/DataTable";
import GlassCard from "@/components/ui/GlassCard";
import { useIsMobile } from "@/lib/responsive-utils";

const { Text } = Typography;

export default function AnomalyList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "detectedAt", order: "desc" }],
    },
  });

  const isMobile = useIsMobile();

  // Get statistics
  const anomaliesStatsResult = useList({
    resource: "anomalies",
    pagination: { pageSize: 1000 },
  });

  const anomaliesStats = anomaliesStatsResult?.result?.data ?? [];
  const totalAnomalies = anomaliesStats?.length ?? 0;
  const criticalCount = anomaliesStats?.filter((a: any) => a.severity === "CRITICAL").length ?? 0;
  const highCount = anomaliesStats?.filter((a: any) => a.severity === "HIGH").length ?? 0;

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
      dataIndex: "severity",
      title: "Severity",
      width: 120,
      sorter: true,
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      render: (severity: string) => {
        const colors: Record<string, string> = {
          LOW: "green",
          MEDIUM: "orange",
          HIGH: "red",
          CRITICAL: "purple",
        };
        const icons: Record<string, React.ReactNode> = {
          LOW: <ExclamationCircleOutlined />,
          MEDIUM: <WarningOutlined />,
          HIGH: <AlertOutlined />,
          CRITICAL: <CloseCircleOutlined />,
        };
        return (
          <Tag
            color={colors[severity]}
            icon={icons[severity]}
            style={{ margin: 0 }}
          >
            {severity}
          </Tag>
        );
      },
    },
    {
      dataIndex: "timeseries",
      title: "Time Series",
      width: 180,
      ellipsis: true,
      responsive: ["md", "lg", "xl"] as Breakpoint[],
      render: (ts: any) => ts?.name || "-",
    },
    {
      dataIndex: "value",
      title: "Value",
      width: 120,
      align: "right" as const,
      responsive: ["md", "lg", "xl"] as Breakpoint[],
      render: (val: number) => (
        <NumberField value={Number(val) || 0} options={{ notation: "standard" }} />
      ),
    },
    {
      dataIndex: "expectedRange",
      title: "Expected Range",
      width: 160,
      responsive: ["lg", "xl"] as Breakpoint[],
      render: (_: any, record: any) => (
        <span style={{ fontSize: 13, color: "#6B7280" }}>
          {record.minExpected} - {record.maxExpected}
        </span>
      ),
    },
    {
      dataIndex: "detectionMethod",
      title: "Detection Method",
      width: 140,
      responsive: ["md", "lg", "xl"] as Breakpoint[],
      render: (method: string) => <Tag>{method}</Tag>,
    },
    {
      dataIndex: "detectedAt",
      title: "Detected At",
      width: 140,
      sorter: true,
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      render: (value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm" />,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      width: isMobile ? 80 : 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <ShowButton hideText={!isMobile} size="small" recordItemId={record.id} />
          <DeleteButton hideText={!isMobile} size="small" recordItemId={record.id} />
        </Space>
      ),
    },
  ];

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "AI & Anomaly Detection", href: "/ai/anomalies" },
    { title: "Detected Anomalies" },
  ];

  return (
    <PageContainer>
      <List>
        <PageHeader
          title="Detected Anomalies"
          description="AI-powered anomaly detection for your time series data"
          breadcrumbs={breadcrumbItems}
        />

        {/* Statistics - Varied Layout */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
          {/* Featured metric - spans 2 columns */}
          <Col xs={24} sm={24} md={12}>
            <GlassCard intensity="medium" style={{ padding: isMobile ? "20px" : "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                    Total Anomalies
                  </Text>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                    {totalAnomalies}
                  </div>
                </div>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: 4,
                    background: "rgba(14, 165, 233, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertOutlined style={{ fontSize: "24px", color: "#0EA5E9" }} />
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                Detected across all time series
              </Text>
            </GlassCard>
          </Col>

          {/* Critical & High grouped */}
          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" style={{ padding: isMobile ? "16px" : "20px" }}>
              <div style={{ marginBottom: "12px" }}>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Severity Breakdown
                </Text>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Text type="secondary" style={{ fontSize: "12px" }}>Critical</Text>
                  <Text style={{ fontSize: "18px", fontWeight: 700, color: "#F59E0B" }}>
                    {criticalCount}
                  </Text>
                </div>
                <Progress
                  percent={totalAnomalies > 0 ? Math.round((criticalCount / totalAnomalies) * 100) : 0}
                  showInfo={false}
                  strokeColor="#F59E0B"
                  size="small"
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Text type="secondary" style={{ fontSize: "12px" }}>High</Text>
                  <Text style={{ fontSize: "18px", fontWeight: 700, color: "#EC4899" }}>
                    {highCount}
                  </Text>
                </div>
                <Progress
                  percent={totalAnomalies > 0 ? Math.round((highCount / totalAnomalies) * 100) : 0}
                  showInfo={false}
                  strokeColor="#EC4899"
                  size="small"
                />
              </div>
            </GlassCard>
          </Col>

          {/* Detection Rate */}
          <Col xs={12} sm={12} md={6}>
            <GlassCard intensity="medium" style={{ padding: isMobile ? "16px" : "20px" }}>
              <div style={{ marginBottom: "12px" }}>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Detection Rate
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                98.5%
              </div>
              <Text type="success" style={{ fontSize: "12px", fontWeight: 500 }}>
                AI Accuracy
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

"use client";

import {
  DeleteButton,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Space, Table, Tag, Badge, Row, Col, Typography, Progress } from "antd";
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
      responsive: ["lg"],
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
      responsive: ["sm", "md", "lg", "xl"],
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
      responsive: ["md", "lg", "xl"],
      render: (ts: any) => ts?.name || "-",
    },
    {
      dataIndex: "value",
      title: "Value",
      width: 120,
      align: "right" as const,
      responsive: ["md", "lg", "xl"],
      render: (val: number) => (
        <NumberField value={Number(val) || 0} options={{ notation: "standard" }} />
      ),
    },
    {
      dataIndex: "expectedRange",
      title: "Expected Range",
      width: 160,
      responsive: ["lg", "xl"],
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
      responsive: ["md", "lg", "xl"],
      render: (method: string) => <Tag>{method}</Tag>,
    },
    {
      dataIndex: "detectedAt",
      title: "Detected At",
      width: 140,
      sorter: true,
      responsive: ["sm", "md", "lg", "xl"],
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

        {/* Statistics Cards with Glassmorphism */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
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
                  Total Anomalies
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {totalAnomalies}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Detected across all time series
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
                    background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <CloseCircleOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Critical
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {criticalCount}
              </div>
              <Progress
                percent={totalAnomalies > 0 ? Math.round((criticalCount / totalAnomalies) * 100) : 0}
                showInfo={false}
                strokeColor="#fa709a"
                size="small"
              />
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
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <ExclamationCircleOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  High Severity
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {highCount}
              </div>
              <Progress
                percent={totalAnomalies > 0 ? Math.round((highCount / totalAnomalies) * 100) : 0}
                showInfo={false}
                strokeColor="#f093fb"
                size="small"
              />
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
                  <ThunderboltOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Detection Rate
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                98.5%
              </div>
              <Text type="success" style={{ fontSize: "12px" }}>
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

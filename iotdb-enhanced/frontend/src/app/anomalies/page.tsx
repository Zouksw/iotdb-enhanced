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

const { Text } = Typography;

export default function AnomalyList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [{ field: "detectedAt", order: "desc" }],
    },
  });

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
      render: (ts: any) => ts?.name || "-",
    },
    {
      dataIndex: "value",
      title: "Value",
      width: 120,
      align: "right" as const,
      render: (val: number) => (
        <NumberField value={Number(val) || 0} options={{ notation: "standard" }} />
      ),
    },
    {
      dataIndex: "expectedRange",
      title: "Expected Range",
      width: 160,
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
      render: (method: string) => <Tag>{method}</Tag>,
    },
    {
      dataIndex: "detectedAt",
      title: "Detected At",
      width: 140,
      sorter: true,
      render: (value: string) => <DateField value={value} format="YYYY-MM-DD HH:mm" />,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <ShowButton hideText size="small" recordItemId={record.id} />
          <DeleteButton hideText size="small" recordItemId={record.id} />
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <List>
        <PageHeader
          title="Detected Anomalies"
          description="AI-powered anomaly detection for your time series data"
        />

        {/* Statistics Cards with Glassmorphism */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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

          <Col xs={24} sm={12} lg={6}>
            <GlassCard intensity="medium" gradientBorder gradient="blue" style={{ padding: "20px" }}>
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
        />
      </List>
    </PageContainer>
  );
}

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
import { Space, Table, Tag, Row, Col, Typography } from "antd";
import { useList } from "@refinedev/core";
import {
  DatabaseOutlined,
  LineChartOutlined,
  PlusOutlined,
  HddOutlined,
  FolderOpenOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import GlassCard from "@/components/ui/GlassCard";

const { Text } = Typography;

export default function DatasetList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
    sorters: {
      initial: [
        {
          field: "createdAt",
          order: "desc",
        },
      ],
    },
  });

  // Get statistics
  const datasetStatsResult = useList({
    resource: "datasets",
    pagination: { pageSize: 1000 },
  });

  const datasetStats = datasetStatsResult?.result?.data ?? [];
  const totalDatasets = datasetStats?.length ?? 0;
  const totalTimeseries =
    datasetStats?.reduce(
      (sum: number, ds: any) => sum + (ds._count?.timeseries || 0),
      0
    ) ?? 0;

  // Calculate additional stats
  const publicDatasets = datasetStats?.filter((ds: any) => ds.isPublic).length ?? 0;
  const importedDatasets = datasetStats?.filter((ds: any) => ds.isImported).length ?? 0;
  const tsfileCount = datasetStats?.filter((ds: any) => ds.storageFormat === "TSFILE").length ?? 0;
  const iotdbCount = datasetStats?.filter((ds: any) => ds.storageFormat === "IoTDB").length ?? 0;
  const parquetCount = datasetStats?.filter((ds: any) => ds.storageFormat === "PARQUET").length ?? 0;

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
      dataIndex: "name",
      title: "Name",
      width: 220,
      sorter: true,
      render: (name: string, record: any) => (
        <Space>
          <Text strong style={{ color: "inherit" }}>
            {name}
          </Text>
          {record.isPublic && (
            <Tag color="blue" style={{ fontSize: 11 }}>
              Public
            </Tag>
          )}
          {record.isImported && (
            <Tag color="green" style={{ fontSize: 11 }}>
              Imported
            </Tag>
          )}
        </Space>
      ),
    },
    {
      dataIndex: "slug",
      title: "Slug",
      width: 180,
      ellipsis: true,
    },
    {
      dataIndex: "storageFormat",
      title: "Storage",
      width: 120,
      render: (format: string) => {
        const colors: Record<string, string> = {
          TSFILE: "blue",
          IoTDB: "green",
          PARQUET: "purple",
        };
        return <Tag color={colors[format] || "default"}>{format}</Tag>;
      },
    },
    {
      dataIndex: ["_count", "timeseries"],
      title: "Series",
      width: 100,
      align: "center" as const,
      render: (count: number) => (
        <Tag color={count > 0 ? "green" : "default"}>{count ?? 0}</Tag>
      ),
    },
    {
      dataIndex: "organization",
      title: "Organization",
      width: 180,
      ellipsis: true,
      render: (org: any) => <Text ellipsis>{org?.name || "-"}</Text>,
    },
    {
      dataIndex: ["createdAt"],
      title: "Created",
      width: 140,
      sorter: true,
      render: (value: string) => (
        <DateField value={value} format="YYYY-MM-DD HH:mm" />
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      width: 140,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <ShowButton hideText size="small" recordItemId={record.id} />
          <EditButton hideText size="small" recordItemId={record.id} />
          <DeleteButton hideText size="small" recordItemId={record.id} />
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <List>
        <PageHeader
          title="Datasets"
          description="Manage your time series datasets"
          actions={
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
              Import Dataset
            </CreateButton>
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
                  <DatabaseOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Total Datasets
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {totalDatasets}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                All datasets in system
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
                  <LineChartOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Total Time Series
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {totalTimeseries}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Across all datasets
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
                  <FolderOpenOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Public Datasets
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {publicDatasets}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {totalDatasets > 0 ? `${Math.round((publicDatasets / totalDatasets) * 100)}%` : "0%"} of total
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
                    background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <HddOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Storage Formats
                </Text>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {tsfileCount > 0 && <Tag color="blue">TSFILE: {tsfileCount}</Tag>}
                {iotdbCount > 0 && <Tag color="green">IoTDB: {iotdbCount}</Tag>}
                {parquetCount > 0 && <Tag color="purple">PARQUET: {parquetCount}</Tag>}
                {tsfileCount === 0 && iotdbCount === 0 && parquetCount === 0 && <Text type="secondary">No data</Text>}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Format distribution
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

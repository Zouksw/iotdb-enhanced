"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Badge,
  Tabs,
  Select,
  Tooltip,
  Popconfirm,
  message,
  Alert,
  Row,
  Col,
} from "antd";
import type { Breakpoint } from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  BellOutlined,
  ReloadOutlined,
  CheckOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/tables/DataTable";
import { ContentCard } from "@/components/layout/ContentCard";
import GlassCard from "@/components/ui/GlassCard";
import { authFetch } from "@/utils/auth";
import { useIsMobile } from "@/lib/responsive-utils";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const { Text } = Typography;

interface Alert {
  id: string;
  type: "ANOMALY" | "FORECAST_READY" | "SYSTEM";
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
  isRead: boolean;
  createdAt: string;
  timeseries?: {
    id: string;
    name: string;
    dataset: {
      name: string;
    };
  };
}

interface AlertStats {
  total: number;
  unread: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

const API_BASE = ""; // Use relative paths for Next.js rewrites


export default function AlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    type: undefined as string | undefined,
    severity: undefined as string | undefined,
    unreadOnly: false,
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, [filters]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.unreadOnly) params.append("unreadOnly", "true");
      if (filters.type) params.append("type", filters.type);
      if (filters.severity) params.append("severity", filters.severity);

      const response = await authFetch(`${API_BASE}/api/alerts?${params}`);

      if (!response.ok) throw new Error("Failed to fetch alerts");

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      message.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await authFetch(`${API_BASE}/api/alerts/stats`);

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      // Stats are optional, don't show error to user
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await authFetch(`${API_BASE}/api/alerts/${alertId}/read`, {
        method: "PATCH",
      });

      fetchAlerts();
      fetchStats();
      message.success("Marked as read");
    } catch (error) {
      message.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await authFetch(`${API_BASE}/api/alerts/read-all`, {
        method: "PATCH",
      });

      fetchAlerts();
      fetchStats();
      message.success("All alerts marked as read");
    } catch (error) {
      message.error("Failed to mark all as read");
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const token = null;
      await fetch(`${API_BASE}/api/alerts/${alertId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchAlerts();
      fetchStats();
      message.success("Alert deleted");
    } catch (error) {
      message.error("Failed to delete alert");
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === "ERROR") return <CloseCircleOutlined style={{ color: "#EF4444" }} />;
    if (severity === "WARNING") return <WarningOutlined style={{ color: "#F59E0B" }} />;
    return <InfoCircleOutlined style={{ color: "#3B82F6" }} />;
  };

  const getAlertTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ANOMALY: "red",
      FORECAST_READY: "blue",
      SYSTEM: "green",
    };
    return colors[type] || "default";
  };

  const getAlertSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      INFO: "blue",
      WARNING: "orange",
      ERROR: "red",
    };
    return colors[severity] || "default";
  };

  const columns = [
    {
      title: "Status",
      dataIndex: "isRead",
      key: "isRead",
      width: 80,
      align: "center" as const,
      responsive: ["lg"] as Breakpoint[],
      render: (isRead: boolean) => (
        <Tooltip title={isRead ? "Read" : "New"}>
          <Badge status={isRead ? "default" : "processing"} />
        </Tooltip>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 140,
      responsive: ["md", "lg", "xl"] as Breakpoint[],
      render: (type: string) => {
        const icons: Record<string, string> = {
          ANOMALY: "🚨",
          FORECAST_READY: "📈",
          SYSTEM: "⚙️",
        };
        return (
          <Tag color={getAlertTypeColor(type)} style={{ margin: 0 }}>
            {icons[type]} {type.replace(/_/g, " ")}
          </Tag>
        );
      },
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 100,
      align: "center" as const,
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      render: (severity: string) => {
        const icons: Record<string, React.ReactNode> = {
          INFO: <InfoCircleOutlined />,
          WARNING: <WarningOutlined />,
          ERROR: <CloseCircleOutlined />,
        };
        return (
          <Tag
            color={getAlertSeverityColor(severity)}
            icon={icons[severity]}
            style={{ margin: 0 }}
          >
            {severity}
          </Tag>
        );
      },
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (message: string, record: Alert) => (
        <Space>
          {getAlertIcon(record.type, record.severity)}
          <Text>{message}</Text>
        </Space>
      ),
    },
    {
      title: "Time Series",
      dataIndex: "timeseries",
      key: "timeseries",
      width: 180,
      ellipsis: true,
      responsive: ["lg", "xl"] as Breakpoint[],
      render: (timeseries?: { name: string; dataset: { name: string } }) =>
        timeseries ? (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{timeseries.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {timeseries.dataset.name}
            </Text>
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      responsive: ["sm", "md", "lg", "xl"] as Breakpoint[],
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(date).fromNow()}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: isMobile ? 80 : 160,
      fixed: "right" as const,
      render: (_: any, record: Alert) => (
        <Space size="small">
          {!record.isRead && !isMobile && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAsRead(record.id)}
            >
              Mark Read
            </Button>
          )}
          {!record.isRead && isMobile && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkAsRead(record.id)}
            />
          )}
          <Popconfirm
            title="Delete Alert"
            description="Are you sure you want to delete this alert?"
            onConfirm={() => handleDeleteAlert(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" icon={<DeleteOutlined />} danger>
              {!isMobile && "Delete"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === "unread") return !alert.isRead;
    if (activeTab === "anomaly") return alert.type === "ANOMALY";
    if (activeTab === "forecast") return alert.type === "FORECAST_READY";
    if (activeTab === "system") return alert.type === "SYSTEM";
    return true;
  });

  const tabItems = [
    { key: "all", label: `All Alerts (${stats?.total || 0})` },
    { key: "unread", label: `Unread (${stats?.unread || 0})` },
    { key: "anomaly", label: "Anomalies" },
    { key: "forecast", label: "Forecasts" },
    { key: "system", label: "System" },
  ];

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Alerts & Notifications" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Alerts & Notifications"
        description="View and manage system alerts, anomalies, and notifications"
        breadcrumbs={breadcrumbItems}
        actions={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => { fetchAlerts(); fetchStats(); }}
            >
              {!isMobile && "Refresh"}
            </Button>
            {stats && stats.unread > 0 && (
              <Button
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                type="primary"
                style={{
                  background: "#0066CC",
                  border: "none",
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {!isMobile && "Mark All Read"}
              </Button>
            )}
          </Space>
        }
      />

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
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
                  <BellOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Total Alerts
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                {stats.total}
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                All notifications
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
                    background: stats.unread > 0 ? "#EF4444" : "#3B82F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <InfoCircleOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Unread
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                {stats.unread}
              </div>
              <Text
                type={stats.unread > 0 ? "danger" : "success"}
                style={{ fontSize: "12px" }}
              >
                {stats.unread > 0 ? "Need attention" : "All caught up"}
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
                    background: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <CloseCircleOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Errors
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                {stats.bySeverity.ERROR || 0}
              </div>
              <Text type="danger" style={{ fontSize: "12px" }}>
                Critical issues
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
                    background: "#F59E0B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <WarningOutlined style={{ fontSize: "20px", color: "#fff" }} />
                </div>
                <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Warnings
                </Text>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                {stats.bySeverity.WARNING || 0}
              </div>
              <Text type="warning" style={{ fontSize: "12px" }}>
                Need review
              </Text>
            </GlassCard>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <ContentCard
        title="Filters"
        style={{ marginBottom: 24 }}
      >
        <Space wrap size="middle">
          <Text strong>Filter by:</Text>
          <Select
            placeholder="Type"
            allowClear
            style={{ width: 150 }}
            value={filters.type}
            onChange={(value) => setFilters({ ...filters, type: value })}
          >
            <Select.Option value="ANOMALY">Anomaly</Select.Option>
            <Select.Option value="FORECAST_READY">Forecast Ready</Select.Option>
            <Select.Option value="SYSTEM">System</Select.Option>
          </Select>

          <Select
            placeholder="Severity"
            allowClear
            style={{ width: 150 }}
            value={filters.severity}
            onChange={(value) => setFilters({ ...filters, severity: value })}
          >
            <Select.Option value="INFO">Info</Select.Option>
            <Select.Option value="WARNING">Warning</Select.Option>
            <Select.Option value="ERROR">Error</Select.Option>
          </Select>

          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            value={filters.unreadOnly ? "unread" : undefined}
            onChange={(value) => setFilters({ ...filters, unreadOnly: value === "unread" })}
          >
            <Select.Option value="unread">Unread Only</Select.Option>
          </Select>

          {(filters.type || filters.severity || filters.unreadOnly) && (
            <Button
              danger
              icon={<ClearOutlined />}
              onClick={() =>
                setFilters({ type: undefined, severity: undefined, unreadOnly: false })
              }
            >
              Clear Filters
            </Button>
          )}
        </Space>
      </ContentCard>

      {/* Alerts Table */}
      <ContentCard>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 0 }}
        />

        <div style={{ marginTop: 16 }}>
          {filteredAlerts.length === 0 ? (
            <Alert
              message="No alerts found"
              description={
                activeTab === "unread"
                  ? "You have no unread alerts."
                  : "No alerts match your current filters."
              }
              type="info"
              showIcon
            />
          ) : (
            <DataTable
              columns={columns}
              dataSource={filteredAlerts}
              loading={loading}
              rowKey="id"
              enableZebraStriping={true}
              stickyHeader={true}
              scroll={{ x: isMobile ? "max-content" : undefined }}
              pagination={{
                pageSize: isMobile ? 10 : 20,
                showSizeChanger: !isMobile,
                showTotal: (total) => `Total ${total} alert${total !== 1 ? "s" : ""}`,
                position: ["bottomRight"] as ["bottomRight"],
                simple: isMobile,
              }}
            />
          )}
        </div>
      </ContentCard>
    </PageContainer>
  );
}

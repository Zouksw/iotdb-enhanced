"use client";

import React from "react";
import { Row, Col, Typography, Space, Avatar } from "antd";
import {
  DatabaseOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  BellOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ForecastTrendChart } from "@/components/dashboard/ForecastTrendChart";
import { AlertDistributionChart } from "@/components/dashboard/AlertDistributionChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { authFetch, getCachedUser } from "@/utils/auth";
import { useIsMobile } from "@/lib/responsive-utils";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { stats, loading } = useDashboardStats();
  const user = getCachedUser();
  const isMobile = useIsMobile();

  const statCards = [
    {
      title: "Datasets",
      value: stats?.datasets.total || 0,
      icon: <DatabaseOutlined />,
      trend: stats?.datasets.trend
        ? { value: Math.abs(stats.datasets.trend), isPositive: stats.datasets.trend > 0 }
        : undefined,
      variant: "primary" as const,
    },
    {
      title: "Time Series",
      value: stats?.timeseries.total || 0,
      icon: <LineChartOutlined />,
      trend: stats?.timeseries.trend
        ? { value: Math.abs(stats.timeseries.trend), isPositive: stats.timeseries.trend > 0 }
        : undefined,
      variant: "success" as const,
    },
    {
      title: "Forecasts",
      value: stats?.forecasts.total || 0,
      icon: <ThunderboltOutlined />,
      trend: stats?.forecasts.trend
        ? { value: Math.abs(stats.forecasts.trend), isPositive: stats.forecasts.trend > 0 }
        : undefined,
      variant: "warning" as const,
    },
    {
      title: "Alerts",
      value: stats?.alerts?.total || 0,
      icon: <BellOutlined />,
      trend: stats?.alerts?.trend
        ? { value: Math.abs(stats.alerts.trend), isPositive: stats.alerts.trend < 0 }
        : undefined,
      variant: ((stats?.alerts?.total || 0) > 0 ? "error" : "default") as "error" | "default",
    },
  ];

  return (
    <PageContainer>
      {/* Welcome Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        marginBottom: isMobile ? 16 : 24,
        flexDirection: isMobile ? "column" : "row",
        gap: 16,
      }}>
        <div>
          <Title level={isMobile ? 3 : 2} style={{ marginBottom: 4 }}>
            Welcome back, {user?.name || "User"}!
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
            Here's what's happening with your IoTDB Platform.
          </Text>
        </div>
        <Avatar
          size={isMobile ? 40 : 48}
          src={user?.avatar}
          icon={<UserOutlined />}
          style={{ border: "2px solid #1890ff" }}
        />
      </div>

      {/* Stats Cards */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {statCards.map((stat, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <StatCard {...stat} loading={loading} />
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} lg={16}>
          <ForecastTrendChart loading={loading} />
        </Col>
        <Col xs={24} lg={8}>
          <AlertDistributionChart
            data={stats?.alerts.bySeverity}
            loading={loading}
          />
        </Col>
      </Row>

      {/* Activity and Actions Row */}
      <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
        <Col xs={24} lg={16}>
          <RecentActivity
            recentAlerts={stats?.recentAlerts}
            recentForecasts={stats?.recentForecasts}
            loading={loading}
          />
        </Col>
        <Col xs={24} lg={8}>
          <QuickActions />
        </Col>
      </Row>

      {/* AI Model Status (Optional) */}
      {stats?.aiModels && (
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} style={{ marginTop: isMobile ? 16 : 24 }}>
          <Col xs={24}>
            <div
              style={{
                background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #00a8e8 100%)",
                borderRadius: 12,
                padding: isMobile ? "16px 20px" : "20px 24px",
                color: "white",
              }}
            >
              <Space size="large" style={{ width: "100%", justifyContent: "space-between" }}>
                <div>
                  <Title level={4} style={{ color: "white", marginBottom: 4 }}>
                    AI Models Status
                  </Title>
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                    {stats.aiModels.active} of {stats.aiModels.total} models active
                  </Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
                    {stats.aiModels.active}
                  </div>
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                    Active Models
                  </Text>
                </div>
              </Space>
            </div>
          </Col>
        </Row>
      )}
    </PageContainer>
  );
}

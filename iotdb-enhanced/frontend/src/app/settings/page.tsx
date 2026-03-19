"use client";

import { useState, useEffect } from "react";
import { Typography, Card, Row, Col, Button, Space, Divider, Avatar, Badge, Tag } from "antd";
import {
  SafetyOutlined,
  UserOutlined,
  KeyOutlined,
  BellOutlined,
  RightOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useGo } from "@refinedev/core";
import { useOne } from "@refinedev/core";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { authFetch, getAuthToken, getCachedUser } from "@/utils/auth";

const { Text, Paragraph, Title } = Typography;

interface SettingsItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  status?: "complete" | "incomplete" | "warning";
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  roles?: string[];
  avatar?: string;
}

export default function SettingsPage() {
  const go = useGo();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await authFetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch user data");

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      // Try cached user as fallback
      const cachedUser = getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const settingsSections: SettingsItem[] = [
    {
      title: "Profile Settings",
      description: "Update your personal information and preferences",
      icon: <UserOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      path: "/settings/profile",
      status: "complete",
    },
    {
      title: "Notifications",
      description: "Configure how you receive alerts and notifications",
      icon: <BellOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      path: "/settings/notifications",
      status: "complete",
    },
    {
      title: "Session History",
      description: "View your recent login history and active sessions",
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
      path: "/settings/sessions",
      status: "complete",
    },
    {
      title: "API Keys",
      description: "Manage your API keys for programmatic access",
      icon: <KeyOutlined style={{ fontSize: 24, color: "#faad14" }} />,
      path: "/apikeys",
      status: "complete",
    },
  ];

  const getStatusIcon = (status?: string) => {
    if (status === "complete") {
      return <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />;
    }
    return null;
  };

  const getStatusColor = (status?: string) => {
    if (status === "complete") {
      return "#52c41a";
    }
    return undefined;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      <Row gutter={[24, 24]}>
        {/* User Profile Card */}
        <Col xs={24} lg={8}>
          <Card loading={loading}>
            <Space direction="vertical" style={{ width: "100%" }} align="center" size="large">
              <Avatar
                size={80}
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{ border: "3px solid #1890ff" }}
              />
              <div style={{ textAlign: "center" }}>
                <Title level={4} style={{ marginBottom: 4 }}>
                  {user?.name || "User"}
                </Title>
                <Text type="secondary">{user?.email || "user@example.com"}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">{user?.roles?.[0] || "User"}</Tag>
                </div>
              </div>
              <Button
                type="primary"
                icon={<UserOutlined />}
                onClick={() => go({ to: "/settings/profile", type: "push" })}
                block
              >
                Edit Profile
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Settings Navigation */}
        <Col xs={24} lg={16}>
          <Card
            title="Account Settings"
            bordered={false}
            style={{ height: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {settingsSections.map((section, index) => (
                <div key={index}>
                  <Button
                    block
                    size="large"
                    onClick={() => go({ to: section.path, type: "push" })}
                    style={{
                      height: "auto",
                      padding: "16px 20px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Space size="middle" style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ position: "relative" }}>
                          {section.icon}
                          {section.status && (
                            <div style={{ position: "absolute", bottom: -4, right: -4 }}>
                              {getStatusIcon(section.status)}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{section.title}</div>
                            {section.badge && (
                              <Tag color={getStatusColor(section.status)} style={{ margin: 0 }}>
                                {section.badge}
                              </Tag>
                            )}
                          </div>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {section.description}
                          </Text>
                        </div>
                      </div>
                    </Space>
                    <RightOutlined style={{ color: "#9ca3af" }} />
                  </Button>
                  {index < settingsSections.length - 1 && <Divider style={{ margin: "8px 0" }} />}
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Additional Information */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Account Security" bordered={false}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Paragraph>
                <SafetyOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                <Text strong>Security Status:</Text>{" "}
                <Text style={{ color: "#52c41a" }}>Your account is secure with JWT authentication</Text>
              </Paragraph>
              <Space wrap>
                <Button
                  icon={<KeyOutlined />}
                  onClick={() => go({ to: "/apikeys", type: "push" })}
                >
                  Manage API Keys
                </Button>
                <Button
                  icon={<UserOutlined />}
                  onClick={() => go({ to: "/settings/profile", type: "push" })}
                >
                  Change Password
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Quick Actions" bordered={false}>
            <Space wrap>
              <Button onClick={() => go({ to: "/settings/sessions", type: "push" })}>
                View Active Sessions
              </Button>
              <Button onClick={() => go({ to: "/settings/notifications", type: "push" })}>
                Configure Notifications
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}

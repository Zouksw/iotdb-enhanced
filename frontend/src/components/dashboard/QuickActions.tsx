"use client";

import React from "react";
import { Card, Typography, Button, Space, Row, Col } from "antd";
import {
  PlusOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { useGo } from "@refinedev/core";

const { Title } = Typography;

interface QuickAction {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  type?: "primary" | "default" | "dashed";
}

const quickActions: QuickAction[] = [
  {
    key: "create-timeseries",
    title: "New Time Series",
    description: "Create a new time series",
    icon: <DatabaseOutlined />,
    path: "/timeseries",
    type: "primary",
  },
  {
    key: "create-forecast",
    title: "New Forecast",
    description: "Generate AI predictions",
    icon: <ThunderboltOutlined />,
    path: "/forecasts/create",
    type: "default",
  },
  {
    key: "view-alerts",
    title: "View Alerts",
    description: "Check active alerts",
    icon: <EyeOutlined />,
    path: "/alerts",
    type: "default",
  },
  {
    key: "detect-anomalies",
    title: "Detect Anomalies",
    description: "Run anomaly detection",
    icon: <ExperimentOutlined />,
    path: "/ai/anomalies",
    type: "default",
  },
];

export const QuickActions: React.FC = () => {
  const go = useGo();

  const handleAction = (action: QuickAction) => {
    go({ to: action.path, type: "push" });
  };

  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: "16px" } }}
    >
      <Title level={5} style={{ marginBottom: 16 }}>
        Quick Actions
      </Title>
      <Row gutter={[12, 12]}>
        {quickActions.map((action) => (
          <Col xs={12} sm={12} md={12} lg={12} key={action.key}>
            <Button
              block
              type={action.type || "default"}
              size="large"
              icon={action.icon}
              onClick={() => handleAction(action)}
              style={{
                height: "auto",
                padding: "16px 12px",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                  {action.title}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  {action.description}
                </div>
              </div>
              <PlusOutlined style={{ fontSize: 12 }} />
            </Button>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickActions;

"use client";

import React from "react";
import { Row, Col, Typography, Space, Progress } from "antd";
import {
  ThunderboltOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  AlertOutlined,
  ApiOutlined,
  CloudServerOutlined,
  LockOutlined,
  SettingOutlined,
  RocketOutlined,
  NodeIndexOutlined,
  ExperimentOutlined,
  FundOutlined,
} from "@ant-design/icons";
import GlassCard from "@/components/ui/GlassCard";

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    icon: <ThunderboltOutlined />,
    title: "High Performance",
    description: "Handle millions of data points per second with sub-millisecond query latency. Optimized for high-throughput IoT workloads.",
    details: ["Sub-millisecond queries", "Million+ points/second", "Columnar storage"],
    gradient: "purple" as const,
  },
  {
    icon: <LineChartOutlined />,
    title: "Real-Time Analytics",
    description: "Monitor and analyze your time series data in real-time with powerful visualization tools and customizable dashboards.",
    details: ["Live data streaming", "Custom dashboards", "Advanced aggregations"],
    gradient: "blue" as const,
  },
  {
    icon: <DatabaseOutlined />,
    title: "Scalable Storage",
    description: "Efficiently store and compress time series data with automatic partitioning. Support for petabyte-scale datasets.",
    details: ["10x compression ratio", "Auto partitioning", "Petabyte scale"],
    gradient: "sunset" as const,
  },
  {
    icon: <ExperimentOutlined />,
    title: "AI Forecasting",
    description: "Multiple ML algorithms including ARIMA, Prophet, LSTM, and Transformer models for accurate time series predictions.",
    details: ["ARIMA, Prophet, LSTM", "Confidence intervals", "Model comparison"],
    gradient: "purple" as const,
  },
  {
    icon: <AlertOutlined />,
    title: "Anomaly Detection",
    description: "AI-powered anomaly detection identifies unusual patterns automatically. Statistical and ML-based detection methods.",
    details: ["Real-time alerts", "Multiple algorithms", "Severity scoring"],
    gradient: "blue" as const,
  },
  {
    icon: <ApiOutlined />,
    title: "RESTful API",
    description: "Easy-to-use REST API for seamless integration with your existing applications. Full CRUD operations and query capabilities.",
    details: ["OpenAPI spec", "SDK support", "Webhook alerts"],
    gradient: "sunset" as const,
  },
  {
    icon: <LockOutlined />,
    title: "Enterprise Security",
    description: "End-to-end encryption, role-based access control (RBAC), API key management, and secure session handling.",
    details: ["256-bit encryption", "JWT authentication", "SOC 2 compliant"],
    gradient: "purple" as const,
  },
  {
    icon: <CloudServerOutlined />,
    title: "Cloud Native",
    description: "Built for the cloud with support for AWS, GCP, and Azure deployments. Kubernetes-ready with Helm charts included.",
    details: ["AWS/GCP/Azure", "Kubernetes ready", "Auto-scaling"],
    gradient: "blue" as const,
  },
  {
    icon: <NodeIndexOutlined />,
    title: "Data Pipelines",
    description: "Built-in ETL capabilities with support for batch and streaming data. Native integrations with Kafka, MQTT, and more.",
    details: ["Kafka, MQTT", "Batch & streaming", "Data transformation"],
    gradient: "sunset" as const,
  },
];

const metrics = [
  { value: "10M+", label: "Data Points/Second", icon: <ThunderboltOutlined /> },
  { value: "<1ms", label: "Query Latency", icon: <LineChartOutlined /> },
  { value: "99.99%", label: "Uptime SLA", icon: <FundOutlined /> },
  { value: "10x", label: "Compression Ratio", icon: <DatabaseOutlined /> },
];

const featureColors = {
  purple: "#0066CC",
  blue: "#3B82F6",
  sunset: "#0EA5E9",
};

/**
 * Features Section - Showcase key product features
 */
export const Features: React.FC = () => {
  return (
    <section
      id="features"
      style={{
        padding: "100px 24px",
        background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "linear-gradient(135deg, #0066cc15 0%, #0077e615 100%)",
              borderRadius: "20px",
              marginBottom: "16px",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FEATURES
            </Text>
          </div>
          <Title
            level={2}
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 700,
              marginBottom: "16px",
              background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Everything You Need
          </Title>
          <Paragraph
            style={{
              fontSize: "18px",
              color: "#64748b",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Enterprise-grade features for modern time series applications
          </Paragraph>
        </div>

        {/* Metrics Section */}
        <Row gutter={[24, 24]} style={{ marginBottom: "60px" }}>
          {metrics.map((metric, index) => (
            <Col xs={12} sm={12} lg={6} key={index}>
              <div
                style={{
                  padding: "28px 20px",
                  borderRadius: "16px",
                  background: "#fff",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                  textAlign: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 102, 204, 0.15)";
                  e.currentTarget.style.borderColor = "#0066cc30";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0066cc15 0%, #0077e615 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <span style={{
                    fontSize: "22px",
                    color: "#0066cc",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {metric.icon}
                  </span>
                </div>
                <Text
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  {metric.value}
                </Text>
                <Text style={{ fontSize: "14px", color: "#64748b" }}>
                  {metric.label}
                </Text>
              </div>
            </Col>
          ))}
        </Row>

        {/* Features Grid */}
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <GlassCard
                intensity="medium"
                style={{
                  height: "100%",
                  padding: "32px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 40px ${feature.gradient === "purple" ? "rgba(0, 102, 204, 0.2)" : feature.gradient === "blue" ? "rgba(59, 130, 246, 0.2)" : "rgba(79, 172, 254, 0.2)"}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: featureColors[feature.gradient],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                    fontSize: "24px",
                    color: "#fff",
                  }}
                >
                  {feature.icon}
                </div>
                <Title level={4} style={{ marginBottom: "12px", fontSize: "18px" }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: "#64748b", marginBottom: "16px", lineHeight: 1.6, fontSize: "14px" }}>
                  {feature.description}
                </Paragraph>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {feature.details.map((detail, idx) => (
                    <Text
                      key={idx}
                      style={{
                        fontSize: "12px",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: "rgba(0, 102, 204, 0.08)",
                        color: "#0066cc",
                        fontWeight: 500,
                      }}
                    >
                      {detail}
                    </Text>
                  ))}
                </div>
              </GlassCard>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default Features;

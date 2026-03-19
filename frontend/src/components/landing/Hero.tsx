"use client";

import React from "react";
import { Button, Space, Typography } from "antd";
import {
  ArrowRightOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import GlassCard from "@/components/ui/GlassCard";

const { Title, Paragraph, Text } = Typography;

/**
 * Hero Section - Commercial SaaS Landing Page Hero
 *
 * Features a large headline, gradient text, CTAs, and feature highlights.
 */
export const Hero: React.FC = () => {
  return (
    <section
      style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "60px 24px",
        background: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 102, 204, 0.25), transparent),
          radial-gradient(ellipse 60% 40% at 80% 50%, rgba(0, 168, 232, 0.15), transparent),
          radial-gradient(ellipse 60% 40% at 20% 80%, rgba(0, 136, 255, 0.15), transparent)
        `,
      }}
    >
      {/* Animated gradient orbs */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 102, 204, 0.15) 0%, transparent 70%)",
          top: "-200px",
          left: "-200px",
          filter: "blur(60px)",
          animation: "float 20s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 168, 232, 0.15) 0%, transparent 70%)",
          bottom: "-150px",
          right: "-150px",
          filter: "blur(60px)",
          animation: "float 25s ease-in-out infinite reverse",
        }}
      />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 16px",
            borderRadius: "20px",
            background: "rgba(0, 102, 204, 0.08)",
            border: "1px solid rgba(0, 102, 204, 0.2)",
            marginBottom: "24px",
          }}
        >
          <ThunderboltOutlined style={{ color: "#0066cc", marginRight: "8px" }} />
          <Text style={{ color: "#0066cc", fontWeight: 500 }}>
            Enterprise-Grade Time Series Database
          </Text>
        </div>

        {/* Main Headline */}
        <Title
          level={1}
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "24px",
            background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #00a8e8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          IoTDB Enhanced
        </Title>

        <Title
          level={2}
          style={{
            fontSize: "clamp(24px, 4vw, 42px)",
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: "24px",
            color: "#1e293b",
          }}
        >
          Real-Time Analytics at
          <span style={{ color: "#0066cc" }}> Any Scale</span>
        </Title>

        <Paragraph
          style={{
            fontSize: "18px",
            color: "#64748b",
            maxWidth: "600px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          High-performance time series data platform with built-in anomaly detection,
          forecasting, and real-time monitoring. Trusted by enterprises worldwide.
        </Paragraph>

        {/* CTA Buttons */}
        <Space size="middle" style={{ marginBottom: "60px" }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            style={{
              height: "52px",
              padding: "0 32px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
              border: "none",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.35)",
            }}
            href="/register"
          >
            Get Started Free
          </Button>
          <Button
            size="large"
            style={{
              height: "52px",
              padding: "0 32px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "12px",
              border: "2px solid #e2e8f0",
              background: "rgba(255, 255, 255, 0.8)",
            }}
            href="#features"
          >
            View Demo
          </Button>
        </Space>

        {/* Feature Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginTop: "40px",
          }}
        >
          <GlassCard intensity="medium" style={{ padding: "24px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <ThunderboltOutlined style={{ fontSize: "24px", color: "#fff" }} />
            </div>
            <Title level={4} style={{ marginBottom: "8px" }}>
              Lightning Fast
            </Title>
            <Paragraph style={{ color: "#64748b", margin: 0 }}>
              Millions of data points processed per second with sub-millisecond latency
            </Paragraph>
          </GlassCard>

          <GlassCard intensity="medium" style={{ padding: "24px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <LineChartOutlined style={{ fontSize: "24px", color: "#fff" }} />
            </div>
            <Title level={4} style={{ marginBottom: "8px" }}>
              AI-Powered Insights
            </Title>
            <Paragraph style={{ color: "#64748b", margin: 0 }}>
              Built-in anomaly detection and forecasting powered by machine learning
            </Paragraph>
          </GlassCard>

          <GlassCard intensity="medium" style={{ padding: "24px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <SafetyOutlined style={{ fontSize: "24px", color: "#fff" }} />
            </div>
            <Title level={4} style={{ marginBottom: "8px" }}>
              Enterprise Security
            </Title>
            <Paragraph style={{ color: "#64748b", margin: 0 }}>
              End-to-end encryption, role-based access control, and audit logs
            </Paragraph>
          </GlassCard>
        </div>
      </div>

      {/* Add keyframes for floating animation */}
      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, -30px);
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;

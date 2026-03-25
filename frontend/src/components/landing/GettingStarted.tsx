"use client";

import React from "react";
import { Typography, Row, Col, Button } from "antd";
import {
  CheckCircleOutlined,
  RocketOutlined,
  CloudServerOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Create Your Account",
    description: "Sign up for a free account and set up your organization. No credit card required for the trial period.",
    icon: <RocketOutlined />,
    color: "#0066cc",
  },
  {
    number: 2,
    title: "Connect Your Data",
    description: "Connect your existing IoTDB instance or start fresh. Import data from CSV, JSON, or use our REST API.",
    icon: <CloudServerOutlined />,
    color: "#3b82f6",
  },
  {
    number: 3,
    title: "Configure & Customize",
    description: "Set up alerts, create dashboards, and configure AI models for forecasting and anomaly detection.",
    icon: <SettingOutlined />,
    color: "#8b5cf6",
  },
  {
    number: 4,
    title: "Scale & Automate",
    description: "Enable automated monitoring, set up API integrations, and scale your infrastructure as needed.",
    icon: <ThunderboltOutlined />,
    color: "#f59e0b",
  },
];

const features = [
  "5-minute quick start setup",
  "Interactive tutorials and guides",
  "Pre-built dashboard templates",
  "Sample datasets to explore",
  "24/7 community support",
  "Comprehensive API documentation",
];

export default function GettingStarted() {
  return (
    <section
      style={{
        padding: "100px 24px",
        background: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0066cc10 0%, #0077e610 100%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "linear-gradient(135deg, #0066cc15 0%, #0077e615 100%)",
              borderRadius: "3px",
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
              QUICK START
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
            Get Started in Minutes
          </Title>
          <Text style={{ fontSize: "18px", color: "#64748b" }}>
            Set up your time series database platform quickly with our streamlined onboarding process
          </Text>
        </div>

        {/* Steps */}
        <Row gutter={[32, 48]} style={{ marginBottom: "80px" }}>
          {steps.map((step, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <div
                style={{
                  position: "relative",
                  height: "100%",
                }}
              >
                {/* Step Number */}
                <div
                  style={{
                    position: "absolute",
                    top: "-20px",
                    left: "20px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)`,
                    color: "#fff",
                    fontSize: "18px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    boxShadow: `0 4px 12px ${step.color}40`,
                  }}
                >
                  {step.number}
                </div>

                {/* Step Card */}
                <div
                  style={{
                    padding: "32px 24px 24px",
                    borderRadius: "6px",
                    background: "#fff",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                    height: "100%",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 8px 30px ${step.color}20`;
                    e.currentTarget.style.borderColor = `${step.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.05)";
                    e.currentTarget.style.borderColor = "#f1f5f9";
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "4px",
                      background: `linear-gradient(135deg, ${step.color}15 0%, ${step.color}10 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <span style={{
                      fontSize: "24px",
                      color: step.color,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {step.icon}
                    </span>
                  </div>
                  <Title
                    level={4}
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      marginBottom: "12px",
                      color: "#1e293b",
                    }}
                  >
                    {step.title}
                  </Title>
                  <Text style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6" }}>
                    {step.description}
                  </Text>
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && window.innerWidth >= 992 && (
                  <div
                    style={{
                      position: "absolute",
                      right: "-16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#cbd5e1",
                      fontSize: "20px",
                    }}
                  >
                    <ArrowRightOutlined />
                  </div>
                )}
              </div>
            </Col>
          ))}
        </Row>

        {/* Features List */}
        <Row gutter={[16, 16]} style={{ maxWidth: "900px", margin: "0 auto 48px" }}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 20px",
                  borderRadius: "4px",
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                }}
              >
                <CheckCircleOutlined style={{ color: "#10b981", fontSize: "18px" }} />
                <Text style={{ color: "#475569", fontSize: "15px", fontWeight: 500 }}>
                  {feature}
                </Text>
              </div>
            </Col>
          ))}
        </Row>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Button
            size="large"
            type="primary"
            style={{
              height: "56px",
              padding: "0 48px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "4px",
              background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
              border: "none",
              boxShadow: "0 4px 20px rgba(0, 102, 204, 0.35)",
            }}
            href="/register"
          >
            Start Your Free Trial
          </Button>
          <div style={{ marginTop: "16px" }}>
            <Text style={{ color: "#64748b", fontSize: "14px" }}>
              No credit card required • 14-day free trial • Cancel anytime
            </Text>
          </div>
        </div>
      </div>
    </section>
  );
}

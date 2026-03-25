"use client";

import React from "react";
import { Row, Col, Typography, Button, Space, Divider } from "antd";
import {
  CheckOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import GlassCard from "@/components/ui/GlassCard";

const { Title, Paragraph, Text } = Typography;

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
  gradient: "purple" | "blue" | "sunset";
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    features: [
      "10,000 data points",
      "Basic analytics",
      "Community support",
      "1 user seat",
      "7-day data retention",
    ],
    cta: "Start Free",
    gradient: "blue",
  },
  {
    name: "Pro",
    description: "For growing teams",
    price: "$49",
    period: "per month",
    popular: true,
    features: [
      "1 million data points",
      "Advanced analytics",
      "Anomaly detection",
      "Email support",
      "10 user seats",
      "30-day data retention",
      "API access",
      "Custom dashboards",
    ],
    cta: "Start Free Trial",
    gradient: "purple",
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    period: "contact us",
    features: [
      "Unlimited data points",
      "Enterprise analytics",
      "AI-powered forecasting",
      "24/7 priority support",
      "Unlimited user seats",
      "Unlimited data retention",
      "Advanced API features",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    gradient: "sunset",
  },
];

const planColors = {
  purple: "#0066CC",
  blue: "#3B82F6",
  sunset: "#0EA5E9",
};

/**
 * Pricing Section - Display pricing tiers
 */
export const Pricing: React.FC = () => {
  return (
    <section
      style={{
        padding: "100px 24px",
        background: "#f8fafc",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <Text
            style={{
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#0066cc",
            }}
          >
            Pricing
          </Text>
          <Title
            level={2}
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              marginTop: "16px",
              marginBottom: "16px",
            }}
          >
            Simple, Transparent Pricing
          </Title>
          <Paragraph
            style={{
              fontSize: "18px",
              color: "#64748b",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Choose the plan that fits your needs. Scale as you grow.
          </Paragraph>
        </div>

        {/* Pricing Cards */}
        <Row gutter={[24, 24]} align="stretch">
          {plans.map((plan, index) => (
            <Col xs={24} md={8} key={index}>
              <GlassCard
                intensity={plan.popular ? "heavy" : "medium"}
                style={{
                  height: "100%",
                  padding: plan.popular ? "40px 32px" : "32px",
                  position: "relative",
                  border: plan.popular ? "2px solid" : undefined,
                  borderColor: plan.popular ? "#0066cc" : undefined,
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: planColors.purple,
                      color: "#fff",
                      padding: "4px 16px",
                      borderRadius: "3px",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <ThunderboltOutlined />
                    Most Popular
                  </div>
                )}

                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <Title level={3} style={{ marginBottom: "8px" }}>
                    {plan.name}
                  </Title>
                  <Text type="secondary">{plan.description}</Text>
                </div>

                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <Text
                    style={{
                      fontSize: "48px",
                      fontWeight: 700,
                      color: planColors[plan.gradient],
                    }}
                  >
                    {plan.price}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: "4px" }}>
                    /{plan.period}
                  </Text>
                </div>

                <Divider style={{ margin: "0 0 24px" }} />

                <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: "32px" }}>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start" }}>
                      <CheckOutlined
                        style={{
                          color: "#0066cc",
                          marginRight: "12px",
                          marginTop: "4px",
                        }}
                      />
                      <Text style={{ fontSize: "15px" }}>{feature}</Text>
                    </div>
                  ))}
                </Space>

                <Button
                  type={plan.popular ? "primary" : "default"}
                  size="large"
                  block
                  icon={plan.popular ? <ArrowRightOutlined /> : undefined}
                  style={{
                    height: "48px",
                    fontSize: "16px",
                    fontWeight: 600,
                    borderRadius: "4px",
                    ...(plan.popular
                      ? {
                          background: planColors.purple,
                          border: "none",
                        }
                      : {}),
                  }}
                >
                  {plan.cta}
                </Button>
              </GlassCard>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default Pricing;

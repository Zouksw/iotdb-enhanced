"use client";

import React, { useState } from "react";
import { Typography, Row, Col } from "antd";
import {
  QuestionCircleOutlined,
  ThunderboltOutlined,
  SecurityScanOutlined,
  CloudServerOutlined,
  ApiOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: "What is IoTDB Enhanced?",
    answer: "IoTDB Enhanced is an enterprise-grade time series database platform built on Apache IoTDB. It provides real-time analytics, AI-powered forecasting, anomaly detection, and a modern web interface for managing your IoT data at scale.",
    icon: <CloudServerOutlined />,
  },
  {
    question: "How does AI-powered forecasting work?",
    answer: "Our platform uses multiple machine learning algorithms including ARIMA, Prophet, LSTM, and Transformer models. You can train models on your historical time series data and generate accurate predictions with confidence intervals.",
    icon: <ThunderboltOutlined />,
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We implement enterprise-grade security including encryption at rest and in transit, role-based access control (RBAC), API key management, and secure session management.",
    icon: <SecurityScanOutlined />,
  },
  {
    question: "Can I integrate with my existing systems?",
    answer: "Yes. IoTDB Enhanced provides a RESTful API, WebSocket support for real-time updates, and native IoTDB protocol compatibility. You can also use our SDKs and integrate with popular data pipelines.",
    icon: <ApiOutlined />,
  },
  {
    question: "What deployment options are available?",
    answer: "You can deploy on any cloud platform (AWS, GCP, Azure) using managed services like AWS RDS, ElastiCache, or Cloud SQL. We provide comprehensive deployment guides for Docker, Kubernetes, and traditional VM setups.",
    icon: <CloudServerOutlined />,
  },
  {
    question: "Do you offer enterprise support?",
    answer: "Yes. Our Enterprise plan includes dedicated support, SLA guarantees, custom integrations, and priority access to new features. Contact our sales team for more information.",
    icon: <TeamOutlined />,
  },
];

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      style={{
        padding: "100px 24px",
        background: "#FFFFFF",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "rgba(0, 102, 204, 0.08)",
              borderRadius: "3px",
              marginBottom: "16px",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#0066CC",
              }}
            >
              FAQ
            </Text>
          </div>
          <Title
            level={2}
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 600,
              lineHeight: 1.25,
              marginBottom: "16px",
              color: "#111827",
            }}
          >
            Frequently Asked Questions
          </Title>
          <Text style={{ fontSize: "18px", color: "#64748b" }}>
            Everything you need to know about IoTDB Enhanced
          </Text>
        </div>

        {/* FAQ Items */}
        <Row gutter={[16, 16]}>
          {faqs.map((faq, index) => (
            <Col xs={24} key={index}>
              <div
                onClick={() => toggleFAQ(index)}
                style={{
                  padding: "24px",
                  borderRadius: "6px",
                  background: expandedIndex === index
                    ? "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)"
                    : "#fff",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  border: expandedIndex === index
                    ? "none"
                    : "1px solid rgba(0, 0, 0, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "4px",
                      background: expandedIndex === index
                        ? "rgba(255, 255, 255, 0.2)"
                        : "linear-gradient(135deg, #0066cc15 0%, #0077e615 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{
                      fontSize: "20px",
                      color: expandedIndex === index ? "#fff" : "#0066cc",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {faq.icon}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text
                      strong
                      style={{
                        fontSize: "18px",
                        color: expandedIndex === index ? "#fff" : "#1e293b",
                        display: "block",
                        marginBottom: expandedIndex === index ? "12px" : "0",
                      }}
                    >
                      {faq.question}
                    </Text>
                    {expandedIndex === index && (
                      <Text
                        style={{
                          fontSize: "16px",
                          color: "rgba(255, 255, 255, 0.9)",
                          lineHeight: "1.6",
                          display: "block",
                        }}
                      >
                        {faq.answer}
                      </Text>
                    )}
                  </div>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: expandedIndex === index
                        ? "rgba(255, 255, 255, 0.2)"
                        : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: "auto",
                      transition: "transform 0.3s ease",
                      transform: expandedIndex === index ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 4L6 8L10 4"
                        stroke={expandedIndex === index ? "#fff" : "#64748b"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Contact CTA */}
        <div
          style={{
            marginTop: "48px",
            textAlign: "center",
            padding: "32px",
            borderRadius: "6px",
            background: "#fff",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Title level={4} style={{ marginBottom: "12px" }}>
            Still have questions?
          </Title>
          <Text style={{ color: "#64748b", fontSize: "16px" }}>
            Contact our support team for personalized assistance
          </Text>
        </div>
      </div>
    </section>
  );
}

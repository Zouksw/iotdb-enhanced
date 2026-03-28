"use client";

import React from "react";
import { Button, Typography, Col, Row, Divider } from "antd";
import { ArrowUpOutlined, GithubOutlined, TwitterOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";

// Lazy load sections for better performance
const Hero = dynamic(() => import("@/components/landing/Hero"), {
  loading: () => <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>Loading...</div>,
  ssr: true,
});
const Features = dynamic(() => import("@/components/landing/Features"), {
  loading: () => <div style={{ height: "200px" }} />,
  ssr: false,
});
const GettingStarted = dynamic(() => import("@/components/landing/GettingStarted"), {
  loading: () => <div style={{ height: "200px" }} />,
  ssr: false,
});
const FAQ = dynamic(() => import("@/components/landing/FAQ"), {
  loading: () => <div style={{ height: "200px" }} />,
  ssr: false,
});

const { Title, Text, Paragraph } = Typography;

/**
 * Landing Page - Commercial SaaS Marketing Homepage
 *
 * A modern, professional landing page showcasing IoTDB Enhanced
 * with hero section, features, pricing, FAQ, and getting started guide.
 */
export default function LandingPage() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* Navigation (simple) */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
                fontWeight: 700,
                color: "#fff",
                fontSize: "18px",
              }}
            >
              I
            </div>
            <Text strong style={{ fontSize: "18px" }}>
              IoTDB Enhanced
            </Text>
          </div>

          <nav style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <a
              href="#features"
              style={{ color: "#64748b", textDecoration: "none", fontWeight: 500 }}
            >
              Features
            </a>
            <a
              href="#pricing"
              style={{ color: "#64748b", textDecoration: "none", fontWeight: 500 }}
            >
              Pricing
            </a>
            <a
              href="#faq"
              style={{ color: "#64748b", textDecoration: "none", fontWeight: 500 }}
            >
              FAQ
            </a>
            <Button
              type="primary"
              style={{
                background: "#0066CC",
                border: "none",
                borderRadius: "3px",
                height: "40px",
                padding: "0 20px",
              }}
              href="/register"
            >
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Pricing Section - Temporarily hidden */}
      {/* <Pricing /> */}

      {/* Getting Started Section */}
      <GettingStarted />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section
        style={{
          padding: "clamp(60px, 8vw, 100px) 24px",
          background: "#0066CC",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Title
            level={2}
            style={{
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "20px",
            }}
          >
            Ready to Get Started?
          </Title>
          <Paragraph
            style={{
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.9)",
              marginBottom: "32px",
            }}
          >
            Join thousands of teams already using IoTDB Enhanced to power their time
            series data platform.
          </Paragraph>
          <Button
            size="large"
            style={{
              height: "52px",
              padding: "0 40px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "4px",
              background: "#fff",
              color: "#0066cc",
              border: "none",
            }}
            href="/register"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "clamp(32px, 5vw, 60px) 24px",
          background: "#0f172a",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Row gutter={[48, 48]}>
            <Col xs={24} md={8}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "4px",
                    background: "#0066CC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                    fontWeight: 700,
                    fontSize: "18px",
                  }}
                >
                  I
                </div>
                <Text strong style={{ fontSize: "18px", color: "#fff" }}>
                  IoTDB Enhanced
                </Text>
              </div>
              <Paragraph style={{ color: "#94a3b8", marginBottom: "16px" }}>
                Enterprise-grade time series database platform with real-time analytics
                and AI-powered insights.
              </Paragraph>
              <div style={{ display: "flex", gap: "16px" }}>
                <GithubOutlined style={{ fontSize: "20px", color: "#94a3b8", cursor: "pointer" }} />
                <TwitterOutlined style={{ fontSize: "20px", color: "#94a3b8", cursor: "pointer" }} />
              </div>
            </Col>

            <Col xs={24} sm={8} md={4}>
              <Title level={5} style={{ fontSize: "16px", color: "#fff", marginBottom: "16px" }}>
                Product
              </Title>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: "8px" }}>
                  <a href="#features" style={{ color: "#94a3b8", textDecoration: "none" }}>
                    Features
                  </a>
                </li>
                {/* Hidden temporarily
                <li style={{ marginBottom: "8px" }}>
                  <a href="#pricing" style={{ color: "#94a3b8", textDecoration: "none" }}>
                    Pricing
                  </a>
                </li>
                */}
                <li style={{ marginBottom: "8px" }}>
                  <a href="#faq" style={{ color: "#94a3b8", textDecoration: "none" }}>
                    FAQ
                  </a>
                </li>
              </ul>
            </Col>


          </Row>

          <Divider style={{ borderColor: "#1e293b", margin: "40px 0 24px" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <Text style={{ color: "#64748b", fontSize: "14px" }}>
              © 2025 IoTDB Enhanced. All rights reserved.
            </Text>
            <Button
              type="text"
              icon={<ArrowUpOutlined />}
              onClick={scrollToTop}
              style={{ color: "#94a3b8" }}
            >
              Back to Top
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React from "react";
import { Button, Typography } from "antd";
import { useRouter } from "next/navigation";
import {
  ExclamationCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          linear-gradient(135deg, #fa709a 0%, #fee140 100%)
        `,
        padding: "24px",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
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
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
          bottom: "-150px",
          right: "-150px",
          filter: "blur(60px)",
          animation: "float 25s ease-in-out infinite reverse",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "600px",
          textAlign: "center",
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "30px",
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <ExclamationCircleOutlined style={{ fontSize: "60px", color: "#fff" }} />
        </div>

        {/* Title */}
        <Title
          level={1}
          style={{
            color: "#fff",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            marginBottom: "16px",
            lineHeight: 1.2,
          }}
        >
          Application Error
        </Title>

        {/* Description */}
        <Paragraph
          style={{
            fontSize: "18px",
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: "40px",
            lineHeight: 1.6,
          }}
        >
          Something went wrong while loading this page. Please try again or
          contact support if the problem persists.
        </Paragraph>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(10px)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "32px",
              textAlign: "left",
            }}
          >
            <Paragraph
              style={{
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.8)",
                margin: 0,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </Paragraph>
            {error.digest && (
              <Paragraph
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.6)",
                  margin: "8px 0 0 0",
                  fontFamily: "monospace",
                }}
              >
                Error ID: {error.digest}
              </Paragraph>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            style={{
              height: "48px",
              padding: "0 32px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "8px",
              background: "#fff",
              color: "#fa709a",
              border: "none",
            }}
            onClick={() => reset()}
          >
            Try Again
          </Button>
          <Button
            size="large"
            icon={<HomeOutlined />}
            style={{
              height: "48px",
              padding: "0 32px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
            onClick={() => router.push("/")}
          >
            Go Home
          </Button>
        </div>

        {/* Additional Help */}
        <div style={{ marginTop: "48px" }}>
          <Paragraph
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.8)",
              marginBottom: "16px",
            }}
          >
            Need help? Here are some useful links:
          </Paragraph>
          <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/dashboard"
              style={{
                fontSize: "14px",
                color: "#fff",
                textDecoration: "none",
                opacity: 0.9,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
            >
              Dashboard
            </a>
            <a
              href="/login"
              style={{
                fontSize: "14px",
                color: "#fff",
                textDecoration: "none",
                opacity: 0.9,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
            >
              Login
            </a>
            <a
              href="https://github.com/your-repo/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "14px",
                color: "#fff",
                textDecoration: "none",
                opacity: 0.9,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
            >
              Report Issue
            </a>
          </div>
        </div>
      </div>

      {/* Add animation keyframes */}
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
    </div>
  );
}

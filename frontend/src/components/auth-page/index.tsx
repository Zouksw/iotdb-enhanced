/**
 * Auth Page Component - Main Router
 *
 * Routes to appropriate form based on auth type.
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, Typography, theme } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import { getTitle, getDescription } from "./auth-helpers";
import type { AuthPageProps } from "./auth-types";

const { Link, Title, Text } = Typography;

export function AuthPage(props: AuthPageProps) {
  const { token } = theme.useToken();
  const router = useRouter();

  const renderFooter = () => {
    switch (props.type) {
      case "login":
        return (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>
              Don't have an account?{" "}
              <Link
                onClick={() => router.push("/register")}
                style={{ cursor: "pointer", fontWeight: 500 }}
              >
                Sign up
              </Link>
            </Text>
            <br />
            <Link
              onClick={() => router.push("/forgot-password")}
              style={{
                cursor: "pointer",
                fontSize: 14,
                color: token.colorTextSecondary,
              }}
            >
              Forgot password?
            </Link>
          </div>
        );
      case "register":
        return (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>
              Already have an account?{" "}
              <Link
                onClick={() => router.push("/login")}
                style={{ cursor: "pointer", fontWeight: 500 }}
              >
                Sign in
              </Link>
            </Text>
          </div>
        );
      case "forgotPassword":
        return (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link
              onClick={() => router.push("/login")}
              style={{
                cursor: "pointer",
                fontSize: 14,
                color: token.colorTextSecondary,
              }}
            >
              ← Back to login
            </Link>
          </div>
        );
      case "updatePassword":
        return (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link
              onClick={() => router.push("/login")}
              style={{
                cursor: "pointer",
                fontSize: 14,
                color: token.colorTextSecondary,
              }}
            >
              ← Back to login
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  const renderForm = () => {
    switch (props.type) {
      case "login":
        return <LoginForm />;
      case "register":
        return <RegisterForm />;
      case "forgotPassword":
        return <ForgotPasswordForm />;
      case "updatePassword":
        return <UpdatePasswordForm token={(props as { token?: string }).token || ""} />;
      default:
        return <LoginForm />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F9FAFB",
        padding: token.paddingLG,
      }}
    >
      {/* Main Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
        }}
      >
        <Card
          variant="borderless"
          style={{
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              padding: "32px 32px 16px 32px",
              textAlign: "center",
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 20px",
                borderRadius: 6,
                background: "#0066CC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0, 102, 204, 0.2)",
              }}
            >
              <DatabaseOutlined style={{ fontSize: 32, color: "#fff" }} />
            </div>

            <Title
              level={2}
              style={{
                margin: "0 0 8px 0",
                fontWeight: 600,
                color: "#111827",
                fontSize: 24,
              }}
            >
              {getTitle(props.type)}
            </Title>

            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                display: "block",
              }}
            >
              {getDescription(props.type)}
            </Text>
          </div>

          {/* Form Section */}
          <div style={{ padding: "16px 32px 32px 32px" }}>
            {renderForm()}
            {renderFooter()}
          </div>
        </Card>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "#9CA3AF",
            fontSize: 13,
          }}
        >
          IoTDB Enhanced - Time Series Data Management Platform
        </div>
      </div>
    </div>
  );
}

export default AuthPage;

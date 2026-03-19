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
        background: `linear-gradient(135deg, #0066cc 0%, #0077e6 35%, #0088ff 70%, #00a8e8 100%)`,
        padding: token.paddingLG,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          top: -200,
          left: -200,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          bottom: -150,
          right: -150,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

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
          style={{
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              padding: "40px 40px 20px 40px",
              textAlign: "center",
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 80,
                height: 80,
                margin: "0 auto 24px",
                borderRadius: 20,
                background: "linear-gradient(135deg, #0066cc 0%, #00a8e8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0, 102, 204, 0.35)",
              }}
            >
              <DatabaseOutlined style={{ fontSize: 40, color: "#fff" }} />
            </div>

            <Title
              level={2}
              style={{
                margin: "0 0 8px 0",
                fontWeight: 700,
                color: token.colorText,
                fontSize: 28,
              }}
            >
              {getTitle(props.type)}
            </Title>

            <Text
              style={{
                fontSize: 14,
                color: token.colorTextSecondary,
                display: "block",
              }}
            >
              {getDescription(props.type)}
            </Text>
          </div>

          {/* Form Section */}
          <div style={{ padding: "20px 40px 40px 40px" }}>
            {renderForm()}
            {renderFooter()}
          </div>
        </Card>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            color: "rgba(255, 255, 255, 0.8)",
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

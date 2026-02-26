"use client";

import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message, Typography } from "antd";
import { useRouter } from "next/navigation";
import { Card, theme } from "antd";

const { Link, Title, Text } = Typography;
import Cookies from "js-cookie";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002/api";

interface AuthPageProps {
  type: "login" | "register" | "forgotPassword" | "updatePassword";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * AuthPage - Modern authentication pages with beautiful gradient design
 */
export const AuthPage = (props: AuthPageProps) => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  // Get title based on auth type
  const getTitle = () => {
    switch (props.type) {
      case "login":
        return "Welcome Back";
      case "register":
        return "Create Account";
      case "forgotPassword":
        return "Reset Password";
      case "updatePassword":
        return "Update Password";
      default:
        return "IoTDB Enhanced";
    }
  };

  const getDescription = () => {
    switch (props.type) {
      case "login":
        return "Sign in to your account to continue";
      case "register":
        return "Join us to manage your time series data";
      case "forgotPassword":
        return "Enter your email to reset your password";
      case "updatePassword":
        return "Create a new secure password";
      default:
        return "";
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: { "Content-Type": "application/json" },
      });

      if (props.type === "login") {
        const response = await axiosInstance.post("/auth/login", {
          email: values.email,
          password: values.password,
        });

        const { user, token: authToken } = response.data;
        Cookies.set("auth", JSON.stringify({ ...user, token: authToken }), {
          expires: values.remember ? 30 : 7,
          path: "/",
        });

        message.success("Login successful!");
        setTimeout(() => router.push("/"), 500);
      } else if (props.type === "register") {
        const response = await axiosInstance.post("/auth/register", {
          email: values.email,
          password: values.password,
          name: values.name || "",
        });

        const { user, token: authToken } = response.data;
        Cookies.set("auth", JSON.stringify({ ...user, token: authToken }), {
          expires: 30,
          path: "/",
        });

        message.success("Registration successful!");
        setTimeout(() => router.push("/"), 500);
      } else if (props.type === "forgotPassword") {
        await axiosInstance.post("/auth/forgot-password", {
          email: values.email,
        });
        message.success("Password reset email sent!");
      } else if (props.type === "updatePassword") {
        await axiosInstance.post("/auth/reset-password", {
          token: props.token || "",
          password: values.password,
        });
        message.success("Password updated successfully!");
        setTimeout(() => router.push("/login"), 500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Authentication failed";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    height: 48,
    borderRadius: 12,
    border: "1px solid rgba(0, 0, 0, 0.08)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
  };

  const buttonStyle = {
    height: 50,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
    transition: "all 0.3s ease",
  };

  const renderLoginForm = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Please enter your email" },
          { type: "email", message: "Invalid email format" },
        ]}
      >
        <Input
          placeholder="your.email@example.com"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              ✉️
            </span>
          }
        />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please enter your password" }]}
      >
        <Input.Password
          placeholder="Enter your password"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              🔐
            </span>
          }
        />
      </Form.Item>

      <Form.Item>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>
              Remember me
            </Checkbox>
          </Form.Item>
          <Link
            onClick={() => router.push("/forgot-password")}
            style={{ cursor: "pointer", fontWeight: 500 }}
          >
            Forgot password?
          </Link>
        </div>
      </Form.Item>

      <Form.Item style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          style={buttonStyle}
        >
          Sign In
        </Button>
      </Form.Item>

      <div style={{ textAlign: "center" }}>
        <Text>
          Don't have an account?{" "}
          <Link
            onClick={() => router.push("/register")}
            style={{ cursor: "pointer", fontWeight: 600 }}
          >
            Sign up
          </Link>
        </Text>
      </div>
    </Form>
  );

  const renderRegisterForm = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Full Name"
        name="name"
        rules={[{ required: true, message: "Please enter your name" }]}
      >
        <Input
          placeholder="John Doe"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              👤
            </span>
          }
        />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Please enter your email" },
          { type: "email", message: "Invalid email format" },
        ]}
      >
        <Input
          placeholder="your.email@example.com"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              ✉️
            </span>
          }
        />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: "Please enter your password" },
          { min: 6, message: "Password must be at least 6 characters" },
        ]}
      >
        <Input.Password
          placeholder="Enter your password"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              🔐
            </span>
          }
        />
      </Form.Item>

      <Form.Item
        label="Confirm Password"
        name="confirmPassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "Please confirm your password" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Passwords do not match"));
            },
          }),
        ]}
      >
        <Input.Password
          placeholder="Confirm your password"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              🔐
            </span>
          }
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          style={buttonStyle}
        >
          Create Account
        </Button>
      </Form.Item>

      <div style={{ textAlign: "center" }}>
        <Text>
          Already have an account?{" "}
          <Link
            onClick={() => router.push("/login")}
            style={{ cursor: "pointer", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </Text>
      </div>
    </Form>
  );

  const renderForgotPasswordForm = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Please enter your email" },
          { type: "email", message: "Invalid email format" },
        ]}
      >
        <Input
          placeholder="your.email@example.com"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              ✉️
            </span>
          }
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          style={buttonStyle}
        >
          Send Reset Link
        </Button>
      </Form.Item>

      <div style={{ textAlign: "center" }}>
        <Link
          onClick={() => router.push("/login")}
          style={{ cursor: "pointer", fontWeight: 500 }}
        >
          ← Back to login
        </Link>
      </div>
    </Form>
  );

  const renderUpdatePasswordForm = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label="New Password"
        name="password"
        rules={[
          { required: true, message: "Please enter your new password" },
          { min: 6, message: "Password must be at least 6 characters" },
        ]}
      >
        <Input.Password
          placeholder="Enter your new password"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              🔐
            </span>
          }
        />
      </Form.Item>

      <Form.Item
        label="Confirm New Password"
        name="confirmPassword"
        dependencies={["password"]}
        rules={[
          { required: true, message: "Please confirm your password" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Passwords do not match"));
            },
          }),
        ]}
      >
        <Input.Password
          placeholder="Confirm your new password"
          size="large"
          style={inputStyle}
          prefix={
            <span style={{ fontSize: 18, marginRight: 8 }}>
              🔐
            </span>
          }
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          style={buttonStyle}
        >
          Update Password
        </Button>
      </Form.Item>

      <div style={{ textAlign: "center" }}>
        <Link
          onClick={() => router.push("/login")}
          style={{ cursor: "pointer", fontWeight: 500 }}
        >
          ← Back to login
        </Link>
      </div>
    </Form>
  );

  const renderForm = () => {
    switch (props.type) {
      case "login":
        return renderLoginForm();
      case "register":
        return renderRegisterForm();
      case "forgotPassword":
        return renderForgotPasswordForm();
      case "updatePassword":
        return renderUpdatePasswordForm();
      default:
        return renderLoginForm();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`,
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
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.35)",
              }}
            >
              📊
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
              {getTitle()}
            </Title>

            <Text
              style={{
                fontSize: 14,
                color: token.colorTextSecondary,
                display: "block",
              }}
            >
              {getDescription()}
            </Text>
          </div>

          {/* Form Section */}
          <div style={{ padding: "20px 40px 40px 40px" }}>
            {renderForm()}
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
};

export default AuthPage;

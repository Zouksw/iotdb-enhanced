/**
 * Login Form Component
 */

"use client";

import React from "react";
import { Form, Input, Checkbox, message, Button } from "antd";
import { useRouter } from "next/navigation";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";

import { inputStyle, buttonStyle, API_URL } from "./auth-helpers";
import { validationRules, required } from "@/lib/validation";
import { sanitizer } from "@/lib/sanitizer";
import { errorHandler } from "@/lib/errorHandler";
import { csrfProtection } from "@/lib/csrf";
import { tokenManager } from "@/lib/tokenManager";

export function LoginForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      // Add CSRF token
      const csrfHeaders = csrfProtection.getHeaders();
      axiosInstance.defaults.headers.common = {
        ...axiosInstance.defaults.headers.common,
        ...csrfHeaders,
      };

      // Sanitize email
      const sanitizedEmail = sanitizer.sanitizeEmail(values.email as string);
      if (!sanitizedEmail) {
        message.error("Invalid email format");
        return;
      }

      const response = await axiosInstance.post("/auth/login", {
        email: sanitizedEmail,
        password: values.password,
        remember: values.remember,
      });

      const { user, token: authToken } = response.data;

      // Store token securely
      tokenManager.setToken(authToken, Boolean(values.remember));

      // Store non-sensitive user data
      const userData = {
        id: user.id,
        email: user.email,
        name: sanitizer.sanitizeString(user.name || "", 100),
        avatar: user.avatar,
        roles: user.roles || [],
      };

      Cookies.set("auth", JSON.stringify(userData), {
        expires: values.remember ? 30 : 7,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      message.success("Login successful!");
      setTimeout(() => router.push("/"), 500);
    } catch (error: unknown) {
      const safeError = errorHandler.handleApiError(error);
      message.error(safeError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        label={<span style={{ fontWeight: 500, color: "rgba(0, 0, 0, 0.85)" }}>Email</span>}
        name="email"
        rules={[
          validationRules.getAntRule(required("Email")),
          validationRules.getAntRule(validationRules.email),
        ]}
      >
        <Input
          placeholder="your.email@example.com"
          size="large"
          style={inputStyle}
          prefix={<MailOutlined style={{ fontSize: 18, color: "#0066cc" }} />}
          autoComplete="email"
        />
      </Form.Item>

      <Form.Item
        label={<span style={{ fontWeight: 500, color: "rgba(0, 0, 0, 0.85)" }}>Password</span>}
        name="password"
        rules={[validationRules.getAntRule(required("Password"))]}
      >
        <Input.Password
          placeholder="Enter your password"
          size="large"
          style={inputStyle}
          prefix={<LockOutlined style={{ fontSize: 18, color: "#0066cc" }} />}
          autoComplete="current-password"
        />
      </Form.Item>

      <Form.Item>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>Remember me for 30 days</Checkbox>
        </Form.Item>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={buttonStyle as React.CSSProperties}
          className="w-full"
          disabled={loading}
          loading={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </Form.Item>
    </Form>
  );
}

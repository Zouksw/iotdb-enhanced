/**
 * Register Form Component
 */

"use client";

import React from "react";
import { Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";

import { inputStyle, buttonStyle, API_URL } from "./auth-helpers";
import { validationRules, required, confirmation } from "@/lib/validation";
import { sanitizer } from "@/lib/sanitizer";
import { errorHandler } from "@/lib/errorHandler";
import { csrfProtection } from "@/lib/csrf";
import { tokenManager } from "@/lib/tokenManager";

export function RegisterForm() {
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

      // Sanitize inputs
      const sanitizedEmail = sanitizer.sanitizeEmail(values.email as string);
      const sanitizedName = sanitizer.sanitizeString(values.name as string || "", 100);

      if (!sanitizedEmail) {
        message.error("Invalid email format");
        return;
      }

      const response = await axiosInstance.post("/auth/register", {
        email: sanitizedEmail,
        password: values.password,
        name: sanitizedName,
      });

      const { user, token: authToken } = response.data;

      // Store token securely
      tokenManager.setToken(authToken);

      // Store non-sensitive user data
      const userData = {
        id: user.id,
        email: user.email,
        name: sanitizedName,
        avatar: user.avatar,
        roles: user.roles || [],
      };

      Cookies.set("auth", JSON.stringify(userData), {
        expires: 30,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      message.success("Registration successful!");
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
        label={<span style={{ fontWeight: 500, color: "rgba(0, 0, 0, 0.85)" }}>Full Name</span>}
        name="name"
        rules={[validationRules.getAntRule(required("Name"))]}
      >
        <Input
          placeholder="John Doe"
          size="large"
          style={inputStyle}
          prefix={<UserOutlined style={{ fontSize: 18, color: "#0066cc" }} />}
          autoComplete="name"
        />
      </Form.Item>

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
          placeholder="Create a strong password"
          size="large"
          style={inputStyle}
          prefix={<LockOutlined style={{ fontSize: 18, color: "#0066cc" }} />}
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item
        label={<span style={{ fontWeight: 500, color: "rgba(0, 0, 0, 0.85)" }}>Confirm Password</span>}
        name="confirmPassword"
        dependencies={["password"]}
        rules={[
          validationRules.getAntRule(required("Confirm Password")),
          validationRules.getAntRule(confirmation("password")),
        ]}
      >
        <Input.Password
          placeholder="Confirm your password"
          size="large"
          style={inputStyle}
          prefix={<LockOutlined style={{ fontSize: 18, color: "#0066cc" }} />}
          autoComplete="new-password"
        />
      </Form.Item>

      <Form.Item>
        <button
          type="submit"
          style={buttonStyle as React.CSSProperties}
          className="w-full text-white hover:opacity-90"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </Form.Item>
    </Form>
  );
}

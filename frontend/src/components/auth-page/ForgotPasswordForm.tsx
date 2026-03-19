/**
 * Forgot Password Form Component
 */

"use client";

import React from "react";
import { Form, Input, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import axios from "axios";

import { inputStyle, buttonStyle, API_URL } from "./auth-helpers";
import { validationRules, required } from "@/lib/validation";
import { sanitizer } from "@/lib/sanitizer";
import { errorHandler } from "@/lib/errorHandler";
import { csrfProtection } from "@/lib/csrf";

export function ForgotPasswordForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

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

      await axiosInstance.post("/auth/forgot-password", {
        email: sanitizedEmail,
      });

      message.success("Password reset email sent!");
      form.resetFields();
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

      <Form.Item>
        <button
          type="submit"
          style={buttonStyle as React.CSSProperties}
          className="w-full text-white hover:opacity-90"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </Form.Item>
    </Form>
  );
}

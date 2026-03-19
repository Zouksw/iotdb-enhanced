/**
 * Update Password Form Component
 */

"use client";

import React from "react";
import { Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { LockOutlined } from "@ant-design/icons";
import axios from "axios";

import { inputStyle, buttonStyle, API_URL } from "./auth-helpers";
import { validationRules, required, confirmation } from "@/lib/validation";
import { sanitizer } from "@/lib/sanitizer";
import { errorHandler } from "@/lib/errorHandler";
import { csrfProtection } from "@/lib/csrf";

export function UpdatePasswordForm({ token }: { token: string }) {
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

      await axiosInstance.post("/auth/reset-password", {
        token: sanitizer.sanitizeString(token, 500),
        password: values.password,
      });

      message.success("Password updated successfully!");
      setTimeout(() => router.push("/login"), 500);
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
        label={<span style={{ fontWeight: 500, color: "rgba(0, 0, 0, 0.85)" }}>New Password</span>}
        name="password"
        rules={[validationRules.getAntRule(required("Password"))]}
      >
        <Input.Password
          placeholder="Enter your new password"
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
          placeholder="Confirm your new password"
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
          {loading ? "Updating..." : "Update Password"}
        </button>
      </Form.Item>
    </Form>
  );
}

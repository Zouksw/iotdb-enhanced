/**
 * Auth Page Component - Main Router
 *
 * Routes to appropriate form based on auth type.
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, Typography } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import { getTitle, getDescription } from "./auth-helpers";
import type { AuthPageProps } from "./auth-types";

const { Link } = Typography;

export function AuthPage(props: AuthPageProps) {
  const router = useRouter();

  const renderFooter = () => {
    switch (props.type) {
      case "login":
        return (
          <div className="text-center mt-4">
            <span className="text-body-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                onClick={() => router.push("/register")}
                className="cursor-pointer font-medium text-gray-900 dark:text-gray-50 hover:text-primary"
              >
                Sign up
              </Link>
            </span>
            <br />
            <Link
              onClick={() => router.push("/forgot-password")}
              className="cursor-pointer text-body-sm text-gray-500 dark:text-gray-400 hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
        );
      case "register":
        return (
          <div className="text-center mt-4">
            <span className="text-body-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                onClick={() => router.push("/login")}
                className="cursor-pointer font-medium text-gray-900 dark:text-gray-50 hover:text-primary"
              >
                Sign in
              </Link>
            </span>
          </div>
        );
      case "forgotPassword":
        return (
          <div className="text-center mt-4">
            <Link
              onClick={() => router.push("/login")}
              className="cursor-pointer text-body-sm text-gray-500 dark:text-gray-400 hover:text-primary"
            >
              ← Back to login
            </Link>
          </div>
        );
      case "updatePassword":
        return (
          <div className="text-center mt-4">
            <Link
              onClick={() => router.push("/login")}
              className="cursor-pointer text-body-sm text-gray-500 dark:text-gray-400 hover:text-primary"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-lg">
      {/* Main Card */}
      <div className="relative z-1 w-full max-w-[460px]">
        <Card
          variant="borderless"
          className="rounded-md shadow-card border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        >
          {/* Header Section */}
          <div className="px-8 pt-8 pb-4 text-center">
            {/* Logo */}
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-md bg-primary flex items-center justify-center shadow-lg"
              style={{
                boxShadow: "0 2px 6px rgba(245, 158, 11, 0.2)",
              }}
            >
              <DatabaseOutlined className="text-[32px] text-white" />
            </div>

            <h2 className="text-h4 font-display font-semibold text-gray-900 dark:text-gray-50 mb-2">
              {getTitle(props.type)}
            </h2>

            <p className="text-body text-gray-600 dark:text-gray-400 block">
              {getDescription(props.type)}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8 pt-4">
            {renderForm()}
            {renderFooter()}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-5 text-gray-400 dark:text-gray-500 text-body-sm">
          IoTDB Enhanced - Time Series Data Management Platform
        </div>
      </div>
    </div>
  );
}

export default AuthPage;

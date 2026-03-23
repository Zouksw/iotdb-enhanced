import { DevtoolsProvider } from "@/providers/devtools";
import { useNotificationProvider } from "@refinedev/antd";
import { GitHubBanner, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";
import { App as AntdApp } from "antd";

import { ColorModeContextProvider } from "@/contexts/color-mode";
import { authProviderClient } from "@/providers/auth-provider/auth-provider.client";
import { dataProvider } from "@/providers/data-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ErrorBoundaryWrapper from "@/components/ErrorBoundaryWrapper";
import "@ant-design/v5-patch-for-react-19";
import "@refinedev/antd/dist/reset.css";
import "@/styles/globals.css";

// Import icons for better navigation
import {
  DashboardOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  AlertOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  EyeOutlined,
  SettingOutlined,
  SafetyOutlined,
  BellOutlined,
  KeyOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export const metadata: Metadata = {
  title: {
    default: "IoTDB Enhanced - Professional Time Series Database",
    template: "%s | IoTDB Enhanced"
  },
  description: "Professional IoT time series database management platform with AI-powered forecasting and anomaly detection",
  keywords: ["iot", "time series database", "forecasting", "anomaly detection", "iotdb", "data analytics"],
  authors: [{ name: "IoTDB Enhanced Team" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://iotdb-enhanced.com",
    title: "IoTDB Enhanced Platform",
    description: "Professional IoT time series database management platform with AI-powered forecasting and anomaly detection",
    siteName: "IoTDB Enhanced",
  },
  twitter: {
    card: "summary_large_image",
    title: "IoTDB Enhanced Platform",
    description: "Professional IoT time series database management platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const theme = cookieStore.get("theme");

  return (
    <html lang="en">
      <head>
        {/* Skip to main content link for accessibility */}
        <style>{`
          .skip-to-content {
            position: absolute;
            top: -40px;
            left: 0;
            background: #0066cc;
            color: white;
            padding: 8px 16px;
            z-index: 100;
            transition: top 0.3s;
          }
          .skip-to-content:focus {
            top: 0;
          }
        `}</style>
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <Suspense>
          <AntdRegistry>
            <AntdApp>
              <GitHubBanner />
              <RefineKbarProvider>
                <ColorModeContextProvider defaultMode={theme?.value}>
                  <DevtoolsProvider>
                    <Refine
                      routerProvider={routerProvider}
                      dataProvider={dataProvider}
                      notificationProvider={useNotificationProvider}
                      authProvider={authProviderClient}
                      resources={[
                      // Dashboard
                      {
                        name: "dashboard",
                        list: "/dashboard",
                        meta: {
                          canDelete: false,
                          label: "Dashboard",
                          icon: <DashboardOutlined />,
                        },
                      },

                      // Data Management
                      {
                        name: "timeseries",
                        list: "/timeseries",
                        create: "/timeseries/create",
                        meta: {
                          canDelete: true,
                          label: "Time Series",
                          icon: <LineChartOutlined />,
                        },
                      },

                      // AI & Analytics
                      {
                        name: "forecasts",
                        list: "/forecasts",
                        create: "/forecasts/create",
                        meta: {
                          canDelete: true,
                          label: "Forecasts",
                          icon: <LineChartOutlined />,
                        },
                      },
                      {
                        name: "anomalies",
                        list: "/anomalies",
                        create: "/anomalies/create",
                        meta: {
                          canDelete: true,
                          label: "Anomalies",
                          icon: <AlertOutlined />,
                        },
                      },

                      // AI Features
                      {
                        name: "ai-models",
                        list: "/ai/models",
                        meta: {
                          canDelete: false,
                          label: "AI Models",
                          icon: <ThunderboltOutlined />,
                        },
                      },
                      {
                        name: "ai-anomalies",
                        list: "/ai/anomalies",
                        meta: {
                          canDelete: false,
                          label: "AI Anomaly Detection",
                          icon: <EyeOutlined />,
                        },
                      },
                      {
                        name: "ai-predict",
                        list: "/ai/predict",
                        meta: {
                          canDelete: false,
                          label: "AI Prediction",
                          icon: <RocketOutlined />,
                        },
                      },

                      // Alerts & Monitoring
                      {
                        name: "alerts",
                        list: "/alerts",
                        create: "/alerts/create",
                        meta: {
                          canDelete: true,
                          label: "Alerts",
                          icon: <BellOutlined />,
                        },
                      },
                      {
                        name: "alert-rules",
                        list: "/alerts/rules",
                        meta: {
                          canDelete: false,
                          label: "Alert Rules",
                          icon: <AlertOutlined />,
                        },
                      },

                      // Developer Tools
                      {
                        name: "apikeys",
                        list: "/apikeys",
                        create: "/apikeys/create",
                        meta: {
                          canDelete: true,
                          label: "API Keys",
                          icon: <KeyOutlined />,
                        },
                      },

                      // Settings
                      {
                        name: "settings",
                        list: "/settings",
                        meta: {
                          canDelete: false,
                          label: "Settings",
                          icon: <SettingOutlined />,
                        },
                      },
                    ]}
                    options={{
                      syncWithLocation: true,
                      warnWhenUnsavedChanges: true,
                      disableTelemetry: true,
                    }}
                  >
                    <main id="main-content">
                      <ErrorBoundaryWrapper>
                        {children}
                      </ErrorBoundaryWrapper>
                    </main>
                    <RefineKbar />
                  </Refine>
                </DevtoolsProvider>
              </ColorModeContextProvider>
            </RefineKbarProvider>
            </AntdApp>
          </AntdRegistry>
        </Suspense>
        {/* Initialize CSRF protection on client side */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              // CSRF protection will be initialized by the csrf module
              // This script ensures it loads early
            }
          `
        }} />
      </body>
    </html>
  );
}

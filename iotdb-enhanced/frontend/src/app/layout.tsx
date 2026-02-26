import { DevtoolsProvider } from "@/providers/devtools";
import { useNotificationProvider } from "@refinedev/antd";
import { GitHubBanner, Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";

import { ColorModeContextProvider } from "@contexts/color-mode";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";
import { dataProvider } from "@providers/data-provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
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
  EyeOutlined,
  SettingOutlined,
  SafetyOutlined,
  BellOutlined,
  KeyOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

export const metadata: Metadata = {
  title: "IoTDB Enhanced Platform",
  description: "Professional IoT time series database management platform with forecasting and anomaly detection",
  icons: {
    icon: "/favicon.ico",
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
      <body>
        <Suspense>
          <AntdRegistry>
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
                        name: "datasets",
                        list: "/datasets",
                        create: "/datasets/create",
                        edit: "/datasets/edit/:id",
                        show: "/datasets/show/:id",
                        meta: {
                          canDelete: true,
                          label: "Datasets",
                          icon: <DatabaseOutlined />,
                        },
                      },
                      {
                        name: "timeseries",
                        list: "/timeseries",
                        create: "/timeseries/create",
                        edit: "/timeseries/edit/:id",
                        show: "/timeseries/show/:id",
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
                        edit: "/forecasts/edit/:id",
                        show: "/forecasts/show/:id",
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
                        edit: "/anomalies/edit/:id",
                        show: "/anomalies/show/:id",
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

                      // Alerts & Monitoring
                      {
                        name: "alerts",
                        list: "/alerts",
                        create: "/alerts/create",
                        edit: "/alerts/edit/:id",
                        show: "/alerts/show/:id",
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
                        edit: "/apikeys/edit/:id",
                        show: "/apikeys/show/:id",
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
                    }}
                  >
                    {children}
                    <RefineKbar />
                  </Refine>
                </DevtoolsProvider>
              </ColorModeContextProvider>
            </RefineKbarProvider>
          </AntdRegistry>
        </Suspense>
      </body>
    </html>
  );
}

"use client";

import React from "react";
import { Card, Typography, theme, Spin } from "antd";
import dynamic from "next/dynamic";

const { Title } = Typography;
const { useToken } = theme;

// Dynamic imports for Recharts components to reduce initial bundle size
const LineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    ),
    ssr: false,
  }
) as React.ComponentType<any>;

const Line = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Line })),
  { ssr: false }
) as React.ComponentType<any>;

const XAxis = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.XAxis })),
  { ssr: false }
) as React.ComponentType<any>;

const YAxis = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.YAxis })),
  { ssr: false }
) as React.ComponentType<any>;

const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.CartesianGrid })),
  { ssr: false }
) as React.ComponentType<any>;

const Tooltip = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Tooltip })),
  { ssr: false }
) as React.ComponentType<any>;

const Legend = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.Legend })),
  { ssr: false }
) as React.ComponentType<any>;

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
) as React.ComponentType<any>;

interface ForecastTrendChartProps {
  data?: Array<{ date: string; count: number }>;
  loading?: boolean;
}

// Mock data for forecast trends over the last 7 days
const mockData = [
  { date: "Mon", count: 12 },
  { date: "Tue", count: 19 },
  { date: "Wed", count: 15 },
  { date: "Thu", count: 25 },
  { date: "Fri", count: 22 },
  { date: "Sat", count: 18 },
  { date: "Sun", count: 28 },
];

export const ForecastTrendChart: React.FC<ForecastTrendChartProps> = ({
  data = mockData,
  loading = false,
}) => {
  const { token } = useToken();

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{ height: "100%" }}
      styles={{ body: { padding: "16px" } }}
    >
      <Title level={5} style={{ fontSize: "16px", marginBottom: 16 }}>
        Forecast Trend (7 Days)
      </Title>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            style={{ fontSize: 12 }}
            stroke="#8c8c8c"
          />
          <YAxis
            style={{ fontSize: 12 }}
            stroke="#8c8c8c"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Forecasts"
            stroke={token.colorPrimary}
            strokeWidth={2}
            dot={{ fill: token.colorPrimary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ForecastTrendChart;

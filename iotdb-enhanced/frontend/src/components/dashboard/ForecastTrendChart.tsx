"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, Typography } from "antd";

const { Title } = Typography;

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
  return (
    <Card
      loading={loading}
      bordered={false}
      style={{ height: "100%" }}
      bodyStyle={{ padding: "16px" }}
    >
      <Title level={5} style={{ marginBottom: 16 }}>
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
            stroke="#667eea"
            strokeWidth={2}
            dot={{ fill: "#667eea", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ForecastTrendChart;

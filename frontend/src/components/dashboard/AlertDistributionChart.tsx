"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, Typography, Tag } from "antd";

const { Title } = Typography;

interface AlertDistributionChartProps {
  data?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  loading?: boolean;
}

const COLORS = {
  critical: "#ef4444",
  high: "#faad14",
  medium: "#1890ff",
  low: "#52c41a",
};

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const AlertDistributionChart: React.FC<AlertDistributionChartProps> = ({
  data,
  loading = false,
}) => {
  // Convert data to chart format
  const chartData = React.useMemo(() => {
    if (!data) {
      return [
        { name: "Critical", value: 2, color: COLORS.critical },
        { name: "High", value: 5, color: COLORS.high },
        { name: "Medium", value: 8, color: COLORS.medium },
        { name: "Low", value: 12, color: COLORS.low },
      ];
    }

    return [
      { name: "Critical", value: data.critical || 0, color: COLORS.critical },
      { name: "High", value: data.high || 0, color: COLORS.high },
      { name: "Medium", value: data.medium || 0, color: COLORS.medium },
      { name: "Low", value: data.low || 0, color: COLORS.low },
    ].filter((item) => item.value > 0);
  }, [data]);

  const total = React.useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{ height: "100%" }}
      styles={{ body: { padding: "16px" } }}
    >
      <Title level={5} style={{ marginBottom: 16 }}>
        Alert Distribution
      </Title>
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8c8c8c",
          }}
        >
          No alerts
        </div>
      )}
    </Card>
  );
};

export default AlertDistributionChart;

"use client";

import React, { useState, useRef } from "react";
import { Card, Button, Space, Typography, Spin, Alert, message, Tooltip as AntTooltip } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import {
  DownloadOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  ExpandOutlined,
  CompressOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface DataPoint {
  timestamp: number;
  value: number;
  isPrediction?: boolean;
  lowerBound?: number;
  upperBound?: number;
}

interface PredictionChartProps {
  timeseries: string;
  historicalData: Array<{ timestamp: number; value: number }>;
  predictionData: {
    timestamps: number[];
    values: number[];
    confidence?: number[];
  };
  algorithm: string;
  height?: number;
  onExport?: (format: 'png' | 'csv') => void;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
  timeseries,
  historicalData,
  predictionData,
  algorithm,
  height = 450,
  onExport,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Combine historical and prediction data
  const chartData = React.useMemo(() => {
    const historical = historicalData.map(d => ({
      timestamp: d.timestamp,
      value: d.value,
      isPrediction: false,
    }));

    const lastHistoricalTimestamp = historical.length > 0
      ? historical[historical.length - 1].timestamp
      : Date.now();

    const predictions = predictionData.timestamps.map((ts, i) => {
      const point: DataPoint = {
        timestamp: ts,
        value: predictionData.values[i],
        isPrediction: true,
      };

      // Add confidence intervals if available
      if (predictionData.confidence && predictionData.confidence[i] !== undefined) {
        const confidence = predictionData.confidence[i];
        point.lowerBound = predictionData.values[i] - confidence;
        point.upperBound = predictionData.values[i] + confidence;
      }

      return point;
    });

    return [...historical, ...predictions];
  }, [historicalData, predictionData]);

  // Format timestamp for display
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format value for display
  const formatValue = (val: number) => {
    return typeof val === "number" ? val.toFixed(2) : val;
  };

  // Export chart as PNG
  const exportAsPNG = async () => {
    if (!chartRef.current) return;

    setExporting(true);
    try {
      // Dynamic import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `prediction-${timeseries.replace(/\./g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      message.success('Chart exported as PNG');
      onExport?.('png');
    } catch (error) {
      message.error('Failed to export chart');
    } finally {
      setExporting(false);
    }
  };

  // Export data as CSV
  const exportAsCSV = () => {
    try {
      const headers = ['Timestamp', 'Value', 'Type', 'Lower Bound', 'Upper Bound'];
      const rows = chartData.map(d => [
        new Date(d.timestamp).toISOString(),
        d.value.toFixed(4),
        d.isPrediction ? 'Prediction' : 'Historical',
        d.lowerBound?.toFixed(4) || '',
        d.upperBound?.toFixed(4) || '',
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.download = `prediction-${timeseries.replace(/\./g, '-')}-${Date.now()}.csv`;
      link.href = URL.createObjectURL(blob);
      link.click();

      message.success('Data exported as CSV');
      onExport?.('csv');
    } catch (error) {
      message.error('Failed to export data');
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.98)",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            minWidth: 180,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            {formatTimestamp(data.timestamp)}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
            Value: {formatValue(data.value)}
          </p>
          {data.isPrediction && (
            <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#6b7280" }}>
              <span style={{
                padding: "2px 6px",
                background: "#dbeafe",
                borderRadius: 4,
                color: "#1e40af",
              }}>
                Prediction
              </span>
            </p>
          )}
          {data.lowerBound !== undefined && (
            <>
              <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#6b7280" }}>
                95% CI: [{formatValue(data.lowerBound)}, {formatValue(data.upperBound)}]
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const historicalStats = React.useMemo(() => {
    if (historicalData.length === 0) return null;
    const values = historicalData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, mean, count: values.length };
  }, [historicalData]);

  const predictionStats = React.useMemo(() => {
    if (predictionData.values.length === 0) return null;
    const values = predictionData.values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, mean, count: values.length };
  }, [predictionData.values]);

  if (chartData.length === 0) {
    return (
      <Card
        variant="borderless"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: "40px", textAlign: "center" } }}
      >
        <Spin size="large" tip="Loading prediction data..." />
      </Card>
    );
  }

  const hasConfidence = predictionData.confidence && predictionData.confidence.length > 0;

  return (
    <div ref={chartRef}>
      <Card
        variant="borderless"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: expanded ? "24px" : "20px" } }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 16 }}>
              Prediction Chart: {timeseries}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Algorithm: {algorithm.toUpperCase()} • {chartData.length} data points
            </Text>
          </Space>

          <Space>
            <Tooltip title="Export as PNG">
              <Button
                icon={<FileImageOutlined />}
                onClick={exportAsPNG}
                loading={exporting}
              >
                PNG
              </Button>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportAsCSV}
              >
                CSV
              </Button>
            </Tooltip>
            <Button
              icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {historicalStats && (
            <>
              <div
                style={{
                  padding: "12px",
                  background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#3730a3", marginBottom: 4 }}>Historical Mean</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#312e81" }}>
                  {formatValue(historicalStats.mean)}
                </div>
              </div>
              <div
                style={{
                  padding: "12px",
                  background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#065f46", marginBottom: 4 }}>Historical Range</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#064e3b" }}>
                  {formatValue(historicalStats.min)} - {formatValue(historicalStats.max)}
                </div>
              </div>
            </>
          )}
          {predictionStats && (
            <>
              <div
                style={{
                  padding: "12px",
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#92400e", marginBottom: 4 }}>Prediction Mean</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#78350f" }}>
                  {formatValue(predictionStats.mean)}
                </div>
              </div>
              <div
                style={{
                  padding: "12px",
                  background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#9f1239", marginBottom: 4 }}>Prediction Range</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#881337" }}>
                  {formatValue(predictionStats.min)} - {formatValue(predictionStats.max)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={expanded ? height * 1.5 : height}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={formatValue}
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Confidence interval area (for predictions only) */}
            {hasConfidence && (
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
                isAnimationActive={false}
              />
            )}

            {/* Historical data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={500}
            />

            {/* Reference line at prediction start */}
            {historicalData.length > 0 && (
              <ReferenceLine
                x={historicalData[historicalData.length - 1].timestamp}
                stroke="#9ca3af"
                strokeDasharray="5 5"
                label={{ value: "Prediction Start", fill: "#6b7280", fontSize: 11, position: "top" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend info */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 24, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 3, background: "#3b82f6" }} />
            <span style={{ color: "#6b7280" }}>Historical Data</span>
          </div>
          {hasConfidence && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 3, background: "#3b82f6", opacity: 0.2 }} />
              <span style={{ color: "#6b7280" }}>95% Confidence Interval</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PredictionChart;

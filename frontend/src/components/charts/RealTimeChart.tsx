"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, Typography, Button, Space, Select, Tag, Spin, Alert, theme } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const { Text } = Typography;
const { useToken } = theme;

interface DataPoint {
  timestamp: number;
  value: number;
}

interface RealTimeChartProps {
  timeseries?: string;
  autoScroll?: boolean;
  maxPoints?: number;
  refreshInterval?: number;
  showStatistics?: boolean;
  height?: number;
  onDisconnect?: () => void;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  timeseries = "root.test2",
  autoScroll = true,
  maxPoints = 100,
  refreshInterval = 2000,
  showStatistics = true,
  height = 400,
  onDisconnect,
}) => {
  const { token } = useToken();
  const [data, setData] = useState<DataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (data.length === 0) return null;
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const last = values[values.length - 1];

    return { min, max, mean, std, last, count: values.length };
  }, [data]);

  // Format timestamp for display
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  // Format value for display
  const formatValue = (val: number) => {
    return typeof val === "number" ? val.toFixed(4) : val;
  };

  // Fetch data point with proper cleanup check
  const fetchDataPoint = useCallback(async () => {
    // Prevent fetching if component is unmounted or paused
    if (!isMountedRef.current || isPaused) return;

    try {
      const response = await fetch(
        `/api/iotdb/query/latest?timeseries=${encodeURIComponent(timeseries)}&limit=1`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();

      if (!isMountedRef.current) return; // Check again after async operation

      if (result.data && result.data.length > 0) {
        const newDataPoint = {
          timestamp: result.data[0].timestamp || Date.now(),
          value: parseFloat(result.data[0].value),
        };

        setData((prevData) => {
          const newData = [...prevData, newDataPoint];
          // Keep only maxPoints
          if (newData.length > maxPoints) {
            return newData.slice(-maxPoints);
          }
          return newData;
        });

        setError(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (isMountedRef.current) {
        setError(message);
      }
    }
  }, [timeseries, isPaused, maxPoints]);

  // Start real-time updates
  const startUpdates = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsConnected(true);
    setLoading(false);

    // Set component as mounted
    isMountedRef.current = true;

    // Fetch initial data
    fetchDataPoint();

    // Set up interval for polling
    intervalRef.current = setInterval(() => {
      fetchDataPoint();
    }, refreshInterval);
  }, [fetchDataPoint, refreshInterval]);

  // Stop real-time updates
  const stopUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  // Cleanup on unmount - CRITICAL for preventing memory leaks
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    return () => {
      // Mark component as unmounted FIRST to prevent state updates
      isMountedRef.current = false;

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Note: wsRef was unused in this component (using polling instead of WebSocket)
      // Kept for potential future WebSocket implementation
    };
  }, []);

  // Auto-start updates when connected state changes
  useEffect(() => {
    if (isConnected && !isPaused) {
      // Updates are already started via startUpdates button
      // This effect ensures polling is active when connected
    }
  }, [isConnected, isPaused]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "12px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            {formatTimestamp(payload[0].payload.timestamp)}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
            Value: {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: "20px" } }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Space direction="vertical" size={0}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 15 }}>
              Real-Time Data
            </Text>
            {isConnected && (
              <Tag
                color="success"
                icon={<SyncOutlined spin />}
                style={{ margin: 0 }}
              >
                LIVE
              </Tag>
            )}
            {isPaused && isConnected && (
              <Tag color="warning" style={{ margin: 0 }}>
                PAUSED
              </Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {timeseries}
          </Text>
        </Space>

        <Space>
          {!isConnected ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={startUpdates}
              loading={loading}
            >
              Start
            </Button>
          ) : (
            <>
              <Button
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                onClick={togglePause}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={clearData}
              >
                Clear
              </Button>
              <Button
                danger
                icon={<DisconnectOutlined />}
                onClick={() => {
                  stopUpdates();
                  onDisconnect?.();
                }}
              >
                Stop
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Connection Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Statistics */}
      {showStatistics && statistics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "#92400e", marginBottom: 4 }}>Current</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#78350f" }}>
              {formatValue(statistics.last)}
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
            <div style={{ fontSize: 11, color: "#065f46", marginBottom: 4 }}>Min</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#064e3b" }}>
              {formatValue(statistics.min)}
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "#1e40af", marginBottom: 4 }}>Max</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e3a8a" }}>
              {formatValue(statistics.max)}
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "#3730a3", marginBottom: 4 }}>Mean</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#312e81" }}>
              {formatValue(statistics.mean)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {data.length === 0 ? (
        <div
          style={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
            borderRadius: 8,
          }}
        >
          <div style={{ textAlign: "center", color: "#9ca3af" }}>
            <SyncOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div style={{ fontSize: 14 }}>
              {isConnected ? "Waiting for data..." : "Click Start to begin real-time monitoring"}
            </div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <Line
              type="monotone"
              dataKey="value"
              stroke={token.colorPrimary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: token.colorPrimary, stroke: token.colorBgElevated, strokeWidth: 2 }}
              animationDuration={300}
            />
            {statistics && (
              <>
                <ReferenceLine
                  y={statistics.mean}
                  stroke="#8b5cf6"
                  strokeDasharray="3 3"
                  label={{ value: "Mean", fill: "#8b5cf6", fontSize: 11 }}
                />
                <ReferenceLine
                  y={statistics.mean + statistics.std}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: "+1σ", fill: "#f59e0b", fontSize: 11 }}
                />
                <ReferenceLine
                  y={statistics.mean - statistics.std}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: "-1σ", fill: "#f59e0b", fontSize: 11 }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Footer Info */}
      {data.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          Showing {data.length} data point{data.length !== 1 ? "s" : ""} • Refresh every {refreshInterval / 1000}s
        </div>
      )}
    </Card>
  );
};

export default RealTimeChart;

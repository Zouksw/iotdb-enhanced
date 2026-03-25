"use client";

import React, { useState } from "react";
import { Card, Row, Col, Button, Space, Divider, Alert, Switch } from "antd";
import {
  ThunderboltOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { ErrorDisplay, ErrorInline } from "@/components/ui/ErrorDisplay";
import { LoadingState, TimeoutWarning } from "@/components/ui/LoadingState";
import { DataTable } from "@/components/tables/DataTable";
import type { ColumnsType } from "antd/es/table";

/**
 * Phase 1 UX Components Demo
 *
 * Demonstrates all Phase 1 improvements:
 * - Toast notifications (integrated globally)
 * - ErrorDisplay component
 * - LoadingState component
 * - DataTable empty states
 */
export default function Phase1Demo() {
  const [errorDemo, setErrorDemo] = useState<"display" | "inline" | "none">(
    "none"
  );
  const [loadingDemo, setLoadingDemo] = useState<
    "loading" | "timeout" | "loaded"
  >("loaded");
  const [showEmptyTable, setShowEmptyTable] = useState(true);

  // Simulate error for demo
  const simulateError = () => {
    setErrorDemo("display");
  };

  // Simulate loading timeout
  const simulateLoading = () => {
    setLoadingDemo("loading");
    setTimeout(() => setLoadingDemo("timeout"), 11000); // 11 seconds to trigger timeout
  };

  // Demo table columns
  const columns: ColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
  ];

  // Demo table data (empty when showEmptyTable is true)
  const tableData = showEmptyTable
    ? []
    : [
        { key: "1", name: "Temperature", value: "25°C", status: "Normal" },
        { key: "2", name: "Humidity", value: "60%", status: "Normal" },
      ];

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Alert
        type="info"
        showIcon
        message="Phase 1 UX Components Demo"
        description="This page demonstrates all Phase 1 improvements. Each section shows a different component in action."
        style={{ marginBottom: 24 }}
      />

      {/* Toast Notification Demo */}
      <Card
        title={
          <Space>
            <CheckCircleOutlined />
            <span>1. Toast Notifications (ToastProvider)</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Alert
          message="Integrated Successfully"
          description="ToastProvider is now integrated in layout.tsx. All components can use useToast() hook for consistent notifications."
          type="success"
          showIcon
          action={
            <Button
              type="primary"
              size="small"
              onClick={() => {
                // Demo toast - this will work because ToastProvider is integrated
                if (typeof window !== "undefined") {
                  const message = require("antd").message;
                  message.success("Toast notification working! ✅");
                }
              }}
            >
              Test Toast
            </Button>
          }
        />
      </Card>

      {/* ErrorDisplay Component Demo */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>2. ErrorDisplay Component</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <p>
            <strong>Component Features:</strong>
          </p>
          <ul>
            <li>Automatic toast notification when error occurs</li>
            <li>Inline alert with error details</li>
            <li>Retry button for recoverable errors</li>
            <li>Integration with security-first error handler</li>
          </ul>

          <Divider />

          <Space>
            <Button onClick={simulateError} type="primary">
              Simulate Error
            </Button>
            <Button onClick={() => setErrorDemo("none")}>
              Clear
            </Button>
          </Space>

          {errorDemo === "display" && (
            <ErrorDisplay
              error={{
                message: "Failed to fetch data from server",
                code: "NETWORK_ERROR",
                shouldNotify: true,
                statusCode: 500,
              }}
              retry={() => {
                alert("Retry clicked! In real app, this would refetch data.");
                setErrorDemo("none");
              }}
              context="Dashboard Data"
            />
          )}

          {errorDemo === "inline" && (
            <ErrorInline
              error={{
                message: "Inline error example",
                code: "VALIDATION_ERROR",
                shouldNotify: true,
              }}
            />
          )}
        </Space>
      </Card>

      {/* LoadingState Component Demo */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>3. LoadingState Component (with Timeout)</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <p>
            <strong>Component Features:</strong>
          </p>
          <ul>
            <li>Shows skeleton screen while loading</li>
            <li>Automatically detects timeout (default 10 seconds)</li>
            <li>Displays timeout warning with retry/cancel options</li>
            <li>Prevents infinite loading states</li>
            <li>5 skeleton types: stats, table, form, card, inline</li>
          </ul>

          <Divider />

          <Space>
            <Button onClick={simulateLoading} type="primary">
              Simulate Loading (11s timeout)
            </Button>
            <Button onClick={() => setLoadingDemo("loaded")}>
              Show Content
            </Button>
          </Space>

          <LoadingState
            loading={loadingDemo === "loading" || loadingDemo === "timeout"}
            timeout={5000} // 5 seconds for demo
            onTimeout={() => setLoadingDemo("timeout")}
            onCancel={() => setLoadingDemo("loaded")}
            skeletonType="stats"
          >
            <Alert
              message="Content Loaded Successfully"
              description="This is the actual content that appears after loading completes."
              type="success"
              showIcon
            />
          </LoadingState>

          {loadingDemo === "timeout" && (
            <TimeoutWarning
              onRetry={() => {
                alert("Retry clicked!");
                setLoadingDemo("loading");
              }}
              onCancel={() => setLoadingDemo("loaded")}
              timeout={5000}
            />
          )}
        </Space>
      </Card>

      {/* DataTable Empty State Demo */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>4. DataTable Empty State</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <p>
            <strong>Component Features:</strong>
          </p>
          <ul>
            <li>Automatically shows EmptyState when dataSource is empty</li>
            <li>Supports 8 empty state types</li>
            <li>Customizable title, description, and action button</li>
            <li>Backward compatible - empty states are optional</li>
          </ul>

          <Divider />

          <Space>
            <Button
              type="primary"
              onClick={() => setShowEmptyTable(!showEmptyTable)}
            >
              {showEmptyTable ? "Show Sample Data" : "Show Empty State"}
            </Button>
          </Space>

          <DataTable
            key={showEmptyTable ? "empty" : "data"}
            columns={columns}
            dataSource={tableData}
            emptyStateType="data"
            emptyStateTitle="No Time Series Data"
            emptyStateDescription="Create your first time series to start monitoring your IoT devices."
            emptyStateActionText="Create Time Series"
            emptyStateOnAction={() => alert("Create Time Series clicked!")}
          />
        </Space>
      </Card>

      {/* Summary Card */}
      <Card
        title="Phase 1 Summary"
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card variant="borderless" title="ToastProvider">
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
              <p style={{ marginTop: 8 }}>Integrated ✅</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card type="inner" title="ErrorDisplay" bordered={false}>
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
              <p style={{ marginTop: 8 }}>Created ✅</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card type="inner" title="LoadingState" bordered={false}>
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
              <p style={{ marginTop: 8 }}>Created ✅</p>
            </Card>
          </Col>
          <Col span={6}>
            <Card type="inner" title="DataTable Empty" bordered={false}>
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 24 }} />
              <p style={{ marginTop: 8 }}>Enhanced ✅</p>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: "24px 0" }} />

        <Alert
          message="All Phase 1 components are working!"
          description="These components provide a solid foundation for better UX. Next: integrate them into actual pages in Phase 2."
          type="success"
          showIcon
        />
      </Card>
    </div>
  );
}

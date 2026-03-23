"use client";

import React from "react";
import { Empty, Button, Space, theme } from "antd";
import {
  FileTextOutlined,
  DatabaseOutlined,
  SearchOutlined,
  PlusOutlined,
  InboxOutlined,
} from "@ant-design/icons";

export type EmptyStateType =
  | "default"
  | "data"
  | "datasets"
  | "timeseries"
  | "alerts"
  | "anomalies"
  | "forecasts"
  | "errors"
  | "search";

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

/**
 * EmptyState - Empty state illustrations with helpful CTAs
 *
 * Provides a standardized empty state component with:
 * - Type-based illustrations with custom icons
 * - Warm, specific messaging
 * - Optional action button
 * - Consistent spacing
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = "default",
  title,
  description,
  actionText,
  onAction,
  illustration,
}) => {
  const { token } = theme.useToken();

  const containerStyle: React.CSSProperties = {
    textAlign: "center",
    padding: `${token.paddingXL}px ${token.paddingLG}px`,
  };

  // Default messages by type - warm and specific
  const defaultMessages: Record<
    EmptyStateType,
    { title: string; description: string; icon: React.ReactNode }
  > = {
    default: {
      title: "Nothing Here Yet",
      description: "When you add items, they'll appear here.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(107, 114, 128, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <InboxOutlined style={{ fontSize: "32px", color: "#6B7280" }} />
        </div>
      ),
    },
    data: {
      title: "No Data Yet",
      description: "Start by adding your first time series or importing existing data.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(0, 102, 204, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <PlusOutlined style={{ fontSize: "32px", color: "#0066CC" }} />
        </div>
      ),
    },
    datasets: {
      title: "No Datasets",
      description: "Create your first dataset to organize and manage your time series data.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(0, 102, 204, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <DatabaseOutlined style={{ fontSize: "32px", color: "#0066CC" }} />
        </div>
      ),
    },
    timeseries: {
      title: "No Time Series",
      description: "Create a time series to start collecting and analyzing your data.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(0, 102, 204, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <PlusOutlined style={{ fontSize: "32px", color: "#0066CC" }} />
        </div>
      ),
    },
    alerts: {
      title: "No Alerts",
      description: "You're all caught up! No alerts need your attention right now.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(16, 185, 129, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <FileTextOutlined style={{ fontSize: "32px", color: "#10B981" }} />
        </div>
      ),
    },
    anomalies: {
      title: "No Anomalies Detected",
      description: "Great! Your data looks normal. No anomalies have been detected.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(16, 185, 129, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <FileTextOutlined style={{ fontSize: "32px", color: "#10B981" }} />
        </div>
      ),
    },
    forecasts: {
      title: "No Forecasts",
      description: "Create AI-powered forecasts to predict future trends in your data.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(139, 92, 246, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <PlusOutlined style={{ fontSize: "32px", color: "#8B5CF6" }} />
        </div>
      ),
    },
    errors: {
      title: "No Errors Detected",
      description: "Everything is running smoothly. No errors to display.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(16, 185, 129, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <FileTextOutlined style={{ fontSize: "32px", color: "#10B981" }} />
        </div>
      ),
    },
    search: {
      title: "No Results Found",
      description: "Try adjusting your search terms or filters to find what you're looking for.",
      icon: (
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: 4,
            background: "rgba(107, 114, 128, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
          }}
        >
          <SearchOutlined style={{ fontSize: "32px", color: "#6B7280" }} />
        </div>
      ),
    },
  };

  const messages = defaultMessages[type];
  const displayTitle = title || messages.title;
  const displayDescription = description || messages.description;
  const displayIllustration = illustration || messages.icon;

  return (
    <div className="empty-state" style={containerStyle}>
      <Space direction="vertical" size={token.marginLG}>
        {displayIllustration}

        <div>
          <div
            style={{
              fontSize: token.fontSizeLG,
              fontWeight: 600,
              color: token.colorText,
              marginBottom: token.marginXS,
            }}
          >
            {displayTitle}
          </div>
          <div
            style={{
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
              lineHeight: 1.5,
            }}
          >
            {displayDescription}
          </div>
        </div>

        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Space>
    </div>
  );
};

// Pre-configured empty states for common use cases
export const NoData: React.FC<{ actionText?: string; onAction?: () => void }> = ({
  actionText = "Add Data",
  onAction,
}) => (
  <EmptyState type="data" actionText={actionText} onAction={onAction} />
);

export const NoDatasets: React.FC<{
  actionText?: string;
  onAction?: () => void;
}> = ({ actionText = "Create Dataset", onAction }) => (
  <EmptyState
    type="datasets"
    actionText={actionText}
    onAction={onAction}
  />
);

export const NoTimeseries: React.FC<{
  actionText?: string;
  onAction?: () => void;
}> = ({ actionText = "Create Time Series", onAction }) => (
  <EmptyState
    type="timeseries"
    actionText={actionText}
    onAction={onAction}
  />
);

export const NoAlerts: React.FC = () => <EmptyState type="alerts" />;

export const NoAnomalies: React.FC = () => <EmptyState type="anomalies" />;

export const NoForecasts: React.FC<{
  actionText?: string;
  onAction?: () => void;
}> = ({ actionText = "Create Forecast", onAction }) => (
  <EmptyState
    type="forecasts"
    actionText={actionText}
    onAction={onAction}
  />
);

export const NoSearchResults: React.FC = () => (
  <EmptyState type="search" />
);

export default EmptyState;
